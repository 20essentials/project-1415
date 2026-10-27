import { experiences, reservationLocations, reservations } from "@wix/table-reservations";
import { auth } from "@wix/essentials";

export const SITE_TIMEZONE = "Europe/Rome";
export const EXPERIENCE_NAME = "Jungle Tasting Dinner";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const MAX_PROJECTION_DAYS = 60;

export interface ReservationLocationContext {
  id: string;
  partySize: { min: number; max: number };
  approvalMode: string;
}

export interface DiningExperience {
  id: string;
  name: string;
  price: string | null;
  partySize: { min: number; max: number };
  schedule: {
    durationInMinutes: number | null;
    entries: ExperienceScheduleEntry[];
  } | null;
}

interface ExperienceScheduleEntry {
  recurrence: string;
  weeklyOptions?: {
    startDate?: string;
    endDate?: string;
    startDaysAndTimes?: { day: string; time: string }[];
  };
}

export type DiningReservationCode = "INVALID_INPUT" | "NO_AVAILABILITY" | "RESERVATION_UNAVAILABLE";

export class DiningReservationError extends Error {
  constructor(
    public readonly code: DiningReservationCode,
    message: string,
  ) {
    super(message);
    this.name = "DiningReservationError";
  }
}

export interface DiningReservationReceipt {
  id: string;
  status: string;
  localStartDate: string;
  partySize: number;
}

interface RawReservationLocation {
  _id?: string;
  default?: boolean;
  configuration?: {
    onlineReservations?: {
      approval?: { mode?: string };
      partySize?: { min?: number; max?: number };
      onlineReservationsEnabled?: boolean;
    };
  };
}

interface RawExperience {
  _id?: string;
  configuration?: {
    displayInfo?: { name?: string };
    paymentPolicy?: { perGuestOptions?: { price?: string } };
    onlineReservations?: {
      partySize?: { min?: number; max?: number };
      businessSchedule?: {
        durationInMinutes?: number;
        entries?: ExperienceScheduleEntry[];
      };
    };
  };
}

export function siteToday(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function weekdayOfLocalDate(date: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIMEZONE,
    weekday: "long",
  }).format(new Date(`${date}T12:00:00Z`));
  return parts.toUpperCase();
}

// There is no experience-scoped slot API anywhere in the SDK or the REST keys —
// the experienceId option is silently dropped by getScheduledTimeSlots — so
// bookable times are projected from the experience's own businessSchedule.
export function projectOccurrences(
  experience: DiningExperience,
  count: number,
  reference: Date = new Date(),
): string[] {
  const entries = experience.schedule?.entries ?? [];
  if (entries.length === 0 || count <= 0) return [];
  const today = siteToday(reference);
  const anchor = Date.parse(`${today}T12:00:00Z`);

  const occurrences: string[] = [];
  for (const entry of entries) {
    if (entry.recurrence !== "WEEKLY") continue;
    const days = entry.weeklyOptions?.startDaysAndTimes ?? [];
    for (const { day, time } of days) {
      for (let offset = 0; offset <= MAX_PROJECTION_DAYS; offset += 1) {
        const date = new Date(anchor + offset * 86_400_000).toISOString().slice(0, 10);
        if (weekdayOfLocalDate(date) !== day.toUpperCase()) continue;
        const startDate = entry.weeklyOptions?.startDate;
        const endDate = entry.weeklyOptions?.endDate;
        if (startDate && date < startDate) continue;
        if (endDate && date > endDate) continue;
        const hour = Number(time.slice(0, 2));
        if (hour < 0 || hour > 23) continue;
        const localStart = `${date}T${time.trim()}:00`;
        if (localStart < `${today}T00:00:00`) continue;
        occurrences.push(localStart);
      }
    }
  }
  return occurrences.slice(0, count);
}

const listLocationsElevated = auth.elevate(reservationLocations.listReservationLocations);
const queryExperiencesElevated = auth.elevate(experiences.queryExperiences);
const createReservationElevated = auth.elevate(reservations.createReservation);

interface LocationList {
  reservationLocations?: RawReservationLocation[];
}

export async function getReservationLocation(): Promise<ReservationLocationContext | null> {
  try {
    const response = (await listLocationsElevated()) as LocationList;
    const locations = response.reservationLocations ?? [];
    const location = locations.find((loc) => loc.default) ?? locations[0];
    if (!location?._id) return null;
    const config = location.configuration?.onlineReservations;
    return {
      id: location._id,
      partySize: { min: config?.partySize?.min ?? 1, max: config?.partySize?.max ?? 6 },
      approvalMode: config?.approval?.mode ?? "AUTOMATIC",
    };
  } catch (error) {
    console.error("[dining/reservations] location lookup failed:", error);
    return null;
  }
}

interface ExperienceResult {
  items?: RawExperience[];
}

export async function getJungleExperience(): Promise<DiningExperience | null> {
  try {
    const result = (await queryExperiencesElevated().limit(50).find()) as ExperienceResult;
    // REST/SDK Experiences carry the title only inside displayInfo, not at the
    // top level of the entity.
    const raw = (result.items ?? []).find((exp) => exp.configuration?.displayInfo?.name === EXPERIENCE_NAME);
    if (!raw?._id) return null;
    const online = raw.configuration?.onlineReservations;
    return {
      id: raw._id,
      name: raw.configuration?.displayInfo?.name ?? EXPERIENCE_NAME,
      price: raw.configuration?.paymentPolicy?.perGuestOptions?.price ?? null,
      partySize: {
        min: online?.partySize?.min ?? 2,
        max: online?.partySize?.max ?? 8,
      },
      schedule: online?.businessSchedule
        ? {
            durationInMinutes: online.businessSchedule.durationInMinutes ?? null,
            entries: online.businessSchedule.entries ?? [],
          }
        : null,
    };
  } catch (error) {
    console.error("[dining/reservations] experience query failed:", error);
    return null;
  }
}

export interface CreateDiningReservationInput {
  startDate: string;
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function createDiningReservation(
  input: CreateDiningReservationInput,
): Promise<DiningReservationReceipt> {
  const location = await getReservationLocation();
  const experience = await getJungleExperience();
  if (!location || !experience) {
    throw new DiningReservationError("RESERVATION_UNAVAILABLE", "Reservation service is not configured");
  }

  if (!LOCAL_DATETIME_PATTERN.test(input.startDate)) {
    throw new DiningReservationError("INVALID_INPUT", "Invalid reservation date");
  }
  const partySize = Number(input.partySize);
  const minimumSize = Math.max(location.partySize.min, experience.partySize.min);
  const maximumSize = Math.min(location.partySize.max, experience.partySize.max);
  if (!Number.isInteger(partySize) || partySize < minimumSize || partySize > maximumSize) {
    throw new DiningReservationError("INVALID_INPUT", "Party size outside allowed range");
  }

  const firstName = input.firstName.trim();
  const phone = input.phone.trim();
  // Wix requires firstName + phone on every online reservation.
  if (!firstName || !phone) {
    throw new DiningReservationError("INVALID_INPUT", "First name and phone are required");
  }
  if (input.email && !EMAIL_PATTERN.test(input.email.trim())) {
    throw new DiningReservationError("INVALID_INPUT", "Invalid email");
  }

  const occurrences = projectOccurrences({ ...experience, price: experience.price }, 40);
  if (occurrences.length > 0 && !occurrences.includes(input.startDate)) {
    throw new DiningReservationError("NO_AVAILABILITY", "No seating at that date");
  }

  // details.experienceId is a valid REST field but the installed Details type
  // omits it (feature/version drift), so the payload goes through a cast.
  const payload = {
    details: {
      reservationLocationId: location.id,
      experienceId: experience.id,
      startDate: new Date(input.startDate),
      partySize,
    },
    reservee: {
      firstName,
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      phone,
    },
  } as unknown as Parameters<typeof createReservationElevated>[0];

  const created = await createReservationElevated(payload);
  // createReservation returns the Reservation directly (not wrapped in
  // `{ reservation }` like the held/reserve pair).
  const done = created as { _id?: string; status?: string };
  if (!done._id) {
    throw new DiningReservationError("RESERVATION_UNAVAILABLE", "Wix returned no reservation");
  }

  return {
    id: done._id,
    status: done.status ?? "RESERVED",
    localStartDate: input.startDate,
    partySize,
  };
}
