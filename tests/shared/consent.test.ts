// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONSENT_STORAGE_KEY,
  consentPolicyFor,
  getConsentState,
  hasAnalyticsConsent,
  setConsentState,
} from '@/shared/consent';
import { consentPolicyCalls } from '../mocks/wix-site';

beforeEach(() => {
  window.localStorage.clear();
  consentPolicyCalls.length = 0;
  vi.restoreAllMocks();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('getConsentState', () => {
  it('returns null when nothing is stored', () => {
    expect(getConsentState()).toBeNull();
  });

  it('returns the stored decision', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    expect(getConsentState()).toBe('accepted');

    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected');
    expect(getConsentState()).toBe('rejected');
  });

  it('returns null for unknown stored values', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'maybe');
    expect(getConsentState()).toBeNull();
  });
});

describe('consentPolicyFor', () => {
  it('grants every category when accepted', () => {
    window.localStorage.setItem('pp_consent_v1_granular', JSON.stringify({
      essential: true,
      functional: true,
      preferences: true,
      analytics: true,
      marketing: true,
      advertising: true,
      dataToThirdParty: true,
    }));
    expect(consentPolicyFor('accepted')).toEqual({
      essential: true,
      functional: true,
      analytics: true,
      advertising: true,
      dataToThirdParty: true,
    });
  });

  it('keeps only essential when rejected or undecided', () => {
    const denied = {
      essential: true,
      functional: false,
      analytics: false,
      advertising: false,
      dataToThirdParty: false,
    };
    expect(consentPolicyFor('rejected')).toEqual(denied);
    expect(consentPolicyFor(null)).toEqual(denied);
  });
});

describe('setConsentState', () => {
  it('persists the decision and applies the Wix consent policy', () => {
    setConsentState('accepted');

    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('accepted');
    expect(hasAnalyticsConsent()).toBe(true);
    expect(consentPolicyCalls.at(-1)?.analytics).toBe(true);
  });

  it('applies a denying policy when rejected', () => {
    setConsentState('rejected');

    expect(hasAnalyticsConsent()).toBe(false);
    expect(consentPolicyCalls.at(-1)).toMatchObject({
      analytics: false,
      advertising: false,
      dataToThirdParty: false,
    });
  });

  it('does not throw when the consent runtime fails', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(() => setConsentState('accepted')).not.toThrow();
  });
});

describe('granular consent', () => {
  it('defaults analytics to false when only basic state is set', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('respects analytics disabled in granular preferences', async () => {
    const mod = await import('@/shared/consent');
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    window.localStorage.setItem('pp_consent_v1_granular', JSON.stringify({
      essential: true,
      functional: true,
      preferences: true,
      analytics: false,
      marketing: false,
      advertising: false,
      dataToThirdParty: false,
    }));
    expect(mod.hasAnalyticsConsent()).toBe(false);
  });
});
