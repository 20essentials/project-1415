import { consentPolicyManager } from '@wix/site';

export const CONSENT_STORAGE_KEY = 'pp_consent_v1';

export type ConsentState = 'accepted' | 'rejected';

export interface ConsentPolicy {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  dataToThirdParty: boolean;
}

const GRANTED_POLICY: ConsentPolicy = {
  essential: true,
  functional: true,
  analytics: true,
  advertising: true,
  dataToThirdParty: true,
};

const DENIED_POLICY: ConsentPolicy = {
  essential: true,
  functional: false,
  analytics: false,
  advertising: false,
  dataToThirdParty: false,
};

export function getConsentState(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function consentPolicyFor(state: ConsentState | null): ConsentPolicy {
  return state === 'accepted' ? GRANTED_POLICY : DENIED_POLICY;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentState() === 'accepted';
}

export function applyConsentPolicy(state: ConsentState | null): void {
  if (typeof window === 'undefined') return;
  try {
    void consentPolicyManager.setConsentPolicy(consentPolicyFor(state));
  } catch {
    // The consent runtime is unavailable outside a Wix-hosted page; the
    // visitor's choice is still persisted and enforced by hasAnalyticsConsent().
  }
}

export function setConsentState(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Storage may be blocked; the in-memory choice still applies to this page.
  }
  applyConsentPolicy(state);
}
