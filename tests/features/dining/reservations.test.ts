import { describe, expect, it, vi, beforeEach } from 'vitest';
import { reservationLocations, reservations, experiences } from '@wix/table-reservations';
import {
  createDiningReservation,
  DiningReservationError,
  siteToday,
  projectOccurrences,
} from '@/features/dining/reservations';
import type { DiningExperience } from '@/features/dining/reservations';

vi.mock('@wix/table-reservations', () => ({
  reservationLocations: { listReservationLocations: vi.fn() },
  experiences: { queryExperiences: vi.fn() },
  reservations: { createReservation: vi.fn() },
}));

const mockListLocations = reservationLocations.listReservationLocations as ReturnType<typeof vi.fn>;
const mockQueryExperiences = experiences.queryExperiences as ReturnType<typeof vi.fn>;
const mockCreate = reservations.createReservation as ReturnType<typeof vi.fn>;

const LOCATION = {
  _id: 'loc-1',
  default: true,
  configuration: { onlineReservations: { approval: { mode: 'AUTOMATIC' }, partySize: { min: 1, max: 6 } } },
};

// La proyección de createDiningReservation usa "now": el fixture tiene que
// reservar un viernes que siga siendo futuro cuando la suite crezca de fecha.
const tomorrow = (offset: number): string =>
  new Date(Date.parse(`${siteToday(new Date())}T12:00:00Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);

const nextFriday = (): string => {
  const probe = new Date(Date.parse(`${siteToday(new Date())}T12:00:00Z`));
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(probe.getTime() + offset * 86_400_000);
    if (new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'long' }).format(date).toUpperCase() === 'FRIDAY') {
      return date.toISOString().slice(0, 10);
    }
  }
  return siteToday(new Date());
};

const EXPERIENCE: DiningExperience = {
  id: 'exp-1',
  name: 'Jungle Tasting Dinner',
  price: '55.00',
  partySize: { min: 2, max: 8 },
  schedule: {
    durationInMinutes: 90,
    entries: [
      { recurrence: 'WEEKLY', weeklyOptions: { startDate: nextFriday(), startDaysAndTimes: [{ day: 'FRIDAY', time: '19:30' }] } },
    ],
  },
};

function mockBackend(location: unknown, experience: DiningExperience | null, created?: unknown) {
  mockListLocations.mockResolvedValue({ reservationLocations: [location] });
  if (experience === null) {
    mockQueryExperiences.mockRejectedValue(new Error('boom'));
  } else {
    mockQueryExperiences.mockReturnValue({ limit: () => ({ find: () => Promise.resolve({ items: [{ _id: experience.id, configuration: { displayInfo: { name: experience.name }, paymentPolicy: { perGuestOptions: { price: experience.price } }, onlineReservations: { partySize: experience.partySize, businessSchedule: experience.schedule } } }] }) }) });
  }
  if (created !== undefined) mockCreate.mockResolvedValue(created);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('projectOccurrences', () => {
  it('project next Friday occurrences in local datetime format', () => {
    const experience: DiningExperience = {
      ...EXPERIENCE,
      schedule: {
        durationInMinutes: 90,
        entries: [
          { recurrence: 'WEEKLY', weeklyOptions: { startDate: '2026-10-30', startDaysAndTimes: [{ day: 'FRIDAY', time: '19:30' }] } },
        ],
      },
    };
    const occurrences = projectOccurrences(experience, 3, new Date('2026-10-27T15:00:00Z'));
    // 2026-10-30, 11-06 and 11-13 are Fridays, Europe/Rome local 19:30 seatings
    expect(occurrences[0]).toBe('2026-10-30T19:30:00');
    expect(occurrences[1]).toBe('2026-11-06T19:30:00');
    expect(occurrences[2]).toBe('2026-11-13T19:30:00');
  });

  it('skips occurrences before the schedule startDate', () => {
    const past = { ...EXPERIENCE, schedule: { durationInMinutes: 90, entries: [{ recurrence: 'WEEKLY', weeklyOptions: { startDate: '2026-11-20', startDaysAndTimes: [{ day: 'FRIDAY', time: '19:30' }] } }] } };
    const occurrences = projectOccurrences(past, 2, new Date('2026-10-27T15:00:00Z'));
    expect(occurrences[0]).toBe('2026-11-20T19:30:00');
  });

  it('returns [] for an experience without schedule', () => {
    expect(projectOccurrences({ ...EXPERIENCE, schedule: null }, 3)).toEqual([]);
  });
});

describe('siteToday', () => {
  it('formats today in Europe/Rome', () => {
    expect(siteToday(new Date('2026-10-27T21:50:00Z'))).toBe('2026-10-27');
    // 00:30 local in Rome (+1 in autumn) — the next calendar day there
    expect(siteToday(new Date('2026-10-27T23:30:00Z'))).toBe('2026-10-28');
  });
});

describe('createDiningReservation', () => {
  const input = {
    startDate: `${nextFriday()}T19:30:00`,
    partySize: 4,
    firstName: 'Aly',
    lastName: 'Peters',
    email: 'aly@example.com',
    phone: '+39 340 0000000',
  };

  it('books with details.experienceId and returns the receipt', async () => {
    mockBackend(LOCATION, EXPERIENCE, { _id: 'res-1', status: 'RESERVED' });
    const receipt = await createDiningReservation(input);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {
          reservationLocationId: 'loc-1',
          experienceId: 'exp-1',
          startDate: new Date(input.startDate),
          partySize: 4,
        },
        reservee: { firstName: 'Aly', lastName: 'Peters', email: 'aly@example.com', phone: '+39 340 0000000' },
      }),
    );
    expect(receipt.id).toBe('res-1');
    expect(receipt.status).toBe('RESERVED');
  });

  it('throws INVALID_INPUT for a malformed date', async () => {
    mockBackend(LOCATION, EXPERIENCE);
    await expect(
      createDiningReservation({ ...input, startDate: 'not-a-date' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT', name: 'DiningReservationError' });
  });

  it('throws INVALID_INPUT outside the merged party-size bounds', async () => {
    mockBackend(LOCATION, EXPERIENCE);
    await expect(
      createDiningReservation({ ...input, startDate: '2026-10-30T19:30:00', partySize: 7 }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('throws INVALID_INPUT without firstName (Wix requirement)', async () => {
    mockBackend(LOCATION, EXPERIENCE);
    await expect(
      createDiningReservation({ ...input, firstName: '  ' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('throws NO_AVAILABILITY for a date outside the projected seatings', async () => {
    mockBackend(LOCATION, EXPERIENCE);
    await expect(
      createDiningReservation({ ...input, startDate: '2026-10-31T19:30:00' }),
    ).rejects.toMatchObject({ code: 'NO_AVAILABILITY' });
  });

  it('throws RESERVATION_UNAVAILABLE when the location is missing', async () => {
    mockListLocations.mockResolvedValue({ reservationLocations: [] });
    await expect(createDiningReservation(input)).rejects.toMatchObject({
      code: 'RESERVATION_UNAVAILABLE',
    });
  });

  it('throws RESERVATION_UNAVAILABLE when Wix fails', async () => {
    mockQueryExperiences.mockReturnValue({ limit: () => ({ find: () => Promise.resolve({ items: [] }) }) });
    mockListLocations.mockResolvedValue({ reservationLocations: [LOCATION] });
    await expect(createDiningReservation(input)).rejects.toMatchObject({
      code: 'RESERVATION_UNAVAILABLE',
    });
  });
});
