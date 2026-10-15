import type { APIRoute } from 'astro';
import {
  SITE_TIMEZONE,
  WorkshopBookingError,
  getWorkshopById,
  isLocalDate,
  listWorkshopSlots,
  siteToday,
} from '@/utils/bookings';

const MAX_DAYS_AHEAD = 60;

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const serviceId = url.searchParams.get('serviceId') ?? '';
  const date = url.searchParams.get('date') ?? '';

  if (!serviceId || !isLocalDate(date)) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const today = siteToday();
  const maxDate = new Date(Date.parse(`${today}T00:00:00Z`) + MAX_DAYS_AHEAD * 86_400_000)
    .toISOString()
    .slice(0, 10);
  if (date < today || date > maxDate) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  try {
    const workshop = await getWorkshopById(serviceId);
    if (!workshop) return json({ error: 'NOT_FOUND' }, 404);
    const slots = await listWorkshopSlots(workshop, date);
    return json({ timeZone: SITE_TIMEZONE, slots }, 200);
  } catch (error) {
    if (error instanceof WorkshopBookingError) {
      return json({ error: error.code }, 400);
    }
    console.error('[bookings-api] slots lookup failed:', error);
    return json({ error: 'INTERNAL' }, 500);
  }
};
