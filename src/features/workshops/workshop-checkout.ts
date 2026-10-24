import { redirects } from '@wix/redirects';
import { WorkshopCheckoutError } from '@/features/workshops/bookings';

export interface CreateWorkshopCheckoutInput {
  serviceId: string;
  localStartDate: string;
  endDate?: string;
  timezone: string;
  resource?: { id: string; name?: string | null } | null;
  language?: string;
  returnToUrl?: string;
  postFlowUrl: string;
  thankYouPageUrl: string;
}

function toUtcStart(localStartDate: string): string {
  const [datePart, timePart] = localStartDate.split('T');
  if (!datePart || !timePart) return localStartDate;
  const time = timePart.length === 5 ? `${timePart}:00` : timePart;
  return `${datePart}T${time}Z`;
}

function toUtcEnd(localStartDate: string, endDate?: string): string {
  if (endDate) {
    const [datePart, timePart] = endDate.split('T');
    if (datePart && timePart) {
      const time = timePart.length === 5 ? `${timePart}:00` : timePart;
      return `${datePart}T${time}Z`;
    }
    return endDate;
  }
  const start = new Date(toUtcStart(localStartDate));
  start.setHours(start.getHours() + 1);
  return start.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function readSiteLanguage(): string {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang;
    if (lang) return lang;
  }
  return 'en';
}

export async function createWorkshopCheckout(input: CreateWorkshopCheckoutInput): Promise<string> {
  if (!input.serviceId || !input.localStartDate || !input.timezone) {
    throw new WorkshopCheckoutError('INVALID_INPUT', 'Missing checkout fields');
  }

  const lang = input.language ?? readSiteLanguage();
  const startDate = toUtcStart(input.localStartDate);
  const endDate = toUtcEnd(input.localStartDate, input.endDate);
  const postFlowUrl = input.returnToUrl || input.postFlowUrl;
  const thankYouPageUrl = input.thankYouPageUrl;

  try {
    const redirectRes = await redirects.createRedirectSession({
      bookingsCheckout: {
        timezone: input.timezone,
        slotAvailability: {
          slot: {
            serviceId: input.serviceId,
            startDate,
            endDate,
            timezone: input.timezone,
            ...(input.resource?.id
              ? {
                  resource: {
                    _id: input.resource.id,
                    ...(input.resource.name ? { name: input.resource.name } : {}),
                  },
                }
              : {}),
          },
        },
      },
      callbacks: {
        postFlowUrl,
        thankYouPageUrl,
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
      throw new WorkshopCheckoutError('CHECKOUT_UNAVAILABLE', 'Missing redirect session URL');
    }

    return fullUrl;
  } catch (error) {
    if (error instanceof WorkshopCheckoutError) {
      throw error;
    }
    console.error('[workshop-checkout] createRedirectSession failed:', error);
    throw new WorkshopCheckoutError('CHECKOUT_UNAVAILABLE', 'Checkout unavailable');
  }
}
