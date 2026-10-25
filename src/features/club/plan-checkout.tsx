import { useState } from "react";

export interface ClubPlanCard {
  id: string;
  name: string;
  description: string;
  price: {
    formattedAmount: string;
    currency: string | null;
  };
  billingCycle: "MONTH" | "YEAR" | "ONE_TIME" | null;
  perks: string[];
}

export interface PlanCheckoutLabels {
  submit: string;
  submitting: string;
  error: string;
  retry: string;
  loginInvite?: string;
  loginLink?: string;
  billedMonthly?: string;
  billedYearly?: string;
  billedOnce?: string;
}

interface PlanCheckoutProps {
  plans: ClubPlanCard[];
  labels?: Partial<PlanCheckoutLabels>;
  loginUrl: string;
}

const DEFAULT_LABELS: PlanCheckoutLabels = {
  submit: "Join the club",
  submitting: "Redirecting…",
  error: "Checkout couldn’t start. Please try again.",
  retry: "Try again",
  loginInvite: "Opening checkout needs your account —",
  loginLink: "log in or create one",
  billedMonthly: "per month",
  billedYearly: "per year",
  billedOnce: "one year, paid once",
};

const cardClass =
  "flex flex-col rounded-lg border border-rule bg-paper-warm/40 p-6 transition-colors duration-500 ease-fluid lg:p-8";

function cycleLabel(
  cycle: ClubPlanCard["billingCycle"],
  labels: PlanCheckoutLabels,
): string | null {
  if (cycle === "MONTH") return labels.billedMonthly ?? null;
  if (cycle === "YEAR") return labels.billedYearly ?? null;
  if (cycle === "ONE_TIME") return labels.billedOnce ?? null;
  return null;
}

export function PlanCheckout({ plans, labels: labelOverrides, loginUrl }: PlanCheckoutProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [erroredPlanId, setErroredPlanId] = useState<string | null>(null);

  const joinPlan = async (planId: string) => {
    setPendingPlanId(planId);
    setNeedsLogin(false);
    setErroredPlanId(null);
    try {
      const response = await fetch("/api/club/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (response.status === 401 && !data.checkoutUrl) {
        setNeedsLogin(true);
        setPendingPlanId(null);
        return;
      }
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error ?? "REQUEST");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error("[plan-checkout] checkout failed:", error);
      setErroredPlanId(planId);
      setPendingPlanId(null);
    }
  };

  return (
    <div>
      {needsLogin && (
        <div role="status" className="mb-6 rounded-md border border-rule bg-paper px-4 py-3 text-sm text-ink">
          {labels.loginInvite}{" "}
          <a href={loginUrl} className="text-accent underline underline-offset-2">
            {labels.loginLink}
          </a>
        </div>
      )}

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {plans.map((plan) => {
          const isPending = pendingPlanId === plan.id;
          const isErrored = erroredPlanId === plan.id;
          const isSecond = plans.indexOf(plan) === 1;
          const highlighted = plan.billingCycle === "YEAR";
          const cycle = cycleLabel(plan.billingCycle, labels);

          return (
            <li
              key={plan.id}
              className={`${cardClass} ${highlighted ? "border-accent/40" : ""}`}
            >
              <p className="text-xs font-medium tracking-widest text-accent uppercase">
                {plan.name}
              </p>
              <p
                className={`mt-3 font-display text-ink ${
                  isSecond ? "text-3xl lg:text-4xl" : "text-2xl lg:text-3xl"
                }`}
              >
                {plan.price.formattedAmount}
                {cycle && (
                  <span className="ml-2 align-middle text-xs font-normal tracking-normal text-ink-soft">
                    {cycle}
                  </span>
                )}
              </p>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{plan.description}</p>

              {plan.perks.length > 0 && (
                <ul className="mt-5 flex flex-col gap-2 border-t border-rule pt-5">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2 text-sm text-ink">
                      <span aria-hidden="true" className="text-accent">
                        ✓
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => void joinPlan(plan.id)}
                disabled={isPending}
                aria-busy={isPending}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-trim">{isPending ? labels.submitting : labels.submit}</span>
              </button>

              {isErrored && (
                <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-error">
                  {labels.error}
                  <button
                    type="button"
                    onClick={() => setErroredPlanId(null)}
                    className="rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent"
                  >
                    {labels.retry}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
