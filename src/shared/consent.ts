import { consentPolicyManager } from '@wix/site';

export const CONSENT_STORAGE_KEY = 'pp_consent_v1';
export const CONSENT_GRANULAR_STORAGE_KEY = 'pp_consent_v1_granular';

export type ConsentState = 'accepted' | 'rejected';

export type ConsentCategory = 'analytics' | 'marketing' | 'advertising' | 'functional' | 'preferences';

export interface GranularConsentPreferences {
  essential: boolean;
  functional: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  advertising: boolean;
  dataToThirdParty: boolean;
}

export interface ConsentPolicy {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  dataToThirdParty: boolean;
}

// GRANTED_POLICY kept for reference via consentPolicyFor when accepted.

const DENIED_POLICY: ConsentPolicy = {
  essential: true,
  functional: false,
  analytics: false,
  advertising: false,
  dataToThirdParty: false,
};

const DEFAULT_GRANULAR_PREFERENCES: GranularConsentPreferences = {
  essential: true,
  functional: false,
  preferences: false,
  analytics: false,
  marketing: false,
  advertising: false,
  dataToThirdParty: false,
};

const GRANTED_GRANULAR_PREFERENCES: GranularConsentPreferences = {
  essential: true,
  functional: true,
  preferences: true,
  analytics: true,
  marketing: true,
  advertising: true,
  dataToThirdParty: true,
};

function isGranularPreferences(
  value: unknown,
): value is GranularConsentPreferences {
  if (!value || typeof value !== 'object') return false;
  const prefs = value as Record<string, unknown>;
  return (
    typeof prefs.essential === 'boolean' &&
    typeof prefs.functional === 'boolean' &&
    typeof prefs.preferences === 'boolean' &&
    typeof prefs.analytics === 'boolean' &&
    typeof prefs.marketing === 'boolean' &&
    typeof prefs.advertising === 'boolean' &&
    typeof prefs.dataToThirdParty === 'boolean'
  );
}

export function getConsentState(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function getGranularConsentPreferences(): GranularConsentPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_GRANULAR_PREFERENCES };

  const state = getConsentState();
  if (!state) {
    return { ...DEFAULT_GRANULAR_PREFERENCES };
  }

  if (state === 'accepted') {
    try {
      const raw = window.localStorage.getItem(CONSENT_GRANULAR_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isGranularPreferences(parsed)) {
          return { ...GRANTED_GRANULAR_PREFERENCES, ...parsed, essential: true };
        }
      }
    } catch {
      // ignore storage/parse errors
    }
    return { ...GRANTED_GRANULAR_PREFERENCES };
  }

  // rejected
  try {
    const raw = window.localStorage.getItem(CONSENT_GRANULAR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (isGranularPreferences(parsed)) {
        return {
          ...DEFAULT_GRANULAR_PREFERENCES,
          ...parsed,
          essential: true,
          functional: false,
          preferences: false,
          analytics: false,
          marketing: false,
          advertising: false,
          dataToThirdParty: false,
        };
      }
    }
  } catch {
    // ignore storage/parse errors
  }
  return { ...DEFAULT_GRANULAR_PREFERENCES };
}

export function consentPolicyFor(state: ConsentState | null): ConsentPolicy {
  if (state === 'accepted') {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(CONSENT_GRANULAR_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          if (parsed && typeof parsed === 'object') {
            return {
              essential: true,
              functional: parsed.functional === true || parsed.preferences === true,
              analytics: parsed.analytics === true,
              advertising: parsed.advertising === true || parsed.marketing === true,
              dataToThirdParty: parsed.dataToThirdParty === true || parsed.marketing === true || parsed.advertising === true,
            };
          }
        }
      }
    } catch {
      // fall through
    }
    const prefs = getGranularConsentPreferences();
    return {
      essential: true,
      functional: prefs.functional || prefs.preferences,
      analytics: prefs.analytics,
      advertising: prefs.advertising || prefs.marketing,
      dataToThirdParty: prefs.dataToThirdParty || prefs.marketing || prefs.advertising,
    };
  }
  return DENIED_POLICY;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const state = getConsentState();
  if (state !== 'accepted') return false;
  const prefs = getGranularConsentPreferences();
  return prefs.analytics === true;
}

export function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  const state = getConsentState();
  if (state !== 'accepted') return false;
  const prefs = getGranularConsentPreferences();
  return prefs.marketing === true || prefs.advertising === true;
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

export function saveGranularConsentPreferences(
  preferences: Partial<GranularConsentPreferences>,
): GranularConsentPreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_GRANULAR_PREFERENCES, ...preferences, essential: true };
  }

  const current = getGranularConsentPreferences();
  const merged: GranularConsentPreferences = {
    essential: true,
    functional: preferences.functional ?? current.functional,
    preferences: preferences.preferences ?? current.preferences,
    analytics: preferences.analytics ?? current.analytics,
    marketing: preferences.marketing ?? current.marketing,
    advertising: preferences.advertising ?? current.advertising,
    dataToThirdParty: preferences.dataToThirdParty ?? (preferences.marketing ?? preferences.advertising ?? current.dataToThirdParty),
  };

  try {
    window.localStorage.setItem(CONSENT_GRANULAR_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }

  // Ensure we have a base state
  if (!getConsentState()) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, merged.analytics || merged.marketing || merged.advertising ? 'accepted' : 'rejected');
    } catch {
      // ignore
    }
  } else if (merged.analytics || merged.marketing || merged.advertising || merged.functional || merged.preferences) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    } catch {
      // ignore
    }
  }

  applyConsentPolicy(getConsentState());
  return merged;
}

export function revokeAllConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'rejected');
    window.localStorage.setItem(CONSENT_GRANULAR_STORAGE_KEY, JSON.stringify(DEFAULT_GRANULAR_PREFERENCES));
  } catch {
    // ignore
  }
  applyConsentPolicy('rejected');
}

