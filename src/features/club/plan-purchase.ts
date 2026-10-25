import { redirects } from '@wix/redirects';
import { readSiteLanguage } from '@/shared/i18n';

export class PlanCheckoutError extends Error {
  readonly code: 'INVALID_INPUT' | 'CHECKOUT_UNAVAILABLE' | 'UNAUTHENTICATED';

  constructor(code: PlanCheckoutError['code'], message: string) {
    super(message);
    this.name = 'PlanCheckoutError';
    this.code = code;
  }
}

export interface CreatePlanCheckoutInput {
  planId: string;
  language?: string;
  postFlowUrl: string;
  thankYouPageUrl: string;
}

export async function createPlanCheckout(input: CreatePlanCheckoutInput): Promise<string> {
  if (!input.planId || !input.postFlowUrl || !input.thankYouPageUrl) {
    throw new PlanCheckoutError('INVALID_INPUT', 'Missing checkout fields');
  }

  const lang = input.language ?? readSiteLanguage();

  try {
    const redirectRes = await redirects.createRedirectSession({
      paidPlansCheckout: {
        planId: input.planId,
      },
      callbacks: {
        postFlowUrl: input.postFlowUrl,
        thankYouPageUrl: input.thankYouPageUrl,
      },
      preferences: {
        additionalQueryParameters: {
          lang,
        },
      },
    });

    const fullUrl =
      redirectRes?.redirectSession?.fullUrl ||
      redirectRes?.redirectSession?.urlDetails?.endpoint ||
      redirectRes?.redirectSession?.shortUrl;

    if (!fullUrl) {
      throw new PlanCheckoutError('CHECKOUT_UNAVAILABLE', 'Missing redirect session URL');
    }

    return fullUrl;
  } catch (error) {
    if (error instanceof PlanCheckoutError) {
      throw error;
    }
    console.error('[plan-purchase] createRedirectSession failed:', error);
    throw new PlanCheckoutError('CHECKOUT_UNAVAILABLE', 'Checkout unavailable');
  }
}
