// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  WaitlistJoin,
  type WaitlistJoinLabels,
} from '@/features/workshops/waitlist-join';

const labels: WaitlistJoinLabels = {
  badge: 'Waiting list',
  title: 'This session is full',
  note: 'Join the list and we will email you.',
  name: 'First name',
  email: 'Email',
  submit: 'Join waiting list',
  submitting: 'Joining…',
  success: 'You are on the list.',
  duplicate: 'Already listed.',
  error: 'Try again later.',
  invalid: 'Invalid value',
};

const formFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', (...args: unknown[]) => formFetch(...args));
});

afterEach(() => {
  formFetch.mockReset();
  vi.unstubAllGlobals();
});

function submit() {
  fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Bee' } });
  fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'bee@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Join waiting list' }));
}

describe('WaitlistJoin', () => {
  it('posts the raw session start and shows the success message on 201', async () => {
    formFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ entry: { id: 'w-1' } }),
    });

    render(
      <WaitlistJoin workshopId="svc-1" sessionStart="2026-11-20T10:00:00" labels={labels} />,
    );
    submit();

    await waitFor(() => expect(formFetch).toHaveBeenCalledTimes(1));
    const [url, init] = formFetch.mock.calls[0];
    expect(url).toBe('/api/waitlist');
    expect(String(init.body)).toContain('2026-11-20T10:00:00');
    await waitFor(() =>
      expect(screen.getByTestId('waitlist-status')).toHaveTextContent(labels.success),
    );
    expect(screen.getByTestId('waitlist-status')).toHaveAttribute('data-waitlist-state', 'success');
  });

  it('shows the duplicate message without an alert role', async () => {
    formFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ error: 'ALREADY_LISTED' }),
    });

    render(
      <WaitlistJoin workshopId="svc-1" sessionStart="2026-11-20T10:00:00" labels={labels} />,
    );
    submit();

    await waitFor(() =>
      expect(screen.getByTestId('waitlist-status')).toHaveTextContent(labels.duplicate),
    );
    expect(screen.getByTestId('waitlist-status')).toHaveAttribute('role', 'status');
  });

  it('renders an alert with a retry for other errors', async () => {
    formFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'INTERNAL' }),
    });

    render(
      <WaitlistJoin workshopId="svc-1" sessionStart="2026-11-20T10:00:00" labels={labels} />,
    );
    submit();

    await waitFor(() =>
      expect(screen.getByTestId('waitlist-status')).toHaveTextContent(labels.error),
    );
    expect(screen.getByTestId('waitlist-status')).toHaveAttribute('role', 'alert');
  });

  it('does not hit the API with an invalid email', async () => {
    render(
      <WaitlistJoin workshopId="svc-1" sessionStart="2026-11-20T10:00:00" labels={labels} />,
    );

    fireEvent.change(screen.getByLabelText(/First name/), { target: { value: 'Bee' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join waiting list' }));

    expect(formFetch).not.toHaveBeenCalled();
    expect(screen.getAllByText('Invalid value')).toHaveLength(1);
  });
});
