import type { APIRoute } from 'astro';
import { getClubPlanById } from '@/features/club/plans';
import { PlanCheckoutError, createPlanCheckout } from '@/features/club/plan-purchase';
import { localeUrl, readSiteLanguage } from '@/shared/i18n';

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getOrigin(request: Request): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://localhost';
  }
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const planId = (body as { planId?: unknown })?.planId;
  if (typeof planId !== 'string' || planId.trim().length === 0) {
    return json({ error: 'INVALID_INPUT' }, 400);
  }

  const plan = await getClubPlanById(planId);
  if (!plan) return json({ error: 'NOT_FOUND' }, 400);

  const language = readSiteLanguage();
  const origin = getOrigin(request);

  try {
    const checkoutUrl = await createPlanCheckout({
      planId: plan.id,
      language,
      postFlowUrl: `${origin}${localeUrl('/club?checkout=cancelled', language)}`,
      thankYouPageUrl: `${origin}${localeUrl('/club/welcome', language)}`,
    });
    return json({ checkoutUrl }, 200);
  } catch (error) {
    if (error instanceof PlanCheckoutError) {
      if (error.code === 'UNAUTHENTICATED') return json({ error: 'UNAUTHENTICATED' }, 401);
      if (error.code === 'INVALID_INPUT') return json({ error: 'INVALID_INPUT' }, 400);
      return json({ error: 'CHECKOUT_UNAVAILABLE' }, 502);
    }
    console.error('[club-checkout-api] failed:', error);
    return json({ error: 'CHECKOUT_UNAVAILABLE' }, 502);
  }
};
