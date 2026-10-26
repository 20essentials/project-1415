// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EventRegistration } from '@/features/events/event-registration';

const { createRsvp, listTicketTiers, reserveTickets, redirectsCreate } = vi.hoisted(() => ({
  createRsvp: vi.fn(),
  listTicketTiers: vi.fn(),
  reserveTickets: vi.fn(),
  redirectsCreate: vi.fn(),
}));

vi.mock('@/features/events/events', () => ({
  createRsvp,
  listTicketTiers,
  reserveTickets,
}));

vi.mock('@wix/redirects', () => ({
  redirects: { createRedirectSession: redirectsCreate },
}));

vi.mock('@/shared/analytics', () => ({
  trackEvent: vi.fn(),
}));

const enLabels = {
  detailsTitle: 'Your details',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  invalid: 'Invalid value',
  submit: "I'm coming",
  submitting: 'Registering…',
  successTitle: 'See you at the greenhouse!',
  successBody: "We've sent a confirmation to your email.",
  error: "We couldn't register you right now. Please try again.",
  retry: 'Try again',
};

function mountRsvp() {
  render(
    <EventRegistration
      mode="rsvp"
      eventId="evt-1"
      slug="open-day-meet-the-predators"
      locale="en"
      labels={enLabels}
    />,
  );
  const form = document.querySelector('form[data-testid="event-registration"]') as HTMLFormElement;
  return {
    form,
    firstName: screen.getByLabelText(/^First name/) as HTMLInputElement,
    lastName: screen.getByLabelText(/^Last name/) as HTMLInputElement,
    email: screen.getByLabelText(/^Email/) as HTMLInputElement,
  };
}

function fill({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  fireEvent.change(screen.getByLabelText(/^First name/), { target: { value: firstName } });
  fireEvent.change(screen.getByLabelText(/^Last name/), { target: { value: lastName } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: email } });
}

afterEach(() => {
  createRsvp.mockReset();
  listTicketTiers.mockReset();
  reserveTickets.mockReset();
  redirectsCreate.mockReset();
});

describe('EventRegistration — RSVP mode', () => {
  it('validates the built-in fields and surfaces the errors without calling the SDK', async () => {
    const { form } = mountRsvp();

    fireEvent.submit(form);

    await waitFor(() => expect(screen.getAllByText('Invalid value')).toHaveLength(3));
    expect(createRsvp).not.toHaveBeenCalled();
  });

  it('creates the RSVP and shows an inline confirmation with role="status"', async () => {
    createRsvp.mockResolvedValue(undefined);
    mountRsvp();
    fill({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });

    fireEvent.click(screen.getByText("I'm coming"));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('confirmation to your email'));
    expect(createRsvp).toHaveBeenCalledWith({
      eventId: 'evt-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
  });

  it('shows an accessible error with role="alert" when the RSVP is rejected', async () => {
    createRsvp.mockRejectedValue(new Error('CLOSED'));
    mountRsvp();
    fill({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' });

    fireEvent.click(screen.getByText("I'm coming"));

    const alert = await waitFor(() => screen.getByRole('alert'));
    expect(alert).toHaveTextContent("We couldn't register you right now.");
  });
});

describe('EventRegistration — ticketed mode', () => {
  it('loads tiers, enables the buyable one and disables the rest', async () => {
    listTicketTiers.mockResolvedValue([
      {
        id: 'tier-1',
        name: 'General Admission',
        description: null,
        priceValue: '8.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_STARTED',
        limitPerCheckout: 4,
      },
      {
        id: 'tier-old',
        name: 'Early Bird',
        description: null,
        priceValue: '6.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_ENDED',
        limitPerCheckout: 4,
      },
    ]);
    render(
      <EventRegistration mode="tickets" eventId="evt-2" slug="guided-tour-of-the-greenhouse-1" locale="en" />,
    );

    await waitFor(() => expect(screen.getByText('Choose your tickets')).toBeInTheDocument());
    expect(screen.getByText('General Admission')).toBeInTheDocument();
    expect(screen.getByText('Early Bird').closest('button')).toBeDisabled();
    expect(screen.getByText('€8.00')).toBeInTheDocument();
  });

  it('shows an accessible tiers error and allows a retry', async () => {
    listTicketTiers.mockRejectedValue(new Error('boom'));
    render(
      <EventRegistration mode="tickets" eventId="evt-2" slug="guided-tour-of-the-greenhouse-1" locale="en" />,
    );

    const alert = await waitFor(() => screen.getByRole('alert'));
    expect(alert).toHaveTextContent("We couldn't load the tickets.");

    listTicketTiers.mockResolvedValue([
      {
        id: 'tier-1',
        name: 'General Admission',
        description: null,
        priceValue: '8.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_STARTED',
        limitPerCheckout: 4,
      },
    ]);
    fireEvent.click(screen.getByText('Try again'));
    await waitFor(() => expect(screen.getByText('General Admission')).toBeInTheDocument());
  });

  it('reserves tickets and redirects to the hosted checkout with the localized paypal callbacks', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { origin: 'https://site.test', pathname: '/events/tour', assign, href: '' });

    listTicketTiers.mockResolvedValue([
      {
        id: 'tier-1',
        name: 'General Admission',
        description: null,
        priceValue: '8.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_STARTED',
        limitPerCheckout: 4,
      },
    ]);
    reserveTickets.mockResolvedValue('res-1');
    redirectsCreate.mockResolvedValue({ redirectSession: { fullUrl: 'https://checkout.example.com/tickets' } });

    render(
      <EventRegistration mode="tickets" eventId="evt-2" slug="guided-tour-of-the-greenhouse-1" locale="en" />,
    );
    await waitFor(() => expect(screen.getByText('Choose your tickets')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Reserve & pay/));

    await waitFor(() => expect(redirectsCreate).toHaveBeenCalled());
    expect(redirectsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        eventsCheckout: { reservationId: 'res-1', eventSlug: 'guided-tour-of-the-greenhouse-1' },
      }),
    );
    const call = redirectsCreate.mock.calls[0][0];
    expect(call.callbacks.thankYouPageUrl).toContain('/thank-you');
    expect(call.callbacks.postFlowUrl).toContain('/events/tour');
    expect(assign).toHaveBeenCalledWith('https://checkout.example.com/tickets');
    vi.unstubAllGlobals();
  });

  it('surfaces the payment-gate message instead of a generic failure', async () => {
    vi.stubGlobal('location', { origin: 'https://site.test', pathname: '/events/tour', assign: vi.fn(), href: '' });
    listTicketTiers.mockResolvedValue([
      {
        id: 'tier-1',
        name: 'General Admission',
        description: null,
        priceValue: '8.00',
        currency: 'EUR',
        free: false,
        saleStatus: 'SALE_STARTED',
        limitPerCheckout: 4,
      },
    ]);
    reserveTickets.mockRejectedValue(new Error('403: No payment method configured'));

    render(
      <EventRegistration mode="tickets" eventId="evt-2" slug="guided-tour-of-the-greenhouse-1" locale="en" />,
    );
    await waitFor(() => expect(screen.getByText('Choose your tickets')).toBeInTheDocument());

    fireEvent.click(screen.getByText(/Reserve & pay/));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/payment method/i),
    );
    vi.unstubAllGlobals();
  });
});
