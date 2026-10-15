import type { APIRoute } from 'astro';
import { WorkshopBookingError, createWorkshopBooking } from '@/features/workshops';

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function asStringRecord(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') record[key] = entry;
  }
  return record;
}

const ERROR_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  SLOT_UNAVAILABLE: 409,
};

function wixApplicationCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const details = (error as { details?: { applicationError?: { code?: unknown } } }).details;
  const code = details?.applicationError?.code;
  return typeof code === 'string' ? code : undefined;
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const payload = (body ?? {}) as { serviceId?: unknown; localStartDate?: unknown; values?: unknown };
  const values = asStringRecord(payload.values);
  if (
    typeof payload.serviceId !== 'string' ||
    typeof payload.localStartDate !== 'string' ||
    !values
  ) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  try {
    const receipt = await createWorkshopBooking({
      serviceId: payload.serviceId,
      localStartDate: payload.localStartDate,
      values,
    });
    return json({ booking: receipt }, 200);
  } catch (error) {
    if (error instanceof WorkshopBookingError) {
      return json({ error: error.code }, ERROR_STATUS[error.code] ?? 400);
    }
    const wixCode = wixApplicationCode(error);
    if (wixCode === 'SLOT_NOT_AVAILABLE') return json({ error: 'SLOT_UNAVAILABLE' }, 409);
    if (wixCode === 'INVALID_ARGUMENT') return json({ error: 'INVALID_INPUT' }, 400);
    console.error('[bookings-api] booking creation failed:', error);
    return json({ error: 'INTERNAL' }, 500);
  }
};
