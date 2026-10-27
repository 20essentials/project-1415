// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DonateForm } from '@/features/donations/donate-form';
const trackEventMock = vi.fn();

vi.mock('@/shared/analytics', () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const presets = [
  {
    id: 'preset-10',
    amount: '10',
    formattedAmount: '10,00€',
    description: 'Warms the propagation beds',
  },
  {
    id: 'preset-25',
    amount: '25',
    formattedAmount: '25,00€',
    description: 'Plants a shelf of flytraps',
  },
];

const assigned = vi.fn();

function renderForm(props = {}) {
  render(
    <DonateForm
      presets={presets}
      customAmountEnabled
      minimumAmount="5.00"
      minimumFormattedAmount="5,00€"
      language="en"
      {...props}
    />,
  );
  const form = screen.getByTestId('donate-form');
  return { form };
}

const setSelectedPreset = (preset: '10' | '25') => {
  fireEvent.click(screen.getByRole('button', { name: preset === '10' ? '10,00€' : '25,00€' }));
};

afterEach(() => {
  assigned.mockReset();
  trackEventMock.mockClear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DonateForm', () => {
  it('shows preset buttons and the description of the selected preset', () => {
    renderForm();

    expect(screen.getByRole('button', { name: '10,00€' })).toBeVisible();
    expect(screen.getByRole('button', { name: '25,00€' })).toBeVisible();
    expect(screen.getByTestId('preset-description')).toHaveTextContent('Warms the propagation beds');
  });

  it('switches the visible description when another preset is picked', () => {
    renderForm();
    setSelectedPreset('25');

    expect(screen.getByTestId('preset-description')).toHaveTextContent('Plants a shelf of flytraps');
  });

  it('does not post when no preset is available and custom mode is off', async () => {
    const fetchMock = vi.spyOn(window, 'fetch');
    renderForm({ presets: [], customAmountEnabled: false });

    fireEvent.submit(screen.getByTestId('donate-form'));

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an accessible error for an invalid custom amount without posting', async () => {
    const fetchMock = vi.spyOn(window, 'fetch');
    renderForm();

    fireEvent.click(screen.getByLabelText('Choose your own'));
    fireEvent.change(screen.getByTestId('custom-amount'), { target: { value: '0' } });
    fireEvent.submit(screen.getByTestId('donate-form'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid amount.'),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('round-trips a one-time donation through the checkout API and redirects', async () => {
    const fetchMock = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ checkoutUrl: 'https://checkout.test/session' }), { status: 200 }),
      );
    vi.stubGlobal('location', { origin: 'https://site.test', pathname: '/donate', assign: assigned, href: '' });
    renderForm();
    setSelectedPreset('25');

    fireEvent.submit(screen.getByTestId('donate-form'));

    await waitFor(() => expect(assigned).toHaveBeenCalledWith('https://checkout.test/session'));
    expect(fetchMock).toHaveBeenCalledWith('/api/donations/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 25, language: 'en' }),
    });
    expect(trackEventMock).toHaveBeenCalledWith(
      'Lead',
      expect.objectContaining({ value: 25, origin: 'Donate Page' }),
    );
  });

  it('shows an accessible error when the checkout API fails', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'CAMPAIGN_UNAVAILABLE' }), { status: 400 }),
    );
    vi.stubGlobal('location', { origin: 'https://site.test', pathname: '/donate', assign: assigned, href: '' });
    renderForm();

    fireEvent.submit(screen.getByTestId('donate-form'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not start the donation. Please try again.',
      ),
    );
    expect(assigned).not.toHaveBeenCalled();
  });

  it('shows the minimum note when the custom mode is active', () => {
    renderForm();

    fireEvent.click(screen.getByLabelText('Choose your own'));

    expect(screen.getByText('Minimum 5,00€.')).toBeVisible();
  });
});
