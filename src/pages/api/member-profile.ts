import type { APIRoute } from 'astro';
import { members } from '@wix/members';
import { MemberProfileError, updateMemberProfile } from '@/features/account/member-profile';

const NAME_MAX = 100;
const NICKNAME_MAX = 100;

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const ERROR_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  NOT_AUTHENTICATED: 401,
  FAILED: 500,
};

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const payload = (body ?? {}) as {
    firstName?: unknown;
    lastName?: unknown;
    nickname?: unknown;
  };

  const firstName = typeof payload.firstName === 'string' ? payload.firstName.trim() : '';
  const lastName = typeof payload.lastName === 'string' ? payload.lastName.trim() : '';
  const nickname = typeof payload.nickname === 'string' ? payload.nickname.trim() : '';

  if (firstName.length > NAME_MAX || lastName.length > NAME_MAX || nickname.length > NICKNAME_MAX) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  let memberId: string | null = null;
  try {
    const res = await members.getCurrentMember({ fieldsets: ['FULL'] });
    memberId = res.member?._id ?? null;
  } catch {
    memberId = null;
  }

  if (!memberId) {
    return json({ error: 'NOT_AUTHENTICATED' }, 401);
  }

  try {
    await updateMemberProfile(memberId, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      nickname: nickname || undefined,
    });
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof MemberProfileError) {
      return json({ error: error.code }, ERROR_STATUS[error.code] ?? 500);
    }
    console.error('[member-profile-api] update failed:', error);
    return json({ error: 'FAILED' }, 500);
  }
};
