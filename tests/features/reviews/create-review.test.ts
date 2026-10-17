import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewSubmitError, submitProductReview } from '@/features/reviews/create-review';
import type { Member } from '@wix/auto_sdk_members_members';

const createReview = vi.fn();

vi.mock('@wix/reviews', () => ({
  reviews: {
    createReview: (...args: unknown[]) => createReview(...args),
  },
}));

const member = { contactId: 'contact-1' } as Member;

describe('submitProductReview', () => {
  beforeEach(() => {
    createReview.mockResolvedValue({
      _id: 'review-1',
      moderation: { moderationStatus: 'IN_MODERATION' },
    });
  });

  afterEach(() => {
    createReview.mockReset();
    vi.restoreAllMocks();
  });

  it.each([0, 6, 2.5])('rejects rating %s as INVALID_INPUT without calling the API', async (rating) => {
    await expect(
      submitProductReview({ productId: 'product-1', rating, body: 'Great plant' }, member),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(createReview).not.toHaveBeenCalled();
  });

  it('rejects an empty productId as INVALID_INPUT without calling the API', async () => {
    await expect(
      submitProductReview({ productId: '  ', rating: 5, body: 'Great plant' }, member),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(createReview).not.toHaveBeenCalled();
  });

  it('rejects a null member as NOT_AUTHENTICATED without calling the API', async () => {
    await expect(
      submitProductReview({ productId: 'product-1', rating: 4, body: 'Nice' }, null),
    ).rejects.toMatchObject({ code: 'NOT_AUTHENTICATED' });
    expect(createReview).not.toHaveBeenCalled();
  });

  it('rejects a member without contactId as NOT_AUTHENTICATED without calling the API', async () => {
    await expect(
      submitProductReview(
        { productId: 'product-1', rating: 4, body: 'Nice' },
        { loginEmail: 'grower@example.com' } as Member,
      ),
    ).rejects.toMatchObject({ code: 'NOT_AUTHENTICATED' });
    expect(createReview).not.toHaveBeenCalled();
  });

  it('creates a stores review authored by the member contact and maps the receipt', async () => {
    const result = await submitProductReview(
      { productId: 'product-1', rating: 5, title: '  Thriving  ', body: '  Venus flytrap is thriving.  ' },
      member,
    );

    expect(createReview).toHaveBeenCalledTimes(1);
    expect(createReview).toHaveBeenCalledWith({
      namespace: 'stores',
      entityId: 'product-1',
      author: { contactId: 'contact-1' },
      content: { rating: 5, title: 'Thriving', body: 'Venus flytrap is thriving.' },
    });
    expect(result).toEqual({ id: 'review-1', moderationStatus: 'IN_MODERATION' });
  });

  it('retries with elevated auth when Wix answers with a permissions error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    createReview
      .mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), {
          details: { applicationError: { code: 'FORBIDDEN' } },
        }),
      )
      .mockResolvedValueOnce({ _id: 'review-2' });

    const result = await submitProductReview(
      { productId: 'product-1', rating: 3, body: 'Decent' },
      member,
    );

    expect(createReview).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: 'review-2', moderationStatus: null });
    consoleError.mockRestore();
  });

  it('retries with elevated auth when Wix answers with a 403 VisitorContactBelongsToMember', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    createReview
      .mockRejectedValueOnce(
        Object.assign(new Error('Visitor denied'), {
          status: 403,
          details: { applicationError: { code: 'VisitorContactBelongsToMember' } },
        }),
      )
      .mockResolvedValueOnce({ _id: 'review-3', moderation: { moderationStatus: 'IN_MODERATION' } });

    const result = await submitProductReview(
      { productId: 'product-1', rating: 5, body: 'Beautiful' },
      member,
    );

    expect(createReview).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: 'review-3', moderationStatus: 'IN_MODERATION' });
    consoleError.mockRestore();
  });

  it('wraps an API failure as FAILED', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    createReview.mockRejectedValue(new Error('boom'));

    await expect(
      submitProductReview({ productId: 'product-1', rating: 4, body: 'Nice' }, member),
    ).rejects.toBeInstanceOf(ReviewSubmitError);
    await expect(
      submitProductReview({ productId: 'product-1', rating: 4, body: 'Nice' }, member),
    ).rejects.toMatchObject({ code: 'FAILED' });
    consoleError.mockRestore();
  });
});
