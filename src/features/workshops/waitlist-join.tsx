import { useState } from 'react';

export interface WaitlistJoinLabels {
  badge: string;
  title: string;
  note: string;
  name: string;
  email: string;
  submit: string;
  submitting: string;
  success: string;
  duplicate: string;
  error: string;
  invalid: string;
}

interface WaitlistJoinProps {
  workshopId: string;
  sessionStart: string;
  labels: WaitlistJoinLabels;
}

interface WaitlistResponse {
  entry?: { id: string };
  error?: string;
}

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistJoin({ workshopId, sessionStart, labels }: WaitlistJoinProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'duplicate' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const setValue = (target: string, value: string) =>
    setValues((prev) => ({ ...prev, [target]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'submitting') return;

    const firstName = (values.first_name ?? '').trim();
    const email = (values.email ?? '').trim();
    const errors: Record<string, string> = {};
    if (!firstName) errors.first_name = labels.invalid;
    if (!EMAIL_PATTERN.test(email)) errors.email = labels.invalid;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setState('submitting');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId, sessionStart, firstName, email }),
      });
      const data = (await response.json()) as WaitlistResponse;

      if (data.error === 'ALREADY_LISTED') {
        setState('duplicate');
        setMessage(labels.duplicate);
        return;
      }
      if (response.status === 201 && data.entry?.id) {
        setState('success');
        setMessage(labels.success);
        return;
      }
      setState('error');
      setMessage(labels.error);
    } catch (error) {
      console.error('[waitlist-join] submit failed:', error);
      setState('error');
      setMessage(labels.error);
    }
  };

  const isFinished = state === 'success';
  const isLocked = state === 'submitting' || isFinished;

  return (
    <div data-testid="waitlist-join" className="rounded-sm border border-rule bg-paper-warm/40 p-4">
      <p className="text-xs font-medium tracking-widest text-accent uppercase">{labels.badge}</p>
      <h4 className="mt-2 font-display text-lg text-ink">{labels.title}</h4>
      <p className="mt-1 text-sm leading-5 text-ink-soft">{labels.note}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="waitlist-first-name" className="text-sm font-medium text-ink-soft">
            {labels.name}
            <span aria-hidden="true" className="text-accent">
              {' '}
              *
            </span>
          </label>
          <input
            id="waitlist-first-name"
            value={values.first_name ?? ''}
            onChange={(event) => setValue('first_name', event.target.value)}
            disabled={isLocked}
            className={`${inputClass} ${fieldErrors.first_name ? 'border-error' : ''}`}
          />
          {fieldErrors.first_name && (
            <p id="waitlist-first-name-error" className="text-xs text-error">
              {fieldErrors.first_name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="waitlist-email" className="text-sm font-medium text-ink-soft">
            {labels.email}
            <span aria-hidden="true" className="text-accent">
              {' '}
              *
            </span>
          </label>
          <input
            id="waitlist-email"
            type="email"
            value={values.email ?? ''}
            onChange={(event) => setValue('email', event.target.value)}
            disabled={isLocked}
            className={`${inputClass} ${fieldErrors.email ? 'border-error' : ''}`}
          />
          {fieldErrors.email && (
            <p id="waitlist-email-error" className="text-xs text-error">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLocked}
          aria-busy={state === 'submitting'}
          className="inline-flex h-10 w-full items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {state === 'submitting' ? labels.submitting : labels.submit}
        </button>

        {message !== null && (
          <p
            role={state === 'error' ? 'alert' : 'status'}
            data-testid="waitlist-status"
            data-waitlist-state={state}
            className={state === 'error' ? 'text-sm text-error' : 'text-sm text-ink-soft'}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
