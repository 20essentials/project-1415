// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '@/shared/analytics';
import { CONSENT_STORAGE_KEY } from '@/shared/consent';
import { analytics, analyticsCalls } from '../mocks/wix-site';

beforeEach(() => {
  window.localStorage.clear();
  analyticsCalls.length = 0;
  vi.restoreAllMocks();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('trackEvent', () => {
  it('does nothing without consent', () => {
    trackEvent('AddToCart', { name: 'Venus Flytrap' });
    expect(analyticsCalls).toHaveLength(0);
  });

  it('does nothing when the visitor rejected', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected');
    trackEvent('AddToCart', { name: 'Venus Flytrap' });
    expect(analyticsCalls).toHaveLength(0);
  });

  it('forwards the event once accepted', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    trackEvent('AddToCart', { name: 'Venus Flytrap', quantity: 2 });

    expect(analyticsCalls).toEqual([
      { eventName: 'AddToCart', eventData: { name: 'Venus Flytrap', quantity: 2 } },
    ]);
  });

  it('swallows errors from the analytics runtime', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    vi.spyOn(analytics, 'trackEvent').mockImplementation(() => {
      throw new Error('analytics offline');
    });

    expect(() => trackEvent('Lead', { category: 'Newsletter' })).not.toThrow();
  });
});
