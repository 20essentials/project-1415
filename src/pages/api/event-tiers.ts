import type { APIRoute } from 'astro';
import { listTicketTiers } from '@/features/events/events';

export const GET: APIRoute = async ({ request }) => {
  const eventId =
    new URL(request.url).searchParams.get('eventId')?.trim() ?? '';
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'INVALID_INPUT' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const tiers = await listTicketTiers(eventId);
    return new Response(JSON.stringify({ tiers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 200 + flag y no 500: así el cliente pinta su fallback (alerta + retry)
    // sin que el navegador loguee "Failed to load resource".
    console.error('[event-tiers-api] list failed:', error);
    return new Response(JSON.stringify({ tiers: [], error: 'FAILED' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
