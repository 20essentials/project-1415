import { describe, expect, it, vi, beforeEach } from 'vitest';

const createRedirectSession = vi.fn();
const readSiteLanguage = vi.fn(() => 'en');

vi.mock('@wix/redirects', () => ({
  redirects: {
    createRedirectSession: (...args: unknown[]) => createRedirectSession(...args),
  },
}));

vi.mock('@/shared/i18n', () => ({
  readSiteLanguage: () => readSiteLanguage(),
}));

import { createWorkshopCheckout } from '@/features/workshops/workshop-checkout';
import { WorkshopCheckoutError } from '@/features/workshops/bookings';

describe('createWorkshopCheckout', () => {
  beforeEach(() => {
    createRedirectSession.mockReset();
    readSiteLanguage.mockReset();
    readSiteLanguage.mockReturnValue('en');
  });

  it('calls redirects.createRedirectSession with bookingsCheckout payload', async () => {
    createRedirectSession.mockResolvedValue({
      redirectSession: { fullUrl: 'https://checkout.example.com/session/123' },
    });

    const url = await createWorkshopCheckout({
      serviceId: 'svc-1',
      localStartDate: '2026-10-25T10:00:00',
      timezone: 'Europe/Rome',
      postFlowUrl: 'https://example.com/services?booking=cancelled',
      thankYouPageUrl: 'https://example.com/booking-confirmation?id=book-1',
    });

    expect(url).toBe('https://checkout.example.com/session/123');
    expect(createRedirectSession).toHaveBeenCalledTimes(1);
    const args = createRedirectSession.mock.calls[0][0];
    expect(args.bookingsCheckout.slotAvailability.slot.serviceId).toBe('svc-1');
    expect(args.bookingsCheckout.slotAvailability.slot.startDate).toBe('2026-10-25T10:00:00Z');
    expect(args.callbacks.postFlowUrl).toContain('booking=cancelled');
    expect(args.callbacks.thankYouPageUrl).toContain('booking-confirmation');
    expect(args.preferences.additionalQueryParameters.lang).toBe('en');
  });

  it('propagates language from readSiteLanguage', async () => {
    readSiteLanguage.mockReturnValue('it');
    createRedirectSession.mockResolvedValue({ redirectSession: { fullUrl: 'https://x/y' } });

    await createWorkshopCheckout({
      serviceId: 'svc-1',
      localStartDate: '2026-10-25T10:00:00',
      timezone: 'Europe/Rome',
      postFlowUrl: 'https://x/services',
      thankYouPageUrl: 'https://x/booking-confirmation',
    });

    expect(createRedirectSession.mock.calls[0][0].preferences.additionalQueryParameters.lang).toBe('it');
  });

  it('throws CHECKOUT_UNAVAILABLE when fullUrl missing', async () => {
    createRedirectSession.mockResolvedValue({ redirectSession: {} });

    let threw = false;
    try {
      await createWorkshopCheckout({
        serviceId: 'svc-1',
        localStartDate: '2026-10-25T10:00:00',
        timezone: 'Europe/Rome',
        postFlowUrl: 'https://x/services',
        thankYouPageUrl: 'https://x/booking-confirmation',
      });
    } catch (e) {
      threw = true;
      expect((e as WorkshopCheckoutError).code).toBe('CHECKOUT_UNAVAILABLE');
    }
    expect(threw).toBe(true);
  });
});
