import type { APIRoute } from "astro";
import { getDonationCampaign, parseDonationAmount } from "@/features/donations/donations";
import {
  DonationCheckoutError,
  createDonationCheckout,
} from "@/features/donations/checkout";
import { localeUrl } from "@/shared/i18n";

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://localhost";
  }
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "INVALID_INPUT" }, 400);
  }

  const rawAmount = (body as { amount?: unknown })?.amount;
  const rawLanguage = (body as { language?: unknown })?.language;
  const language =
    typeof rawLanguage === "string" && /^[a-z]{2,3}$/.test(rawLanguage.trim())
      ? rawLanguage.trim()
      : "en";

  const campaign = await getDonationCampaign();
  if (!campaign) return json({ error: "CAMPAIGN_UNAVAILABLE" }, 400);

  const amount = parseDonationAmount(
    typeof rawAmount === "number" || typeof rawAmount === "string"
      ? String(rawAmount)
      : "",
    campaign.minimumAmount,
  );
  if (amount === null) return json({ error: "INVALID_AMOUNT" }, 400);

  const origin = getOrigin(request);

  try {
    const checkoutUrl = await createDonationCheckout({
      campaignId: campaign.id,
      amount,
      language,
      postFlowUrl: `${origin}${localeUrl("/donate", language)}`,
      thankYouPageUrl: `${origin}${localeUrl("/donations/thank-you", language)}`,
    });
    return json({ checkoutUrl }, 200);
  } catch (error) {
    if (error instanceof DonationCheckoutError && error.code === "INVALID_INPUT") {
      return json({ error: "INVALID_INPUT" }, 400);
    }
    console.error("[donations-checkout-api] failed:", error);
    return json({ error: "CHECKOUT_UNAVAILABLE" }, 502);
  }
};
