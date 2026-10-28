import { orders, rsvpV2, ticketReservations, wixEventsV2 } from '@wix/events';
import { auth } from '@wix/essentials';
import type { RicosDocument } from '@/shared/ricos';
import { resolveWixImageUrl } from '@/shared/wix-image';

export interface EventInfo {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  description: RicosDocument | string | null;
  initialType: 'RSVP' | 'TICKETING';
  registrationStatus: string | null;
  eventStatus: string | null;
  startUtc: string | null;
  endUtc: string | null;
  timeZoneId: string | null;
  formattedDate: string | null;
  venue: string | null;
  image: { url: string; width: number; height: number; altText: string } | null;
  lowestPrice: { value: string; currency: string } | null;
}

export interface EventTier {
  id: string;
  name: string;
  description: string | null;
  priceValue: string;
  currency: string;
  free: boolean;
  saleStatus: string | null;
  limitPerCheckout: number | null;
}

const EVENTS_PAGE_LIMIT = 50;
const EVENT_CARD_IMAGE_WIDTH = 800;
const EVENT_CARD_IMAGE_HEIGHT = 800;

const queryEventsElevated = auth.elevate(wixEventsV2.queryEvents);
const getEventBySlugElevated = auth.elevate(wixEventsV2.getEventBySlug);
const getEventElevated = auth.elevate(wixEventsV2.getEvent);
const queryAvailableTicketsElevated = auth.elevate(orders.queryAvailableTickets);

interface EventRecord {
  _id?: string;
  slug?: string;
  title?: string;
  shortDescription?: string | null;
  description?: RicosDocument | string | null;
  mainImage?:
    | string
    | { id?: string; url?: string; altText?: string | null; height?: number | null; width?: number | null }
    | null;
  dateAndTimeSettings?: {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    timeZoneId?: string | null;
    formatted?: { dateAndTime?: string | null } | null;
  } | null;
  location?: { name?: string | null; type?: string | null } | null;
  registration?: {
    initialType?: string | null;
    status?: string | null;
    tickets?: { lowestPrice?: { value?: string; currency?: string } | null } | null;
  } | null;
  status?: string | null;
}

interface TierRecord {
  _id?: string;
  name?: string;
  description?: string | null;
  price?: { amount?: string; value?: string; currency?: string } | null;
  pricing?: { fixedPrice?: { value?: string; currency?: string } | null } | null;
  free?: boolean;
  saleStatus?: string | null;
  limitPerCheckout?: number | null;
}

function toInstant(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function eventImage(record: EventRecord): EventInfo['image'] {
  if (!record.mainImage) return null;

  let id: string | null = null;
  let altText = record.title ?? '';
  if (typeof record.mainImage === 'string') {
    const path = record.mainImage.split('#')[0].split('/').filter(Boolean);
    id = path[2] ?? null;
    altText = path[3] ? decodeURIComponent(path[3]).replace(/\.[a-z0-9]+$/i, '') : altText;
  } else {
    id = record.mainImage.id ?? null;
    altText = record.mainImage.altText ?? altText;
  }
  if (!id) return null;

  const url = resolveWixImageUrl(`wix:image://v1/${id}/image`, EVENT_CARD_IMAGE_WIDTH, EVENT_CARD_IMAGE_HEIGHT);
  if (!url) return null;
  return { url, width: EVENT_CARD_IMAGE_WIDTH, height: EVENT_CARD_IMAGE_HEIGHT, altText };
}

function tierPriceValue(record: TierRecord): string {
  return record.price?.amount ?? record.price?.value ?? record.pricing?.fixedPrice?.value ?? '';
}

function toEvent(record: EventRecord): EventInfo | null {
  const id = record._id ?? '';
  const slug = record.slug ?? '';
  if (!id || !slug) return null;

  // Over the JS SDK mainImage arrives as a prebuilt wix:image URI string with
  // the alt text embedded as the file-name segment; over REST it's an object.
  const mainImage = eventImage(record);

  const lowestPrice = record.registration?.tickets?.lowestPrice;
  const initialType = record.registration?.initialType;

  return {
    id,
    slug,
    title: record.title ?? '',
    shortDescription: record.shortDescription ?? null,
    description: record.description ?? null,
    initialType: initialType === 'TICKETING' ? 'TICKETING' : 'RSVP',
    registrationStatus: record.registration?.status ?? null,
    eventStatus: record.status ?? null,
    startUtc: toInstant(record.dateAndTimeSettings?.startDate),
    endUtc: toInstant(record.dateAndTimeSettings?.endDate),
    timeZoneId: record.dateAndTimeSettings?.timeZoneId ?? null,
    formattedDate: record.dateAndTimeSettings?.formatted?.dateAndTime ?? null,
    venue: record.location?.name ?? null,
    image: mainImage && mainImage.url ? mainImage : null,
    lowestPrice: lowestPrice?.value ? { value: lowestPrice.value, currency: lowestPrice.currency ?? '' } : null,
  };
}

function toTier(record: TierRecord): EventTier | null {
  const id = record._id ?? '';
  if (!id) return null;
  return {
    id,
    name: record.name ?? '',
    description: record.description ?? null,
    priceValue: tierPriceValue(record),
    currency: record.price?.currency ?? record.pricing?.fixedPrice?.currency ?? '',
    free: record.free === true,
    saleStatus: record.saleStatus ?? null,
    limitPerCheckout: typeof record.limitPerCheckout === 'number' ? record.limitPerCheckout : null,
  };
}

const EVENT_FIELDS = ['DETAILS', 'TEXTS', 'REGISTRATION', 'URLS'] as const;

export async function listEvents(): Promise<EventInfo[]> {
  try {
    const result = await queryEventsElevated(
      {
        filter: { status: { $in: ['UPCOMING', 'STARTED'] } },
        sort: [{ fieldName: 'dateAndTimeSettings.startDate', order: 'ASC' }],
        paging: { offset: 0, limit: EVENTS_PAGE_LIMIT },
      },
      { fields: [...EVENT_FIELDS] },
    );
    return (result.events ?? [])
      .map((record) => toEvent(record as EventRecord))
      .filter((event): event is EventInfo => event !== null);
  } catch (error) {
    console.error('[events] listEvents failed:', error);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<EventInfo | null> {
  if (!slug) return null;
  try {
    const result = await getEventBySlugElevated(slug, { fields: [...EVENT_FIELDS] });
    const record = (result as { event?: EventRecord }).event;
    return record ? toEvent(record) : null;
  } catch (error) {
    console.error(`[events] getEventBySlug("${slug}") failed:`, error);
    return null;
  }
}

export async function getEventById(eventId: string): Promise<EventInfo | null> {
  if (!eventId) return null;
  try {
    const record = (await getEventElevated(eventId, { fields: [...EVENT_FIELDS] })) as unknown as EventRecord;
    return toEvent(record);
  } catch (error) {
    console.error(`[events] getEventById("${eventId}") failed:`, error);
    return null;
  }
}

export async function listTicketTiers(eventId: string): Promise<EventTier[]> {
  if (!eventId) return [];
  try {
    const result = await queryAvailableTicketsElevated({ filter: { eventId }, limit: 20 });
    return (result.definitions ?? [])
      .map((record) => toTier(record as TierRecord))
      .filter((tier): tier is EventTier => tier !== null);
  } catch (error) {
    console.error(`[events] listTicketTiers("${eventId}") failed:`, error);
    return [];
  }
}

export async function createRsvp(input: {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
}): Promise<void> {
  await rsvpV2.createRsvp({
    eventId: input.eventId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    status: 'YES',
  });
}

export async function reserveTickets(input: {
  tickets: { ticketDefinitionId: string; quantity: number }[];
}): Promise<string> {
  const reservation = await ticketReservations.createTicketReservation({ tickets: input.tickets });
  return (reservation as { _id?: string })._id ?? '';
}
