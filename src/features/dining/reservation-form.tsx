import { useState } from "react";
import { readSiteLanguage } from "@/shared/i18n";
import { trackEvent } from "@/shared/analytics";

export interface ReservationLabels {
  pickDate: string;
  pickParty: string;
  loading: string;
  noOccurrences: string;
  detailsTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  invalid: string;
  submit: string;
  submitting: string;
  formError: string;
  success: string;
  requested: string;
  retry: string;
  timezoneNote: string;
}

interface ReservationReceiptDto {
  id: string;
  status: string;
  localStartDate: string;
  partySize: number;
}

interface ReservationCreateResponse {
  reservation?: ReservationReceiptDto;
  error?: string;
}

interface ReservationFormProps {
  occurrences: string[];
  partySize: { min: number; max: number };
  locale: string;
  timeZone: string;
  labels?: Partial<ReservationLabels>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_LABELS: ReservationLabels = {
  pickDate: "Pick a seating",
  pickParty: "Party size",
  loading: "Reading the calendar…",
  noOccurrences: "No seatings are open right now — the next date is TBA.",
  detailsTitle: "Your details",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  invalid: "Invalid value",
  submit: "Reserve my table",
  submitting: "Reserving…",
  formError: "Something went wrong. Please try again.",
  success: "You're booked.",
  requested: "We received your reservation — the greenhouse will confirm shortly.",
  retry: "Try again",
  timezoneNote: "Times are shown in the greenhouse's local time.",
};

const inputClass =
  "w-full rounded-sm border border-rule bg-paper-warm px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function occurrenceLabel(localStart: string, locale: string, timeZone: string): string {
  const reference = new Date(`${localStart.slice(0, 10)}T12:00:00Z`);
  const day = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(reference);
  return `${day} · ${localStart.slice(11, 16)}`;
}

export function ReservationForm({
  occurrences,
  partySize,
  locale,
  timeZone,
  labels: labelOverrides,
}: ReservationFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [selected, setSelected] = useState<string | null>(null);
  const [party, setParty] = useState<number>(Math.max(partySize.min, 2));
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [receipt, setReceipt] = useState<ReservationReceiptDto | null>(null);
  const [errorCopy, setErrorCopy] = useState<string>(labels.formError);

  const requiredFields = [
    { target: "firstName", type: "text" as const },
    { target: "phone", type: "tel" as const },
    { target: "email", type: "email" as const },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "submitting") return;

    const errors: Record<string, string> = {};
    for (const field of requiredFields) {
      const value = (values[field.target] ?? "").trim();
      if (!value) errors[field.target] = labels.invalid;
      else if (field.type === "email" && !EMAIL_PATTERN.test(value)) {
        errors[field.target] = labels.invalid;
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !selected) return;

    setSubmitState("submitting");
    try {
      const response = await fetch("/api/dining/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: selected,
          partySize: party,
          firstName: values.firstName ?? "",
          lastName: values.lastName ?? "",
          email: values.email ?? "",
          phone: values.phone ?? "",
          language: readSiteLanguage(),
        }),
      });
      const data = (await response.json()) as ReservationCreateResponse;
      if (!response.ok || !data.reservation) {
        setErrorCopy(
          data.error === "NO_AVAILABILITY"
            ? labels.noOccurrences
            : labels.formError,
        );
        setSubmitState("error");
        return;
      }

      // No PII in analytics — ids and counts only (consent-gated).
      trackEvent("DiningReservation", {
        eventId: data.reservation.id,
        status: data.reservation.status,
        partySize: data.reservation.partySize,
      });
      setReceipt(data.reservation);
      setSubmitState("success");
    } catch (error) {
      console.error("[reservation-form] booking failed:", error);
      setErrorCopy(labels.formError);
      setSubmitState("error");
    }
  };

  if (submitState === "success" && receipt) {
    return (
      <div className="rounded-md border border-rule bg-paper-warm p-6">
        <p role="status" aria-busy="false" className="font-display text-xl text-ink">
          {receipt.status === "REQUESTED" ? labels.requested : labels.success}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {occurrenceLabel(receipt.localStartDate, locale, timeZone)} · {receipt.partySize}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 rounded-md border border-rule bg-paper-warm p-5 sm:p-6"
    >
      <section aria-labelledby="dining-seating-heading">
        <h2 id="dining-seating-heading" className="font-display text-lg text-ink">
          {labels.pickDate}
        </h2>
        {occurrences.length === 0 ? (
          <p role="status" className="mt-3 text-sm text-mute">
            {labels.noOccurrences}
          </p>
        ) : (
          <div
            role="group"
            aria-label={labels.pickDate}
            className="mt-3 flex flex-wrap gap-2"
          >
            {occurrences.map((occurrence) => {
              const isActive = occurrence === selected;
              return (
                <button
                  key={occurrence}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setSelected(occurrence)}
                  className={`rounded-sm border px-3 py-2 text-sm font-medium transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive
                      ? "border-accent bg-accent text-paper"
                      : "border-rule bg-paper text-ink hover:border-accent"
                  }`}
                >
                  {occurrenceLabel(occurrence, locale, timeZone)}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="dining-party-heading">
        <label
          id="dining-party-heading"
          htmlFor="dining-party-size"
          className="font-display text-lg text-ink"
        >
          {labels.pickParty}
        </label>
        <select
          id="dining-party-size"
          value={party}
          onChange={(event) => setParty(Number(event.target.value))}
          className={`${inputClass} mt-3 sm:max-w-40`}
        >
          {Array.from(
            { length: Math.max(1, partySize.max - partySize.min + 1) },
            (_, index) => partySize.min + index,
          ).map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </section>

      {selected && (
        <section aria-labelledby="dining-contact-heading" className="border-t border-rule pt-5">
          <h2 id="dining-contact-heading" className="font-display text-lg text-ink">
            {labels.detailsTitle}
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {[
              { target: "firstName", label: labels.firstName, type: "text", required: true },
              { target: "lastName", label: labels.lastName, type: "text", required: false },
              { target: "email", label: labels.email, type: "email", required: true },
              { target: "phone", label: labels.phone, type: "tel", required: true },
            ].map((field) => {
              const hasError = Boolean(fieldErrors[field.target]);
              const errorId = `dining-${field.target}-error`;
              return (
                <div key={field.target} className="flex flex-col gap-2">
                  <label htmlFor={field.target} className="text-sm font-medium text-ink-soft">
                    {field.label}
                    {field.required && (
                      <span aria-hidden="true" className="text-accent">
                        {" "}
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id={field.target}
                    name={field.target}
                    type={field.type}
                    required={field.required}
                    autoComplete={field.target === "email" ? "email" : field.target === "phone" ? "tel" : "off"}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                    value={values[field.target] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [field.target]: event.target.value }))
                    }
                    className={`${inputClass} ${hasError ? "border-error" : ""}`}
                  />
                  {hasError && (
                    <p id={errorId} role="alert" className="text-xs text-error">
                      {fieldErrors[field.target]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <button
        type="submit"
        disabled={!selected || submitState === "submitting"}
        aria-busy={submitState === "submitting"}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitState === "submitting" ? labels.submitting : labels.submit}
      </button>

      {submitState === "error" && (
        <p role="alert" className="text-sm text-error">
          {errorCopy}
        </p>
      )}

      <p className="text-xs text-mute">{labels.timezoneNote}</p>
    </form>
  );
}
