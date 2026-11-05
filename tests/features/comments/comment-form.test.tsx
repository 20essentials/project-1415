// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CommentForm, type CommentFormLabels } from '@/features/comments/comment-form';

const labels: CommentFormLabels = {
  label: 'Your comment',
  placeholder: 'Share what worked…',
  submit: 'Post comment',
  submitting: 'Posting…',
  success: 'Comment posted.',
  pending: 'Waiting for a keeper.',
  error: 'Could not post. Try again.',
  signIn: 'Log in to join the discussion.',
  signInCta: 'Log in',
};

const formFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', (...args: unknown[]) => formFetch(...args));
});

afterEach(() => {
  formFetch.mockReset();
  vi.unstubAllGlobals();
});

describe('CommentForm', () => {
  it('renders the sign-in invitation for guests instead of the form', () => {
    render(
      <CommentForm postId="post-1" isMember={false} signInHref="/api/auth/login?returnToUrl=/blog/x" labels={labels} />,
    );

    const boundary = screen.getByTestId('comments-sign-in');
    expect(boundary).toHaveTextContent('Log in to join the discussion.');
    const link = screen.getByRole('link', { name: 'Log in' });
    expect(link).toHaveAttribute('href', '/api/auth/login?returnToUrl=/blog/x');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('submits the plain text and shows the moderation-pending message', async () => {
    formFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ comment: { status: 'PENDING' } }),
    });

    render(<CommentForm postId="post-1" isMember signInHref="/x" labels={labels} />);

    fireEvent.change(screen.getByLabelText('Your comment'), { target: { value: 'Nice guide' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }));

    await waitFor(() => expect(formFetch).toHaveBeenCalled());
    const [url, init] = formFetch.mock.calls[0];
    expect(url).toBe('/api/comments');
    expect(String(init.body)).toContain('Nice guide');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(labels.pending));
  });
});
