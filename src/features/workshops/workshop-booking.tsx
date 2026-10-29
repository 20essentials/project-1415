import { useEffect, useMemo, useState } from "react";
import { readSiteLanguage } from "@/shared/i18n";

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
  submitOnline?: string;
  submittingOnline?: string;
  formError: string;
  invalid: string;
  timezoneNote: string;
  checkoutUnavailable?: string;
  payOffline?: string;
  cancelledBanner?: string;
  retryBooking?: string;
  prevMonth?: string;
  nextMonth?: string;
}

interface WorkshopBookingProps {
  serviceId: string;
  timeZone: string;
  locale: string;
  confirmationBase: string;
  fields: BookingField[];
  labels?: Partial<WorkshopBookingLabels>;
  allowOnlinePayment?: boolean;
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
  checkoutUrl?: string;
  error?: string;
}

const MONTH_VIEW_LIMIT = 6;
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
  submitOnline: "Book & pay",
  submittingOnline: "Redirecting…",
  formError: "Something went wrong. Please try again.",
  invalid: "Invalid value",
  timezoneNote: "Times are shown in the greenhouse’s local time.",
  checkoutUnavailable: "Online checkout isn’t available right now.",
  payOffline: "Reserve (pay on site)",
  cancelledBanner: "Your spot isn't reserved yet",
  retryBooking: "Try booking again",
  prevMonth: "Previous month",
  nextMonth: "Next month",
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

function nextDates(timeZone: string): { year: number; month: number } {
  const today = siteToday(timeZone);
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 };
}

type WeekdayLabel = { short: string; long: string };

function weekdayLabels(locale: string, timeZone: string): WeekdayLabel[] {
  const formatter = new Intl.DateTimeFormat(locale, { timeZone, weekday: "short" });
  return Array.from({ length: 7 }, (_, index) => ({
    // 2003-11-10 was a Monday; offset by one to start the week there.
    short: formatter.format(new Date(Date.UTC(2003, 10, 10 + index))),
    long: new Intl.DateTimeFormat(locale, { timeZone, weekday: "long" }).format(
      new Date(Date.UTC(2003, 10, 10 + index)),
    ),
  }));
}

function monthHeader(year: number, month: number, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone, month: "long", year: "numeric" }).format(
    new Date(`${year}-${String(month + 1).padStart(2, "0")}-15T12:00:00Z`),
  );
}

// Weeks-starting-Monday grid of the month; leading/trailing cells are null.
function monthGrid(year: number, month: number): Array<{ date: string; day: number } | null> {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: leading + daysInMonth }, (_, index) =>
    index < leading
      ? null
      : {
          date: `${year}-${String(month + 1).padStart(2, "0")}-${String(index - leading + 1).padStart(2, "0")}`,
          day: index - leading + 1,
        },
  );
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

export function WorkshopBooking({
  serviceId,
  timeZone,
  locale,
  confirmationBase,
  fields,
  labels: labelOverrides,
  allowOnlinePayment = false,
}: WorkshopBookingProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [paymentMode, setPaymentMode] = useState<'online' | 'offline'>(allowOnlinePayment ? 'online' : 'offline');
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);
  const today = useMemo(() => siteToday(timeZone), [timeZone]);
  const [view, setView] = useState(() => nextDates(timeZone));
  const grid = useMemo(() => monthGrid(view.year, view.month), [view]);
  const weekdays = useMemo(() => weekdayLabels(locale, timeZone), [locale, timeZone]);

  const monthIndex = view.year * 12 + view.month;
  const todayIndex =
    Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
  const minMonthIndex = todayIndex;
  const maxMonthIndex = todayIndex + MONTH_VIEW_LIMIT;
  const isMonthNavDisabled = (direction: -1 | 1): boolean => {
    const target = monthIndex + direction;
    return target < minMonthIndex || target > maxMonthIndex;
  };

  const moveMonth = (direction: -1 | 1) => {
    if (isMonthNavDisabled(direction)) return;
    setView((prev) => {
      const next = prev.year * 12 + prev.month + direction;
      return { year: Math.floor(next / 12), month: ((next % 12) + 12) % 12 };
    });
  };

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
    if (today) void fetchSlots(today);
  }, [today, timeZone]);

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
          payment: paymentMode,
          language: readSiteLanguage(),
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
      if (data.error === "CHECKOUT_UNAVAILABLE") {
        // Fall back to the offline flow so the form stays consistent; the
        // visitor pays on site instead of hitting a broken hosted checkout.
        setPaymentMode("offline");
        setCheckoutUnavailable(true);
        setSubmitState("idle");
        return;
      }
      if (!response.ok || !data.booking) throw new Error(data.error ?? "REQUEST");

      if (data.checkoutUrl && paymentMode === "online") {
        if (typeof window !== "undefined") {
          window.location.assign(data.checkoutUrl);
        }
        return;
      }

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
  const idleLabel = checkoutUnavailable
    ? labels.payOffline ?? labels.submit
    : paymentMode === "online"
      ? labels.submitOnline ?? labels.submit
      : labels.submit;
  const submittingLabel =
    submitState === "submitting"
      ? paymentMode === "online"
        ? labels.submittingOnline ?? labels.submitting
        : labels.submitting
      : idleLabel;

  return (
    <div className="flex flex-col gap-6 rounded-md border border-rule bg-paper-warm p-5 sm:p-6">
      <section aria-labelledby="booking-date-heading">
        <p className={stepEyebrow}>1</p>
        <h2 id="booking-date-heading" className={stepTitle}>
          {labels.selectDate}
        </h2>
        <div
          role="group"
          aria-labelledby="booking-date-heading"
          className="mt-4"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              disabled={isMonthNavDisabled(-1)}
              aria-label={labels.prevMonth ?? DEFAULT_LABELS.prevMonth}
              className="inline-flex size-9 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <p aria-live="polite" className="font-display text-base text-ink">
              {monthHeader(view.year, view.month, locale, timeZone)}
            </p>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              disabled={isMonthNavDisabled(1)}
              aria-label={labels.nextMonth ?? DEFAULT_LABELS.nextMonth}
              className="inline-flex size-9 items-center justify-center rounded-full border border-rule text-ink-soft transition-colors duration-500 ease-fluid hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {weekdays.map((weekday) => (
              <p key={weekday.long} className="py-1 text-center text-xs text-mute">
                {weekday.short}
              </p>
            ))}
            {grid.map((cell, index) => {
              if (!cell) return <span key={`empty-${index}`} aria-hidden="true" />;
              const isPast = cell.date < today;
              const isToday = cell.date === today;
              const isActive = cell.date === selectedDate;
              const isDisabled = isPast;
              return (
                <button
                  key={cell.date}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => void fetchSlots(cell.date)}
                  className={`relative flex size-9 items-center justify-center justify-self-center rounded-full text-sm transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    isActive
                      ? "bg-accent text-paper"
                      : isToday
                        ? "text-ink ring-1 ring-accent"
                        : isDisabled
                          ? "text-mute opacity-50"
                          : "text-ink hover:bg-accent/10"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
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
              aria-busy={submitState === "submitting"}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submittingLabel}
            </button>

            {checkoutUnavailable && (
              <p role="status" className="text-sm text-mute">
                {labels.checkoutUnavailable ?? DEFAULT_LABELS.checkoutUnavailable}
              </p>
            )}

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
