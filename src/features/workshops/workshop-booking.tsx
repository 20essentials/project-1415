import { useEffect, useMemo, useState } from "react";

export interface BookingField {
  target: string;
  label: string;
  inputType: "text" | "email" | "tel" | "textarea";
  required: boolean;
}

export interface WorkshopBookingLabels {
  selectDate: string;
  selectTime: string;
  loadingTimes: string;
  noTimes: string;
  timesError: string;
  retry: string;
  detailsTitle: string;
  submit: string;
  submitting: string;
  formError: string;
  invalid: string;
  timezoneNote: string;
}

interface WorkshopBookingProps {
  serviceId: string;
  timeZone: string;
  locale: string;
  confirmationBase: string;
  fields: BookingField[];
  labels?: Partial<WorkshopBookingLabels>;
}

interface SlotDto {
  localStartDate: string;
  localEndDate: string;
  staffName?: string | null;
}

interface SlotsResponse {
  slots?: SlotDto[];
  error?: string;
}

interface BookingReceiptDto {
  id: string;
  status: string;
  serviceName: string;
  localStartDate: string;
  localEndDate: string;
}

interface BookingResponse {
  booking?: BookingReceiptDto;
  error?: string;
}

const DATE_RAIL_DAYS = 14;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_LABELS: WorkshopBookingLabels = {
  selectDate: "Pick a date",
  selectTime: "Pick a time",
  loadingTimes: "Loading times…",
  noTimes: "No times available on this day — try another date.",
  timesError: "We couldn’t load the times. Please try again.",
  retry: "Try again",
  detailsTitle: "Your details",
  submit: "Reserve my spot",
  submitting: "Reserving…",
  formError: "Something went wrong. Please try again.",
  invalid: "Invalid value",
  timezoneNote: "Times are shown in the greenhouse’s local time.",
};

const inputClass =
  "w-full rounded-sm border border-rule bg-paper-warm px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function siteToday(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nextDates(timeZone: string, days: number): string[] {
  const today = siteToday(timeZone);
  const anchor = Date.parse(`${today}T12:00:00Z`);
  return Array.from({ length: days }, (_, index) =>
    new Date(anchor + index * 86_400_000).toISOString().slice(0, 10),
  );
}

function dateLabel(date: string, locale: string, timeZone: string): { weekday: string; day: string } {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date(`${date}T12:00:00Z`));
  return {
    weekday: parts.find((part) => part.type === "weekday")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
  };
}

function formatRange(start: string, end: string, locale: string, timeZone: string): string {
  const day = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${start.slice(0, 10)}T12:00:00Z`));
  return `${day}, ${start.slice(11, 16)}–${end.slice(11, 16)}`;
}

export default function WorkshopBooking({
  serviceId,
  timeZone,
  locale,
  confirmationBase,
  fields,
  labels: labelOverrides,
}: WorkshopBookingProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const dates = useMemo(() => nextDates(timeZone, DATE_RAIL_DAYS), [timeZone]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotStatus, setSlotStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotDto | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error">("idle");

  const fetchSlots = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotStatus("loading");
    try {
      const response = await fetch(
        `/api/slots?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`,
      );
      const data = (await response.json()) as SlotsResponse;
      if (!response.ok || !Array.isArray(data.slots)) throw new Error(data.error ?? "REQUEST");
      setSlots(data.slots);
      setSlotStatus("ready");
    } catch (error) {
      console.error("[workshop-booking] slots fetch failed:", error);
      setSlots([]);
      setSlotStatus("error");
    }
  };

  useEffect(() => {
    if (dates[0]) void fetchSlots(dates[0]);
  }, [dates]);

  const setValue = (target: string, value: string) =>
    setValues((prev) => ({ ...prev, [target]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlot || submitState === "submitting") return;

    const errors: Record<string, string> = {};
    for (const field of fields) {
      const value = (values[field.target] ?? "").trim();
      if (field.required && !value) errors[field.target] = labels.invalid;
      else if (value && field.inputType === "email" && !EMAIL_PATTERN.test(value)) {
        errors[field.target] = labels.invalid;
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitState("submitting");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          localStartDate: selectedSlot.localStartDate,
          values,
        }),
      });
      const data = (await response.json()) as BookingResponse;

      if (data.error === "SLOT_UNAVAILABLE") {
        setSelectedSlot(null);
        setSlots([]);
        setSlotStatus("error");
        setSubmitState("idle");
        return;
      }
      if (!response.ok || !data.booking) throw new Error(data.error ?? "REQUEST");

      const params = new URLSearchParams({
        id: data.booking.id,
        service: data.booking.serviceName,
        start: data.booking.localStartDate,
        end: data.booking.localEndDate,
        status: data.booking.status,
      });
      window.location.assign(`${confirmationBase}?${params.toString()}`);
    } catch (error) {
      console.error("[workshop-booking] booking failed:", error);
      setSubmitState("error");
    }
  };

  const stepTitle = "mt-2 font-display text-lg text-ink";
  const stepEyebrow = "text-xs font-medium tracking-widest text-accent uppercase";

  return (
    <div className="flex flex-col gap-6 rounded-md border border-rule bg-paper-warm p-5 sm:p-6">
      <section aria-labelledby="booking-date-heading">
        <p className={stepEyebrow}>1</p>
        <h2 id="booking-date-heading" className={stepTitle}>
          {labels.selectDate}
        </h2>
        <div
          role="group"
          aria-label={labels.selectDate}
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {dates.map((date) => {
            const { weekday, day } = dateLabel(date, locale, timeZone);
            const isActive = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={isActive}
                onClick={() => void fetchSlots(date)}
                className={`shrink-0 rounded-sm border px-3 py-2 text-center transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isActive
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-rule bg-paper text-ink-soft hover:border-accent"
                }`}
              >
                <span className="block text-xs text-mute uppercase">{weekday}</span>
                <span className="block text-sm font-medium">{day}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedDate && (
        <section aria-labelledby="booking-time-heading">
          <p className={stepEyebrow}>2</p>
          <h2 id="booking-time-heading" className={stepTitle}>
            {labels.selectTime}
          </h2>

          {slotStatus === "loading" && (
            <p role="status" className="mt-3 text-sm text-mute">
              {labels.loadingTimes}
            </p>
          )}

          {slotStatus === "error" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p role="alert" className="text-sm text-error">
                {labels.timesError}
              </p>
              <button
                type="button"
                onClick={() => void fetchSlots(selectedDate)}
                className="rounded-full border border-rule px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {labels.retry}
              </button>
            </div>
          )}

          {slotStatus === "ready" && slots.length === 0 && (
            <p className="mt-3 text-sm text-mute">{labels.noTimes}</p>
          )}

          {slots.length > 0 && (
            <div
              role="group"
              aria-label={labels.selectTime}
              className="mt-3 flex flex-wrap gap-2"
            >
              {slots.map((slot) => {
                const isActive = slot.localStartDate === selectedSlot?.localStartDate;
                return (
                  <button
                    key={slot.localStartDate}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-sm border px-3 py-2 text-sm font-medium transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      isActive
                        ? "border-accent bg-accent text-paper"
                        : "border-rule bg-paper text-ink hover:border-accent"
                    }`}
                  >
                    {slot.localStartDate.slice(11, 16)}
                  </button>
                );
              })}
            </div>
          )}

          <p className="mt-3 text-xs text-mute">{labels.timezoneNote}</p>
        </section>
      )}

      {selectedSlot && selectedDate && (
        <section aria-labelledby="booking-details-heading" className="border-t border-rule pt-5">
          <p className={stepEyebrow}>3</p>
          <h2 id="booking-details-heading" className={stepTitle}>
            {labels.detailsTitle}
          </h2>
          <p className="mt-2 text-sm font-medium text-accent">
            {formatRange(selectedSlot.localStartDate, selectedSlot.localEndDate, locale, timeZone)}
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-5">
            {fields.map((field) => {
              const hasError = Boolean(fieldErrors[field.target]);
              const errorId = `${field.target}-booking-error`;
              const borderClass = hasError ? "border-error" : "";

              return (
                <div key={field.target} className="flex flex-col gap-2">
                  <label
                    htmlFor={field.target}
                    className="text-sm font-medium text-ink-soft"
                  >
                    {field.label}
                    {field.required && (
                      <span aria-hidden="true" className="text-accent">
                        {" "}
                        *
                      </span>
                    )}
                  </label>

                  {field.inputType === "textarea" ? (
                    <textarea
                      id={field.target}
                      name={field.target}
                      rows={4}
                      required={field.required}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? errorId : undefined}
                      value={values[field.target] ?? ""}
                      onChange={(event) => setValue(field.target, event.target.value)}
                      className={`${inputClass} resize-y ${borderClass}`}
                    />
                  ) : (
                    <input
                      id={field.target}
                      name={field.target}
                      type={field.inputType}
                      required={field.required}
                      aria-invalid={hasError}
                      aria-describedby={hasError ? errorId : undefined}
                      value={values[field.target] ?? ""}
                      onChange={(event) => setValue(field.target, event.target.value)}
                      className={`${inputClass} ${borderClass}`}
                    />
                  )}

                  {hasError && (
                    <p id={errorId} className="text-xs text-error">
                      {fieldErrors[field.target]}
                    </p>
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={submitState === "submitting"}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitState === "submitting" ? labels.submitting : labels.submit}
            </button>

            {submitState === "error" && (
              <p role="alert" className="text-sm text-error">
                {labels.formError}
              </p>
            )}
          </form>
        </section>
      )}
    </div>
  );
}
