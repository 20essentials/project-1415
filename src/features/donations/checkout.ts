import { createCart } from "@wix/auto_sdk_ecom_cart-v-2";
import { redirects } from "@wix/redirects";
import { WIX_DONATIONS_APP_ID } from "./donations";
import type { CreateCartOptions } from "@wix/auto_sdk_ecom_cart-v-2";

export type DonationCheckoutErrorCode = "INVALID_INPUT" | "CHECKOUT_UNAVAILABLE";

export class DonationCheckoutError extends Error {
  readonly code: DonationCheckoutErrorCode;

  constructor(code: DonationCheckoutErrorCode, message: string) {
    super(message);
    this.name = "DonationCheckoutError";
    this.code = code;
  }
}

export interface DonationCheckoutInput {
  campaignId: string;
  amount: number;
  language: string;
  postFlowUrl: string;
  thankYouPageUrl: string;
}

export async function createDonationCheckout(input: DonationCheckoutInput): Promise<string> {
  const valid =
    !!input.campaignId &&
    !!input.language &&
    !!input.postFlowUrl &&
    !!input.thankYouPageUrl &&
    Number.isFinite(input.amount) &&
    input.amount > 0;

  if (!valid) {
    throw new DonationCheckoutError("INVALID_INPUT", "Missing or invalid donation checkout input");
  }

  try {
    // Omitting `frequency` from the catalog reference options keeps the donation
    // one-time. The returned cart _id is the ecom checkout id.
    const body: CreateCartOptions = {
      cart: { source: { channelType: "WEB" } },
      catalogItems: [
        {
          quantity: 1,
          catalogReference: {
            appId: WIX_DONATIONS_APP_ID,
            catalogItemId: input.campaignId,
            options: { amount: input.amount },
          },
        },
      ],
    };
    const cart = await createCart(body);

    const cartId = cart._id;
    if (!cartId) {
      throw new DonationCheckoutError("CHECKOUT_UNAVAILABLE", "Cart creation returned no id");
    }

    const redirectRes = await redirects.createRedirectSession({
      ecomCheckout: { checkoutId: cartId },
      callbacks: {
        postFlowUrl: input.postFlowUrl,
        thankYouPageUrl: input.thankYouPageUrl,
      },
      preferences: {
        additionalQueryParameters: { lang: input.language },
      },
    });

    const session =
      redirectRes?.redirectSession?.fullUrl ||
      redirectRes?.redirectSession?.urlDetails?.endpoint ||
      redirectRes?.redirectSession?.shortUrl;
    if (!session) {
      throw new DonationCheckoutError("CHECKOUT_UNAVAILABLE", "Redirect session returned no URL");
    }
    return session;
  } catch (error) {
    if (error instanceof DonationCheckoutError) throw error;
    console.error("[donations] createDonationCheckout failed:", error);
    throw new DonationCheckoutError("CHECKOUT_UNAVAILABLE", "Donation checkout is unavailable");
  }
}
