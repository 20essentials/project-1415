import { items } from '@wix/data';
import { auth } from '@wix/essentials';

export interface WaitlistEntryDTO {
  id: string;
  workshopId: string;
  workshopName: string;
  sessionStart: string;
  firstName: string;
  email: string;
  status: 'waiting' | 'notified';
  createdDate: string | null;
}

export type WaitlistJoinCode = 'INVALID_INPUT' | 'ALREADY_LISTED' | 'UNAVAILABLE';

export class WaitlistJoinError extends Error {
  constructor(
    public readonly code: WaitlistJoinCode,
    message: string,
  ) {
    super(message);
    this.name = 'WaitlistJoinError';
  }
}

const WAITLIST_COLLECTION = 'workshop-waitlist';

// Created via REST (create-data-collection) with the same schema as the
// `workshop-waitlist` Data Collections extension; if the extension ever
// registers a namespaced copy at release, re-check this constant.
// Sold-out appointment sessions are omitted from availability entirely, so the
// island joins for a date (YYYY-MM-DD); datetime keys cover per-session lists.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_SESSION_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;

interface WaitlistRecord {
  _id?: string;
  workshopId?: string;
  workshopName?: string;
  sessionStart?: string;
  firstName?: string;
  email?: string;
  status?: string;
  createdDate?: Date | string;
}

const queryElevated = auth.elevate(items.query);
const insertElevated = auth.elevate(items.insert);

function toIso(value: Date | string | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toEntry(record: WaitlistRecord): WaitlistEntryDTO {
  return {
    id: record._id ?? '',
    workshopId: record.workshopId ?? '',
    workshopName: record.workshopName ?? '',
    sessionStart: record.sessionStart ?? '',
    firstName: record.firstName ?? '',
    email: record.email ?? '',
    status: record.status === 'notified' ? 'notified' : 'waiting',
    createdDate: toIso(record.createdDate),
  };
}

export async function findWaitlistEntry(
  workshopId: string,
  sessionStart: string,
  email: string,
): Promise<WaitlistEntryDTO | null> {
  const result = await queryElevated(WAITLIST_COLLECTION)
    .eq('workshopId', workshopId)
    .eq('sessionStart', sessionStart)
    .eq('email', email.trim().toLowerCase())
    .limit(1)
    .find();
  const record = (result.items ?? [])[0] as WaitlistRecord | undefined;
  return record ? toEntry(record) : null;
}

export async function listWaitlistEntries(sessionStart: string): Promise<WaitlistEntryDTO[]> {
  const result = await queryElevated(WAITLIST_COLLECTION)
    .eq('sessionStart', sessionStart)
    .ascending('createdDate')
    .limit(100)
    .find();
  return ((result.items ?? []) as WaitlistRecord[])
    .map(toEntry)
    .filter((entry) => entry.id.length > 0);
}

export async function joinWaitlist(input: {
  workshopId: string;
  workshopName: string;
  sessionStart: string;
  firstName: string;
  email: string;
}): Promise<WaitlistEntryDTO> {
  if (!input.workshopId || !LOCAL_SESSION_PATTERN.test(input.sessionStart)) {
    throw new WaitlistJoinError('INVALID_INPUT', 'Missing or malformed session');
  }
  const firstName = input.firstName.trim();
  const email = input.email.trim();
  if (!firstName || !EMAIL_PATTERN.test(email)) {
    throw new WaitlistJoinError('INVALID_INPUT', 'Name and a valid email are required');
  }

  const existing = await findWaitlistEntry(input.workshopId, input.sessionStart, email);
  if (existing) throw new WaitlistJoinError('ALREADY_LISTED', 'Already on the list');

  const now = new Date();
  try {
    const created = await insertElevated(WAITLIST_COLLECTION, {
      workshopId: input.workshopId,
      workshopName: input.workshopName,
      sessionStart: input.sessionStart,
      firstName,
      email: email.toLowerCase(),
      status: 'waiting',
      createdDate: now,
    });
    return toEntry(created);
  } catch (error) {
    console.error('[waitlist] insert failed:', error);
    throw new WaitlistJoinError('UNAVAILABLE', 'Waitlist is unavailable');
  }
}
