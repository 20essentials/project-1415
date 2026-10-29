import { useEffect, useState } from "react";
import { redirects } from "@wix/redirects";
import { createRsvp, reserveTickets, type EventTier } from "./events";
import { trackEvent } from "@/shared/analytics";
import { localize, readSiteLanguage } from "@/shared/i18n";

// queryAvailableTickets (tiers) es un modulo elevado: solo corre server-side.
// El cliente mira la respuesta del API route; con tiers vacios + error flag el
// componente pinta su estado "ticketsError ? retry" (comportamiento por defecto).
interface EventTiersPayload {
  tiers?: unknown;
  error?: string;
}

async function fetchEventTiers(eventId: string): Promise<{ tiers: EventTier[]; failed: boolean }> {
  try {
    const res = await fetch(`/api/event-tiers?eventId=${encodeURIComponent(eventId)}`);
    const payload = (await res.json()) as EventTiersPayload;
    if (!res.ok || payload.error) return { tiers: [], failed: true };
    return { tiers: Array.isArray(payload.tiers) ? (payload.tiers as EventTier[]) : [], failed: false };
  } catch {
    return { tiers: [], failed: true };
  }
}

export type EventRegistrationMode = "rsvp" | "tickets";

export interface EventRegistrationLabels {
  detailsTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  invalid: string;
  submit: string;
  submitTickets: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  error: string;
  postFlowError: string;
  paymentGate: string;
  retry: string;
  pickTier: string;
  quantity: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  freeBadge: string;
  soldOut: string;
  saleEnded: string;
  saleScheduled: string;
  ticketsError: string;
  loadingTiers: string;
}

export interface EventRegistrationProps {
  mode: EventRegistrationMode;
  eventId: string;
  slug: string;
  locale: string;
  labels?: Partial<EventRegistrationLabels>;
}

const DEFAULT_LABELS: EventRegistrationLabels = {
  detailsTitle: "Your details",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  invalid: "Invalid value",
  submit: "I'm coming",
  submitTickets: "Reserve & pay",
  submitting: "Reserving…",
  successTitle: "See you at the greenhouse!",
  successBody: "We've sent a confirmation to your email.",
  error: "Something went wrong. Please try again.",
  postFlowError: "We couldn't open checkout right now.",
  paymentGate:
    "Ticket sales aren't switched on yet — the organizer needs to connect a payment method.",
  retry: "Try again",
  pickTier: "Choose your tickets",
  quantity: "Quantity",
  decreaseQuantity: "Decrease quantity",
  increaseQuantity: "Increase quantity",
  freeBadge: "Free",
  soldOut: "Sold out",
  saleEnded: "Sales have ended",
  saleScheduled: "Sales start soon",
  ticketsError: "We couldn't load the tickets. Please try again.",
  loadingTiers: "Loading tickets…",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function money(value: string, currency: string, locale: string): string {
  if (!value) return "";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value));
  } catch {
    return `${currency} ${value}`;
  }
}

function isPaymentGateError(error: unknown): boolean {
  return /payment method|not configured|premium/i.test(
    error instanceof Error ? error.message : String(error),
  );
}

function trackRegistration(eventId: string, slug: string, mode: EventRegistrationMode): void {
  trackEvent("EventRegistration", { eventId, slug, mode });
}

function saleLabel(tier: EventTier, labels: EventRegistrationLabels): string | null {
  if (tier.saleStatus === "SALE_STARTED") return null;
  if (tier.saleStatus === "SALE_ENDED") return labels.saleEnded;
  if (tier.saleStatus === "SALE_SCHEDULED") return labels.saleScheduled;
  return labels.soldOut;
}

export function EventRegistration({
  mode,
  eventId,
  slug,
  locale,
  labels: labelOverrides,
}: EventRegistrationProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [values, setValues] = useState({ firstName: "", lastName: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tiers, setTiers] = useState<EventTier[]>([]);
  const [tierStatus, setTierStatus] = useState<"idle" | "loading" | "ready" | "error">(
    mode === "tickets" ? "loading" : "idle",
  );
  const [selectedTier, setSelectedTier] = useState<EventTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle");
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "tickets") return;
    let cancelled = false;
    setTierStatus("loading");
    fetchEventTiers(eventId)
      .then((result) => {
        if (cancelled) return;
        setTiers(result.tiers);
        if (result.failed) {
          setTierStatus("error");
          return;
        }
        const firstBuyable = result.tiers.find((tier) => tier.saleStatus === "SALE_STARTED");
        setSelectedTier(firstBuyable ?? result.tiers[0] ?? null);
        setTierStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, eventId]);

  if (success) {
    return (
      <div
        role="status"
        data-testid="event-registration-success"
        data-event-slug={slug}
        className="rounded-md border border-rule bg-paper-warm p-5 sm:p-6"
      >
        <p className="font-display text-lg text-ink">{labels.successTitle}</p>
        <p className="mt-2 text-sm leading-6 text-ink-soft">{labels.successBody}</p>
      </div>
    );
  }

  const setValue = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!values.firstName.trim()) errors.firstName = labels.invalid;
    if (!values.lastName.trim()) errors.lastName = labels.invalid;
    const email = values.email.trim();
    if (!email || !EMAIL_PATTERN.test(email)) errors.email = labels.invalid;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRsvp = async () => {
    if (!validate()) return;
    setSubmitState("submitting");
    setNotice(null);
    try {
      await createRsvp({
        eventId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
      trackRegistration(eventId, slug, "rsvp");
      setSuccess(true);
    } catch {
      setNotice(labels.error);
      setSubmitState("error");
    }
  };

  const handleTicketCheckout = async () => {
    if (!selectedTier) return;
    setSubmitState("submitting");
    setNotice(null);
    try {
      const reservationId = await reserveTickets({
        tickets: [{ ticketDefinitionId: selectedTier.id, quantity }],
      });
      if (!reservationId) throw new Error("NO_RESERVATION");
      const origin = window.location.origin;
      const session = await redirects.createRedirectSession({
        eventsCheckout: { reservationId, eventSlug: slug },
        callbacks: {
          thankYouPageUrl: `${origin}${localize("/thank-you")}`,
          postFlowUrl: `${origin}${window.location.pathname.replace(/#.*$/, "")}`,
        },
        preferences: { additionalQueryParameters: { lang: readSiteLanguage() } },
      });
      const fullUrl = session?.redirectSession?.fullUrl;
      if (!fullUrl) throw new Error("NO_REDIRECT_URL");
      trackRegistration(eventId, slug, "tickets");
      window.location.assign(fullUrl);
    } catch (error) {
      setNotice(
        isPaymentGateError(error)
          ? labels.paymentGate
          : error instanceof Error && error.message === "NO_REDIRECT_URL"
            ? labels.postFlowError
            : labels.error,
      );
      setSubmitState("error");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "submitting") return;
    if (mode === "rsvp") void handleSubmitRsvp();
    else void handleTicketCheckout();
  };

  const tierCurrency = selectedTier?.currency || tiers[0]?.currency || "EUR";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="event-registration"
      data-event-slug={slug}
      className="flex flex-col gap-5 rounded-md border border-rule bg-paper-warm p-5 sm:p-6"
    >
      {mode === "tickets" &&
        (tierStatus === "loading" ? (
          <p role="status" className="text-sm text-mute">
            {labels.loadingTiers}
          </p>
        ) : tierStatus === "error" ? (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-error">
              {labels.ticketsError}
            </p>
            <button
              type="button"
              onClick={() => {
                setTierStatus("loading");
                fetchEventTiers(eventId)
                  .then((result) => {
                    setTiers(result.tiers);
                    if (result.failed) {
                      setTierStatus("error");
                      return;
                    }
                    const firstBuyable = result.tiers.find((tier) => tier.saleStatus === "SALE_STARTED");
                    setSelectedTier(firstBuyable ?? result.tiers[0] ?? null);
                    setTierStatus("ready");
                  });
              }}
              className="rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent"
            >
              {labels.retry}
            </button>
          </div>
        ) : tiers.length > 0 ? (
          <section aria-labelledby="event-tickets-heading">
            <h2 id="event-tickets-heading" className="text-sm font-medium text-ink">
              {labels.pickTier}
            </h2>
            {tiers.map((tier) => {
              const isActive = selectedTier?.id === tier.id;
              const saleNote = saleLabel(tier, labels);
              return (
                <button
                  key={tier.id}
                  type="button"
                  aria-pressed={isActive}
                  disabled={tier.saleStatus !== "SALE_STARTED"}
                  onClick={() => {
                    setSelectedTier(tier);
                    setQuantity(1);
                  }}
                  className={`mt-2 flex w-full items-center justify-between rounded-sm border px-3 py-2 text-sm text-left transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-rule bg-paper text-ink hover:border-accent disabled:opacity-60"
                  }`}
                >
                  <span className="flex flex-col items-start">
                    <span className="font-medium">{tier.name}</span>
                    {saleNote && <span className="text-xs text-error">{saleNote}</span>}
                  </span>
                  <span className="font-medium">
                    {tier.free ? labels.freeBadge : money(tier.priceValue, tierCurrency, locale)}
                  </span>
                </button>
              );
            })}

            {selectedTier && !selectedTier.free && selectedTier.saleStatus === "SALE_STARTED" && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm font-medium text-ink-soft">{labels.quantity}</span>
                <button
                  type="button"
                  aria-label={labels.decreaseQuantity}
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="size-8 rounded-full border border-rule text-ink transition-colors duration-500 ease-fluid hover:border-accent disabled:opacity-40"
                >
                  −
                </button>
                <span aria-live="polite" className="min-w-6 text-center text-sm font-medium text-ink">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={labels.increaseQuantity}
                  disabled={
                    quantity >= (selectedTier.limitPerCheckout ?? 8)
                  }
                  onClick={() => setQuantity((current) => current + 1)}
                  className="size-8 rounded-full border border-rule text-ink transition-colors duration-500 ease-fluid hover:border-accent disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}
          </section>
        ) : (
          <p className="text-sm text-mute">{labels.soldOut}</p>
        ))}

      <section aria-labelledby="event-details-heading">
        <h2 id="event-details-heading" className="text-sm font-medium text-ink">
          {labels.detailsTitle}
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {(
            [
              ["firstName", labels.firstName, "text"],
              ["lastName", labels.lastName, "text"],
              ["email", labels.email, "email"],
            ] as const
          ).map(([name, labelText, type]) => {
            const hasError = Boolean(fieldErrors[name]);
            const errorId = `event-${name}-error`;
            return (
              <div key={name} className="flex flex-col gap-2">
                <label htmlFor={`event-${name}`} className="text-sm font-medium text-ink-soft">
                  {labelText}
                  <span aria-hidden="true" className="text-accent">
                    {" "}
                    *
                  </span>
                </label>
                <input
                  id={`event-${name}`}
                  data-event-field={name}
                  type={type}
                  required
                  aria-invalid={hasError}
                  aria-describedby={hasError ? errorId : undefined}
                  value={values[name]}
                  onChange={(event) => setValue(name, event.target.value)}
                  className={`${inputClass} ${hasError ? "border-error" : ""}`}
                />
                {hasError && (
                  <p id={errorId} className="text-xs text-error">
                    {fieldErrors[name]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <button
        type="submit"
        disabled={submitState === "submitting"}
        aria-busy={submitState === "submitting"}
        className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitState === "submitting" ? labels.submitting : mode === "rsvp" ? labels.submit : labels.submitTickets}
      </button>

      {notice && (
        <p role="alert" className="text-sm text-error">
          {notice}
        </p>
      )}
    </form>
  );
}
