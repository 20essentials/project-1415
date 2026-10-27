import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createCart, createRedirectSession } = vi.hoisted(() => ({
  createCart: vi.fn(),
  createRedirectSession: vi.fn(),
}));

vi.mock('@wix/auto_sdk_ecom_cart-v-2', () => ({
  createCart: (...args: unknown[]) => createCart(...args),
}));
vi.mock('@wix/redirects', () => ({
  redirects: {
    createRedirectSession: (...args: unknown[]) => createRedirectSession(...args),
  },
}));

const REDIRECT_SESSION = {
  redirectSession: {
    fullUrl: 'https://checkout.test/session?lang=en',
    urlDetails: { endpoint: 'https://checkout.test/fallback' },
    shortUrl: 'https://checkout.test/s',
  },
};

async function loadFeature() {
  vi.resetModules();
  return import('@/features/donations/checkout');
}

const validInput = {
  campaignId: '22aba8a5-0398-4231-8701-dcf16f0cecb5',
  amount: 25,
  language: 'en',
  postFlowUrl: 'https://site.test/donate',
  thankYouPageUrl: 'https://site.test/donations/thank-you',
};

describe('createDonationCheckout', () => {
  beforeEach(() => {
    createCart.mockReset();
    createRedirectSession.mockReset();
  });

  it('creates a one-time donation cart and resolves the hosted checkout URL', async () => {
    createCart.mockResolvedValue({ _id: 'cart-1' });
    createRedirectSession.mockResolvedValue(REDIRECT_SESSION);
    const { createDonationCheckout } = await loadFeature();

    const url = await createDonationCheckout(validInput);

    expect(url).toBe('https://checkout.test/session?lang=en');
    expect(createCart).toHaveBeenCalledWith({
      cart: { source: { channelType: 'WEB' } },
      catalogItems: [
        {
          quantity: 1,
          catalogReference: {
            appId: '333b456e-dd48-4d6b-b32b-9fd48d74e163',
            catalogItemId: '22aba8a5-0398-4231-8701-dcf16f0cecb5',
            options: { amount: 25 },
          },
        },
      ],
    });
    expect(createRedirectSession).toHaveBeenCalledWith({
      ecomCheckout: { checkoutId: 'cart-1' },
      callbacks: {
        postFlowUrl: 'https://site.test/donate',
        thankYouPageUrl: 'https://site.test/donations/thank-you',
      },
      preferences: { additionalQueryParameters: { lang: 'en' } },
    });
  });

  it('omits frequency so the donation stays one-time', async () => {
    createCart.mockResolvedValue({ _id: 'cart-1' });
    createRedirectSession.mockResolvedValue(REDIRECT_SESSION);
    const { createDonationCheckout } = await loadFeature();

    await createDonationCheckout(validInput);

    expect(JSON.stringify(createCart.mock.calls[0][0])).not.toContain('frequency');
  });

  it('falls back to urlDetails.endpoint and then shortUrl', async () => {
    createCart.mockResolvedValue({ _id: 'cart-1' });
    createRedirectSession.mockResolvedValue({ redirectSession: { urlDetails: { endpoint: 'https://checkout.test/fallback' } } });
    const { createDonationCheckout } = await loadFeature();
    await expect(createDonationCheckout(validInput)).resolves.toBe('https://checkout.test/fallback');

    createRedirectSession.mockResolvedValue({ redirectSession: { shortUrl: 'https://checkout.test/s' } });
    await expect(createDonationCheckout(validInput)).resolves.toBe('https://checkout.test/s');
  });

  it('rejects missing input with INVALID_INPUT before calling the SDK', async () => {
    const { createDonationCheckout, DonationCheckoutError } = await loadFeature();

    await expect(
      createDonationCheckout({ ...validInput, campaignId: '' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(
      createDonationCheckout({ ...validInput, amount: 0 }),
    ).rejects.toBeInstanceOf(DonationCheckoutError);
    expect(createCart).not.toHaveBeenCalled();
    expect(createRedirectSession).not.toHaveBeenCalled();
  });

  it('rejects with CHECKOUT_UNAVAILABLE when the cart has no id', async () => {
    createCart.mockResolvedValue({});
    const { createDonationCheckout } = await loadFeature();

    await expect(createDonationCheckout(validInput)).rejects.toMatchObject({
      code: 'CHECKOUT_UNAVAILABLE',
    });
    expect(createRedirectSession).not.toHaveBeenCalled();
  });

  it('rejects with CHECKOUT_UNAVAILABLE when the redirect session has no URL', async () => {
    createCart.mockResolvedValue({ _id: 'cart-1' });
    createRedirectSession.mockResolvedValue({ redirectSession: {} });
    const { createDonationCheckout } = await loadFeature();

    await expect(createDonationCheckout(validInput)).rejects.toMatchObject({
      code: 'CHECKOUT_UNAVAILABLE',
    });
  });

  it('rejects with CHECKOUT_UNAVAILABLE when the SDK throws', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    createCart.mockRejectedValue(new Error('boom'));
    const { createDonationCheckout } = await loadFeature();

    await expect(createDonationCheckout(validInput)).rejects.toMatchObject({
      code: 'CHECKOUT_UNAVAILABLE',
    });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
