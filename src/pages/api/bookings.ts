import type { APIRoute } from 'astro';
import { WorkshopBookingError, WorkshopCheckoutError, createWorkshopBooking } from '@/features/workshops/bookings';
import { createWorkshopCheckout } from '@/features/workshops/workshop-checkout';
import { localeUrl } from '@/shared/i18n';

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
  CHECKOUT_UNAVAILABLE: 502,
};

function wixApplicationCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const details = (error as { details?: { applicationError?: { code?: unknown } } }).details;
  const code = details?.applicationError?.code;
  return typeof code === 'string' ? code : undefined;
}

function getOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://localhost';
  }
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const payload = (body ?? {}) as {
    serviceId?: unknown;
    localStartDate?: unknown;
    values?: unknown;
    payment?: unknown;
    language?: unknown;
  };
  const values = asStringRecord(payload.values);
  if (
    typeof payload.serviceId !== 'string' ||
    typeof payload.localStartDate !== 'string' ||
    !values
  ) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const language =
    typeof payload.language === 'string' && /^[a-z]{2,3}$/i.test(payload.language)
      ? payload.language.toLowerCase()
      : 'en';

  const payment = payload.payment === 'online' ? 'online' : 'offline';
  const origin = getOrigin(request);

  try {
    if (payment === 'online') {
      const receipt = await createWorkshopBooking({
        serviceId: payload.serviceId,
        localStartDate: payload.localStartDate,
        values,
        paymentOption: 'ONLINE',
      });

      try {
        const checkoutUrl = await createWorkshopCheckout({
          serviceId: payload.serviceId,
          localStartDate: payload.localStartDate,
          timezone: 'Europe/Rome',
          language,
          postFlowUrl: `${origin}${localeUrl(`/services/${receipt.slug}?booking=cancelled`, language)}`,
          thankYouPageUrl: `${origin}/booking-confirmation?id=${encodeURIComponent(receipt.id)}&service=${encodeURIComponent(receipt.serviceName)}&start=${encodeURIComponent(receipt.localStartDate)}&end=${encodeURIComponent(receipt.localEndDate)}`,
        });
        return json({ booking: receipt, checkoutUrl }, 200);
      } catch (checkoutError) {
        if (checkoutError instanceof WorkshopCheckoutError) {
          const code = checkoutError.code === 'INVALID_INPUT' ? 'INVALID_INPUT' : 'CHECKOUT_UNAVAILABLE';
          return json({ error: code }, code === 'INVALID_INPUT' ? 400 : 502);
        }
        if (checkoutError instanceof WorkshopBookingError) {
          return json({ error: checkoutError.code }, ERROR_STATUS[checkoutError.code] ?? 400);
        }
        console.error('[bookings-api] checkout creation failed:', checkoutError);
        return json({ error: 'CHECKOUT_UNAVAILABLE' }, 502);
      }
    }

    const receipt = await createWorkshopBooking({
      serviceId: payload.serviceId,
      localStartDate: payload.localStartDate,
      values,
      paymentOption: 'OFFLINE',
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
