import type { APIRoute } from 'astro';
import { getWorkshopById } from '@/features/workshops/bookings';
import type { WaitlistJoinCode } from '@/features/workshops/waitlist';
import { WaitlistJoinError, joinWaitlist } from '@/features/workshops/waitlist';

const STATUS_BY_CODE: Record<WaitlistJoinCode, number> = {
  INVALID_INPUT: 400,
  ALREADY_LISTED: 200,
  UNAVAILABLE: 503,
};

export const POST: APIRoute = async ({ request }) => {
  const body: unknown = await request.json().catch(() => null);
  const fields =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {};
  const workshopId = typeof fields.workshopId === 'string' ? fields.workshopId : '';
  const sessionStart = typeof fields.sessionStart === 'string' ? fields.sessionStart : '';
  const firstName = typeof fields.firstName === 'string' ? fields.firstName : '';
  const email = typeof fields.email === 'string' ? fields.email : '';

  const workshop = await getWorkshopById(workshopId);
  if (!workshop) {
    return new Response(JSON.stringify({ error: 'NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const entry = await joinWaitlist({
      workshopId: workshop.id,
      workshopName: workshop.name,
      sessionStart,
      firstName,
      email,
    });
    return new Response(JSON.stringify({ entry }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof WaitlistJoinError) {
      return new Response(JSON.stringify({ error: error.code }), {
        status: STATUS_BY_CODE[error.code] ?? 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('[waitlist-api] join failed:', error);
    return new Response(JSON.stringify({ error: 'INTERNAL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
