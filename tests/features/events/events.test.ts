import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryEvents, getEventBySlug, getEvent, queryAvailableTickets } = vi.hoisted(() => ({
  queryEvents: vi.fn(),
  getEventBySlug: vi.fn(),
  getEvent: vi.fn(),
  queryAvailableTickets: vi.fn(),
}));

vi.mock('@wix/events', () => ({
  wixEventsV2: { queryEvents, getEventBySlug, getEvent },
  orders: { queryAvailableTickets },
  rsvpV2: { createRsvp: vi.fn() },
  ticketReservations: { createTicketReservation: vi.fn() },
}));

vi.mock('@/shared/wix-image', () => ({
  resolveWixImageUrl: ({ id }: { id?: string }) =>
    id ? `https://static.wixstatic.com/media/${id}` : null,
}));

const ELEVATED_EVENT_FIELDS = ['DETAILS', 'TEXTS', 'REGISTRATION', 'URLS'];

const sdkEvent = {
  _id: 'd172c511-0a82-4f94-ae6a-598c3c6e2755',
  slug: 'open-day-meet-the-predators',
  title: 'Open Day: Meet the Predators',
  shortDescription: 'Free open day at the greenhouse.',
  description: 'Come meet the plants in person.',
  status: 'UPCOMING',
  dateAndTimeSettings: {
    startDate: new Date('2026-11-28T10:00:00.000Z'),
    endDate: new Date('2026-11-28T16:00:00.000Z'),
    timeZoneId: 'Europe/Rome',
    formatted: { dateAndTime: 'Sat, Nov 28, 2026, 11:00 AM' },
  },
  location: { name: 'Petals & Predators Greenhouse', type: 'VENUE' },
  registration: { initialType: 'RSVP', status: 'OPEN_RSVP' },
};

const sdkTier = {
  _id: '1cb20af0-5c67-4910-96b5-37179a28cdac',
  eventId: '6c3fd94e-20d7-4cf9-9f4f-56e3afeba52b',
  name: 'General Admission',
  description: 'Guided tour.',
  price: { amount: '8.00', currency: 'EUR' },
  free: false,
  saleStatus: 'SALE_STARTED',
  limitPerCheckout: 4,
};

async function loadFeature() {
  vi.resetModules();
  return import('@/features/events/events');
}

describe('listEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryEvents.mockResolvedValue({ events: [sdkEvent] });
  });

  it('queries upcoming events flat, sorted by start, with a positive paging limit and the event fieldsets', async () => {
    const { listEvents } = await loadFeature();

    await listEvents();

    expect(queryEvents).toHaveBeenCalledTimes(1);
    const [query, options] = queryEvents.mock.calls[0];
    expect(query).toEqual({
      filter: { status: { $in: ['UPCOMING', 'STARTED'] } },
      sort: [{ fieldName: 'dateAndTimeSettings.startDate', order: 'ASC' }],
      paging: { offset: 0, limit: 50 },
    });
    expect(options).toEqual({ fields: ELEVATED_EVENT_FIELDS });
  });

  it('maps the SDK event onto the EventInfo DTO', async () => {
    const { listEvents } = await loadFeature();

    await expect(listEvents()).resolves.toEqual([
      expect.objectContaining({
        id: 'd172c511-0a82-4f94-ae6a-598c3c6e2755',
        slug: 'open-day-meet-the-predators',
        title: 'Open Day: Meet the Predators',
        initialType: 'RSVP',
        eventStatus: 'UPCOMING',
        startUtc: '2026-11-28T10:00:00.000Z',
        timeZoneId: 'Europe/Rome',
        formattedDate: 'Sat, Nov 28, 2026, 11:00 AM',
        venue: 'Petals & Predators Greenhouse',
        image: null,
      }),
    ]);
  });

  it('drops records without an id or slug', async () => {
    queryEvents.mockResolvedValue({ events: [{ ...sdkEvent, slug: '' }, sdkEvent] });
    const { listEvents } = await loadFeature();

    await expect(listEvents()).resolves.toHaveLength(1);
  });

  it('returns [] when the query fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryEvents.mockRejectedValue(new Error('boom'));
    const { listEvents } = await loadFeature();

    await expect(listEvents()).resolves.toEqual([]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('getEventBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the slug and fieldsets and unwraps the { event } envelope', async () => {
    getEventBySlug.mockResolvedValue({ event: sdkEvent });
    const { getEventBySlug: getEventFeature } = await loadFeature();

    const result = await getEventFeature('open-day-meet-the-predators');

    expect(getEventBySlug).toHaveBeenCalledWith(
      'open-day-meet-the-predators',
      { fields: ELEVATED_EVENT_FIELDS },
    );
    expect(result).toMatchObject({
      id: 'd172c511-0a82-4f94-ae6a-598c3c6e2755',
      initialType: 'RSVP',
    });
  });

  it('returns null for an empty slug without calling the SDK', async () => {
    const { getEventBySlug: getEventFeature } = await loadFeature();

    await expect(getEventFeature('')).resolves.toBeNull();
    expect(getEventBySlug).not.toHaveBeenCalled();
  });

  it('returns null when the request fails (soft 404 path)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getEventBySlug.mockRejectedValue(new Error('boom'));
    const { getEventBySlug: getEventFeature } = await loadFeature();

    await expect(getEventFeature('nope')).resolves.toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null when the event is not found', async () => {
    getEventBySlug.mockResolvedValue({ event: undefined });
    const { getEventBySlug: getEventFeature } = await loadFeature();

    await expect(getEventFeature('nope')).resolves.toBeNull();
  });
});

describe('listTicketTiers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries available tickets by eventId and maps price from amount', async () => {
    queryAvailableTickets.mockResolvedValue({ definitions: [sdkTier] });
    const { listTicketTiers } = await loadFeature();

    await expect(listTicketTiers('6c3fd94e-20d7-4cf9-9f4f-56e3afeba52b')).resolves.toEqual([
      {
        id: '1cb20af0-5c67-4910-96b5-37179a28cdac',
        name: 'General Admission',
        description: 'Guided tour.',
        priceValue: '8.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_STARTED',
        limitPerCheckout: 4,
      },
    ]);
    expect(queryAvailableTickets).toHaveBeenCalledWith({
      filter: { eventId: '6c3fd94e-20d7-4cf9-9f4f-56e3afeba52b' },
      limit: 20,
    });
  });

  it('falls back to pricing.fixedPrice when price has no amount', async () => {
    queryAvailableTickets.mockResolvedValue({
      definitions: [{ ...sdkTier, price: { currency: 'EUR' }, pricing: { pricingType: 'FIXED', fixedPrice: { value: '8.00', currency: 'EUR' } } }],
    });
    const { listTicketTiers } = await loadFeature();

    await expect(listTicketTiers('evt')).resolves.toEqual([expect.objectContaining({ priceValue: '8.00', currency: 'EUR' })]);
  });

  it('returns [] for an empty eventId', async () => {
    const { listTicketTiers } = await loadFeature();

    await expect(listTicketTiers('')).resolves.toEqual([]);
    expect(queryAvailableTickets).not.toHaveBeenCalled();
  });

  it('returns [] when the request fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    queryAvailableTickets.mockRejectedValue(new Error('boom'));
    const { listTicketTiers } = await loadFeature();

    await expect(listTicketTiers('evt')).resolves.toEqual([]);
    spy.mockRestore();
  });
});

describe('RSVP / ticket reservation helpers', () => {
  it('createRsvp posts the flat built-in-field body with status YES', async () => {
    const { rsvpV2 } = await import('@wix/events');
    const { createRsvp } = await loadFeature();

    await createRsvp({ eventId: 'evt', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });

    expect(rsvpV2.createRsvp).toHaveBeenCalledWith({
      eventId: 'evt',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      status: 'YES',
    });
  });

  it('reserveTickets returns the reservation _id', async () => {
    const { ticketReservations } = await import('@wix/events');
    vi.mocked(ticketReservations.createTicketReservation).mockResolvedValue({
      _id: 'res-1',
    } as never);
    const { reserveTickets } = await loadFeature();

    await expect(
      reserveTickets({ tickets: [{ ticketDefinitionId: 'tier-1', quantity: 2 }] }),
    ).resolves.toBe('res-1');
    expect(ticketReservations.createTicketReservation).toHaveBeenCalledWith({
      tickets: [{ ticketDefinitionId: 'tier-1', quantity: 2 }],
    });
  });
});
