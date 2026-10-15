// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import NewsletterForm from '@/features/newsletter/newsletter-form';

const submitForm = vi.fn();

vi.mock('@/shared/wix-forms', () => ({
  submitForm: (...args: unknown[]) => submitForm(...args),
}));

afterEach(() => {
  submitForm.mockReset();
});

const renderForm = () => {
  render(<NewsletterForm formId="newsletter-1" />);
  const input = screen.getByLabelText('Email address');
  const form = input.closest('form') as HTMLFormElement;
  return { input, form };
};

describe('NewsletterForm', () => {
  it('blocks submission and shows an accessible error for an invalid email', async () => {
    const { input, form } = renderForm();

    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Enter a valid email address.'));
    expect(submitForm).not.toHaveBeenCalled();
  });

  it('treats an empty email as invalid', async () => {
    const { form } = renderForm();

    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Enter a valid email address.'));
    expect(submitForm).not.toHaveBeenCalled();
  });

  it('submits a valid email and shows the confirmation message', async () => {
    submitForm.mockResolvedValue({ status: 'CONFIRMED' });
    const { input, form } = renderForm();

    fireEvent.change(input, { target: { value: 'grower@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent("You're on the list. Welcome to the greenhouse."));
    expect(submitForm).toHaveBeenCalledWith('newsletter-1', { email: 'grower@example.com' });
    expect(input).toHaveValue('');
  });

  it('shows an accessible error when the backend rejects the submission', async () => {
    submitForm.mockResolvedValue({ status: 'REJECTED' });
    const { input, form } = renderForm();

    fireEvent.change(input, { target: { value: 'grower@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Something went wrong. Please try again.'));
  });

  it('shows an accessible error when the request throws', async () => {
    submitForm.mockRejectedValue(new Error('network'));
    const { input, form } = renderForm();

    fireEvent.change(input, { target: { value: 'grower@example.com' } });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Something went wrong. Please try again.'));
  });
});
