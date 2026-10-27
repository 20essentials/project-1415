// @vitest-environment jsdom
import { describe, afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReservationForm } from '@/features/dining/reservation-form';

vi.mock('@/shared/analytics', () => ({
  trackEvent: vi.fn(),
}));

const labels = {
  pickDate: 'Pick a seating',
  pickParty: 'Party size',
  noOccurrences: 'No seatings are open right now — the next date is TBA.',
  detailsTitle: 'Your details',
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  invalid: 'Invalid value',
  submit: 'Reserve my table',
  submitting: 'Reserving…',
  formError: 'Something went wrong. Please try again.',
  success: "You're booked.",
  requested: 'We received your reservation — the greenhouse will confirm shortly.',
};

const baseProps = {
  occurrences: ['2026-10-30T19:30:00', '2026-11-06T19:30:00'],
  partySize: { min: 2, max: 8 },
  locale: 'en',
  timeZone: 'Europe/Rome',
  labels,
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ReservationForm', () => {
  it('renders seatings and enables submit only once a seating is picked', async () => {
    const { unmount } = render(<ReservationForm {...baseProps} />);
    expect(screen.getAllByRole('button', { name: /Pick a seating|·/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: labels.submit })).toBeDisabled();
    unmount();
  });

  it('shows the TBA copy when no seatings are open', () => {
    const { unmount } = render(<ReservationForm {...baseProps} occurrences={[]} />);
    expect(screen.getByText(labels.noOccurrences)).toBeTruthy();
    unmount();
  });

  it('validates the contact fields inline before submitting', async () => {
    const { unmount } = render(<ReservationForm {...baseProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: /·/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: labels.submit }));
    expect(await screen.findAllByText(labels.invalid)).toHaveLength(3);
    unmount();
  });

  it('submits the reservation and shows inline success', async () => {
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            reservation: { id: 'res-1', status: 'RESERVED', localStartDate: '2026-10-30T19:30:00', partySize: 4 },
          }),
          { status: 200 },
        ),
      );
    const { unmount } = render(<ReservationForm {...baseProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: /·/i })[0]);
    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Aly' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'aly@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+39 340 0000000' } });

    const form = document.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText(labels.success)).toBeTruthy());
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/dining/reservations',
      expect.objectContaining({ method: 'POST' }),
    );
    unmount();
  });

  it('maps NO_AVAILABILITY to the degenerate copy and shows the retry alert', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'NO_AVAILABILITY' }), { status: 409 }),
    );
    const { unmount } = render(<ReservationForm {...baseProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: /·/i })[0]);
    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Aly' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'aly@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone/), { target: { value: '+39 340 0000000' } });
    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(labels.noOccurrences)).toBeTruthy();
    unmount();
  });
});
