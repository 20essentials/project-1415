export interface TrackEventCall {
  eventName: string;
  eventData?: unknown;
}

export interface PolicyShape {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
  dataToThirdParty: boolean;
}

export const analyticsCalls: TrackEventCall[] = [];
export const consentPolicyCalls: PolicyShape[] = [];

export const analytics = {
  trackEvent(eventName: string, eventData?: unknown): void {
    analyticsCalls.push({ eventName, eventData });
  },
};

export const consentPolicyManager = {
  setConsentPolicy(policy: PolicyShape): Promise<undefined> {
    consentPolicyCalls.push(policy);
    return Promise.resolve(undefined);
  },
  getCurrentConsentPolicy(): undefined {
    return undefined;
  },
  resetPolicy(): undefined {
    return undefined;
  },
};
