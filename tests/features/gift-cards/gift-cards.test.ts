import { beforeEach, describe, expect, it, vi } from 'vitest';

const { find, limit, queryGiftCardProducts } = vi.hoisted(() => {
  const find = vi.fn();
  const limit = vi.fn(() => ({ find }));
  const queryGiftCardProducts = vi.fn(() => ({ limit }));
  return { find, limit, queryGiftCardProducts };
});

vi.mock('@wix/auto_sdk_gift-vouchers_gift-voucher-products', () => ({
  queryGiftCardProducts: () => queryGiftCardProducts(),
}));

const PRODUCT_ID = '34e53e4e-a329-4aef-b4b2-6f4350f944e2';
const IMAGE_ID = 'e90a2a_c3de803545f340df9dd4aa88a72e0718~mv2.png';

const sdkProduct = {
  _id: PRODUCT_ID,
  revision: '1',
  name: 'eGift Card',
  description: 'A gift card for the carnivorous garden',
  image: `wix:image://v1/${IMAGE_ID}#originWidth=600&originHeight=600`,
  expirationType: 'UNKNOWN_EXPIRATION_TYPE',
  presetVariants: [
    {
      _id: '37d870be-8206-4fa6-bc85-556639d66671',
      price: { amount: '25', formattedAmount: '25,00€' },
      value: { amount: '25', formattedAmount: '25,00€' },
    },
    {
      _id: 'd76d745f-fd80-4345-accd-6932775e4ea8',
      price: { amount: '50', formattedAmount: '50,00€' },
    },
  ],
};

async function loadFeature() {
  vi.resetModules();
  return import('@/features/gift-cards/gift-cards');
}

describe('getGiftCardProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    find.mockResolvedValue({ items: [sdkProduct] });
    limit.mockReturnValue({ find });
    queryGiftCardProducts.mockReturnValue({ limit });
  });

  it('queries the gift card products endpoint limited to one', async () => {
    const { getGiftCardProduct } = await loadFeature();

    await getGiftCardProduct();

    expect(queryGiftCardProducts).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(1);
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('maps the SDK payload onto the public GiftCardProduct shape', async () => {
    const { getGiftCardProduct } = await loadFeature();

    const product = await getGiftCardProduct();

    expect(product).toMatchObject({
      id: PRODUCT_ID,
      revision: '1',
      name: 'eGift Card',
      description: 'A gift card for the carnivorous garden',
      expirationType: 'UNKNOWN_EXPIRATION_TYPE',
    });
    expect(product?.image).toMatchObject({
      url: `https://static.wixstatic.com/media/${IMAGE_ID}`,
      width: 600,
      height: 600,
    });
  });

  it('maps preset variants, falling back to the price when there is no value', async () => {
    const { getGiftCardProduct } = await loadFeature();

    const product = await getGiftCardProduct();

    expect(product?.presetVariants).toEqual([
      {
        id: '37d870be-8206-4fa6-bc85-556639d66671',
        price: { amount: '25', formattedAmount: '25,00€' },
        value: { amount: '25', formattedAmount: '25,00€' },
      },
      {
        id: 'd76d745f-fd80-4345-accd-6932775e4ea8',
        price: { amount: '50', formattedAmount: '50,00€' },
        value: { amount: '50', formattedAmount: '50,00€' },
      },
    ]);
  });

  it('returns null when the site has no gift card product', async () => {
    find.mockResolvedValue({ items: [] });
    const { getGiftCardProduct } = await loadFeature();

    await expect(getGiftCardProduct()).resolves.toBeNull();
  });

  it('returns null when the query fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    find.mockRejectedValue(new Error('boom'));
    const { getGiftCardProduct } = await loadFeature();

    await expect(getGiftCardProduct()).resolves.toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('coalesces concurrent reads into a single query', async () => {
    const { getGiftCardProduct } = await loadFeature();

    const [first, second] = await Promise.all([getGiftCardProduct(), getGiftCardProduct()]);

    expect(queryGiftCardProducts).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });
});
