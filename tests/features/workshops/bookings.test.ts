import { describe, expect, it, vi, beforeEach } from 'vitest';
import { availabilityTimeSlots, bookings, extendedBookings, services } from '@wix/bookings';
import { auth } from '@wix/essentials';
import { createWorkshopBooking, getWorkshopBookingState } from '@/features/workshops/bookings';

vi.mock('@wix/bookings', () => ({
  availabilityTimeSlots: {
    listAvailabilityTimeSlots: vi.fn(),
  },
  bookings: {
    createBooking: vi.fn(),
  },
  services: {
    queryServices: vi.fn(),
  },
  extendedBookings: {
    queryExtendedBookings: vi.fn(),
  },
}));

vi.mock('@wix/essentials', () => ({
  auth: {
    elevate: (fn: unknown) => fn,
  },
}));

describe('createWorkshopBooking payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
    (services.queryServices as any).mockReturnValue({
      limit: () => ({
        find: () => Promise.resolve({
          items: [{
            _id: 'svc-1',
            type: 'APPOINTMENT',
            hidden: false,
            mainSlug: { name: 'care-101' },
            name: 'Care 101',
            schedule: { availabilityConstraints: { sessionDurations: [60] } },
            payment: { rateType: 'FIXED', fixed: { price: { value: '35.00', currency: 'EUR' } } },
          }],
        }),
      }),
    });
    (availabilityTimeSlots.listAvailabilityTimeSlots as any).mockResolvedValue({
      timeSlots: [{
        bookable: true,
        localStartDate: '2026-10-25T10:00:00',
        localEndDate: '2026-10-25T11:00:00',
        scheduleId: 'sch-1',
      }],
    });
    (bookings.createBooking as any).mockResolvedValue({
      booking: { _id: 'book-1', status: 'PENDING' },
    });
  });

  it('sends paymentOption ONLINE', async () => {
    const receipt = await createWorkshopBooking({
      serviceId: 'svc-1',
      localStartDate: '2026-10-25T10:00:00',
      values: { first_name: 'Ana', last_name: 'Lo', email: 'ana@example.com' },
      paymentOption: 'ONLINE',
    });
    expect(receipt.id).toBe('book-1');
    expect(bookings.createBooking).toHaveBeenCalledTimes(1);
    const arg = (bookings.createBooking as any).mock.calls[0][0];
    expect(arg.selectedPaymentOption).toBe('ONLINE');
    expect(arg.status).toBe('PENDING');
  });

  it('offline remains CONFIRMED', async () => {
    (bookings.createBooking as any).mockResolvedValue({ booking: { _id: 'book-2', status: 'CONFIRMED' } });
    const receipt = await createWorkshopBooking({
      serviceId: 'svc-1',
      localStartDate: '2026-10-25T10:00:00',
      values: { first_name: 'Ana', last_name: 'Lo', email: 'ana@example.com' },
    });
    expect(receipt.status).toBe('CONFIRMED');
    const arg = (bookings.createBooking as any).mock.calls[0][0];
    expect(arg.selectedPaymentOption).toBe('OFFLINE');
  });

  it('exposes the workshop slug on the receipt', async () => {
    const receipt = await createWorkshopBooking({
      serviceId: 'svc-1',
      localStartDate: '2026-10-25T10:00:00',
      values: { first_name: 'Ana', last_name: 'Lo', email: 'ana@example.com' },
    });
    expect(receipt.slug).toBe('care-101');
  });
});

describe('getWorkshopBookingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.elevate as any) = (fn: any) => fn;
  });

  it('reads status and paymentStatus from extended bookings', async () => {
    (extendedBookings.queryExtendedBookings as any).mockResolvedValue({
      extendedBookings: [{ booking: { _id: 'b-1', status: 'PENDING', paymentStatus: 'NOT_PAID' } }],
    });
    const state = await getWorkshopBookingState('b-1');
    expect(state).toEqual({ status: 'PENDING', paymentStatus: 'NOT_PAID' });
    expect((extendedBookings.queryExtendedBookings as any).mock.calls[0][0].filter.id).toEqual({ $eq: 'b-1' });
  });

  it('returns null when Wix fails or the booking is missing', async () => {
    (extendedBookings.queryExtendedBookings as any).mockRejectedValue(new Error('boom'));
    await expect(getWorkshopBookingState('b-1')).resolves.toBeNull();
    (extendedBookings.queryExtendedBookings as any).mockResolvedValue({ extendedBookings: [] });
    await expect(getWorkshopBookingState('b-1')).resolves.toBeNull();
  });
});
