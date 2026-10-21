import { members } from '@wix/members';
import { auth } from '@wix/essentials';

export interface MemberProfileInput {
  firstName?: string;
  lastName?: string;
  nickname?: string;
}

export type MemberProfileCode = 'INVALID_INPUT' | 'NOT_AUTHENTICATED' | 'FAILED';

export class MemberProfileError extends Error {
  constructor(
    public readonly code: MemberProfileCode,
    message: string,
  ) {
    super(message);
    this.name = 'MemberProfileError';
  }
}

const NAME_MAX = 100;
const NICKNAME_MAX = 100;

export async function updateMemberProfile(memberId: string, input: MemberProfileInput): Promise<void> {
  const id = memberId.trim();
  if (!id) {
    throw new MemberProfileError('NOT_AUTHENTICATED', 'Member id is missing');
  }

  const firstName = typeof input.firstName === 'string' ? input.firstName.trim() : '';
  const lastName = typeof input.lastName === 'string' ? input.lastName.trim() : '';
  const nickname = typeof input.nickname === 'string' ? input.nickname.trim() : '';

  if (firstName.length > NAME_MAX || lastName.length > NAME_MAX || nickname.length > NICKNAME_MAX) {
    throw new MemberProfileError('INVALID_INPUT', 'Input length exceeds limit');
  }

  const contact: Record<string, string | undefined> = {};
  if (firstName || lastName) {
    contact.firstName = firstName || undefined;
    contact.lastName = lastName || undefined;
  }

  const profile: Record<string, string | undefined> = {};
  if (nickname) {
    profile.nickname = nickname;
  }

  try {
    const updatePayload: Record<string, unknown> = {};
    if (Object.keys(contact).length > 0) {
      updatePayload.contact = contact;
    }
    if (Object.keys(profile).length > 0) {
      updatePayload.profile = profile;
    }
    await auth.elevate(members.updateMember)(id, updatePayload);
  } catch (error) {
    console.error('[member-profile] updateMember failed:', error);
    throw new MemberProfileError('FAILED', 'Failed to update member profile');
  }
}
