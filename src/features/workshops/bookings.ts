import { availabilityTimeSlots, bookings, services } from '@wix/bookings';
import { auth } from '@wix/essentials';

export const SITE_TIMEZONE = 'Europe/Rome';

const SERVICES_FETCH_LIMIT = 50;
const SLOTS_PAGE_LIMIT = 100;
const BOOKING_PARTICIPANTS = 1;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

export interface Workshop {
  id: string;
  slug: string;
  name: string;
  tagLine: string | null;
  description: string | null;
  durationMinutes: number | null;
  price: { amount: string; currency: string } | null;
  primaryResourceType: string | null;
}

export interface WorkshopSlot {
  localStartDate: string;
  localEndDate: string;
  staffName: string | null;
}

export type BookingFieldTarget = 'first_name' | 'last_name' | 'email' | 'phone' | 'add_your_message';

export interface BookingFormField {
  target: BookingFieldTarget;
  labelKey: string;
  inputType: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}

export const BOOKING_FORM_FIELDS: BookingFormField[] = [
  { target: 'first_name', labelKey: 'services.field.first-name', inputType: 'text', required: true },
  { target: 'last_name', labelKey: 'services.field.last-name', inputType: 'text', required: true },
  { target: 'email', labelKey: 'services.field.email', inputType: 'email', required: true },
  { target: 'phone', labelKey: 'services.field.phone', inputType: 'tel', required: false },
  { target: 'add_your_message', labelKey: 'services.field.message', inputType: 'textarea', required: false },
];

export interface BookingReceipt {
  id: string;
  status: string;
  serviceName: string;
  localStartDate: string;
  localEndDate: string;
}

export type WorkshopBookingCode = 'INVALID_INPUT' | 'NOT_FOUND' | 'SLOT_UNAVAILABLE';

export class WorkshopBookingError extends Error {
  constructor(
    public readonly code: WorkshopBookingCode,
    message: string,
  ) {
    super(message);
    this.name = 'WorkshopBookingError';
  }
}

interface ResolvedSlot {
  localStartDate: string;
  localEndDate: string;
  scheduleId: string | null;
  resource: { id: string; name: string | null } | null;
  location: { locationType: 'OWNER_BUSINESS' | 'OWNER_CUSTOM'; _id?: string; name?: string } | null;
}

const queryServicesElevated = auth.elevate(services.queryServices);
const listAvailabilityElevated = auth.elevate(availabilityTimeSlots.listAvailabilityTimeSlots);
const createBookingElevated = auth.elevate(bookings.createBooking);

export function siteToday(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(reference);
}

export function isLocalDate(value: string): boolean {
  if (!LOCAL_DATE_PATTERN.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export async function listWorkshops(): Promise<Workshop[]> {
  try {
    const result = await queryServicesElevated().limit(SERVICES_FETCH_LIMIT).find();
    return result.items
      .filter((service) => service.type === 'APPOINTMENT' && !service.hidden)
      .map((service): Workshop | null => {
        const slug = service.mainSlug?.name;
        if (!service._id || !slug) return null;
        const constraints = service.schedule?.availabilityConstraints;
        const price =
          service.payment?.rateType === 'FIXED' ? service.payment.fixed?.price : undefined;
        return {
          id: service._id,
          slug,
          name: service.name ?? slug,
          tagLine: service.tagLine ?? null,
          description: service.description ?? null,
          durationMinutes:
            constraints?.sessionDurations?.[0] ?? constraints?.durations?.[0]?.minutes ?? null,
          price:
            price?.value && price.currency ? { amount: price.value, currency: price.currency } : null,
          primaryResourceType: service.primaryResourceType ?? null,
        };
      })
      .filter((workshop): workshop is Workshop => workshop !== null);
  } catch (error) {
    console.error('[bookings] services query failed:', error);
    return [];
  }
}

export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  const workshops = await listWorkshops();
  return workshops.find((workshop) => workshop.slug === slug) ?? null;
}

export async function getWorkshopById(id: string): Promise<Workshop | null> {
  if (!id) return null;
  const workshops = await listWorkshops();
  return workshops.find((workshop) => workshop.id === id) ?? null;
}

async function resolveAvailableSlots(workshop: Workshop, date: string): Promise<ResolvedSlot[]> {
  const response = await listAvailabilityElevated({
    serviceId: workshop.id,
    fromLocalDate: `${date}T00:00:00`,
    toLocalDate: `${date}T23:59:59`,
    timeZone: SITE_TIMEZONE,
    bookable: true,
    includeResourceTypeIds: workshop.primaryResourceType
      ? [workshop.primaryResourceType]
      : undefined,
    cursorPaging: { limit: SLOTS_PAGE_LIMIT },
  });

  return (response.timeSlots ?? [])
    .filter((slot) => slot.bookable && slot.localStartDate && slot.localEndDate)
    .map((slot) => {
      const resource = slot.availableResources?.flatMap((group) => group.resources ?? [])[0];
      const locationType =
        slot.location?.locationType === 'CUSTOM' ? 'OWNER_CUSTOM' : 'OWNER_BUSINESS';
      return {
        localStartDate: slot.localStartDate ?? '',
        localEndDate: slot.localEndDate ?? '',
        scheduleId: slot.scheduleId ?? null,
        resource: resource?._id ? { id: resource._id, name: resource.name ?? null } : null,
        location: {
          locationType,
          ...(slot.location?._id ? { _id: slot.location._id } : {}),
          ...(slot.location?.name ? { name: slot.location.name } : {}),
        },
      };
    });
}

export async function listWorkshopSlots(
  workshop: Workshop,
  date: string,
): Promise<WorkshopSlot[]> {
  if (!isLocalDate(date)) throw new WorkshopBookingError('INVALID_INPUT', 'Invalid date');
  const slots = await resolveAvailableSlots(workshop, date);
  return slots.map((slot) => ({
    localStartDate: slot.localStartDate,
    localEndDate: slot.localEndDate,
    staffName: slot.resource?.name ?? null,
  }));
}

// Wix phone format only accepts E.164; visitors type local numbers, so default to Italy (+39).
function normalizePhone(value: string): string {
  const compact = value.replace(/[\s().-]/g, '');
  if (compact.startsWith('+')) return compact;
  if (compact.startsWith('00')) return `+${compact.slice(2)}`;
  if (/^\d{6,15}$/.test(compact)) return `+39${compact}`;
  return compact;
}

function pickBookingValues(values: Record<string, string>): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const field of BOOKING_FORM_FIELDS) {
    const value = (values[field.target] ?? '').trim();
    const stored = value
      ? field.inputType === 'tel'
        ? normalizePhone(value)
        : value
      : '';
    if (stored) picked[field.target] = stored;
    if (field.required && !value) {
      throw new WorkshopBookingError('INVALID_INPUT', `${field.target} is required`);
    }
    if (value && field.inputType === 'email' && !EMAIL_PATTERN.test(value)) {
      throw new WorkshopBookingError('INVALID_INPUT', `${field.target} is not a valid email`);
    }
  }
  return picked;
}

export interface CreateWorkshopBookingInput {
  serviceId: string;
  localStartDate: string;
  values: Record<string, string>;
  paymentOption?: 'OFFLINE' | 'ONLINE';
}

export async function createWorkshopBooking(
  input: CreateWorkshopBookingInput,
): Promise<BookingReceipt> {
  if (!LOCAL_DATETIME_PATTERN.test(input.localStartDate)) {
    throw new WorkshopBookingError('INVALID_INPUT', 'Invalid slot start');
  }
  const values = pickBookingValues(input.values);
  const workshop = await getWorkshopById(input.serviceId);
  if (!workshop) throw new WorkshopBookingError('NOT_FOUND', 'Unknown service');

  const paymentOption = input.paymentOption === 'ONLINE' ? 'ONLINE' : 'OFFLINE';

  const date = input.localStartDate.slice(0, 10);
  const slots = await resolveAvailableSlots(workshop, date);
  const slot = slots.find((candidate) => candidate.localStartDate === input.localStartDate);
  if (!slot || !slot.scheduleId) {
    throw new WorkshopBookingError('SLOT_UNAVAILABLE', 'Slot is no longer available');
  }

  const created = await createBookingElevated(
    {
      totalParticipants: BOOKING_PARTICIPANTS,
      status: paymentOption === 'ONLINE' ? 'PENDING' : 'CONFIRMED',
      selectedPaymentOption: paymentOption,
      bookedEntity: {
        slot: {
          serviceId: workshop.id,
          scheduleId: slot.scheduleId,
          startDate: slot.localStartDate,
          endDate: slot.localEndDate,
          timezone: SITE_TIMEZONE,
          ...(slot.resource
            ? {
                resource: {
                  _id: slot.resource.id,
                  ...(slot.resource.name ? { name: slot.resource.name } : {}),
                },
              }
            : {}),
          ...(slot.location ? { location: slot.location } : {}),
        },
      },
    },
    {
      formSubmission: values,
      participantNotification: { notifyParticipants: true },
      sendSmsReminder: false,
    },
  );

  const booking = created.booking;
  if (!booking) {
    throw new Error('createWorkshopBooking: Wix returned no booking');
  }

  return {
    id: booking._id ?? '',
    status: booking.status ?? (paymentOption === 'ONLINE' ? 'PENDING' : 'CONFIRMED'),
    serviceName: workshop.name,
    localStartDate: slot.localStartDate,
    localEndDate: slot.localEndDate,
  };
}

export type WorkshopCheckoutCode = 'INVALID_INPUT' | 'CHECKOUT_UNAVAILABLE';

export class WorkshopCheckoutError extends Error {
  constructor(
    public readonly code: WorkshopCheckoutCode,
    message: string,
  ) {
    super(message);
    this.name = 'WorkshopCheckoutError';
  }
}
