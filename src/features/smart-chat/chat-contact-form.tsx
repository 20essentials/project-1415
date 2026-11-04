import { useState } from 'react';
import { trackEvent } from '@/shared/analytics';
import { useTranslation } from '@/shared/i18n';
import type { PublicChatContact } from './chat';
import { submitSmartChatContact } from './chat-client';

interface ChatContactFormProps {
  contact: PublicChatContact;
  onClose?: () => void;
  onSubmitted?: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChatContactForm({ contact, onClose, onSubmitted }: ChatContactFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const head = onClose ? (
    <div className="pp-chat-form__head">
      <h3 className="pp-chat-form__title">{t('smart-chat.contact-title')}</h3>
      <button
        type="button"
        className="pp-chat-icon-button pp-chat-icon-button--close"
        onClick={onClose}
        aria-label={t('smart-chat.close-form')}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  ) : null;

  const update = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (contact.fields.requiredName && !values.name.trim()) nextErrors.name = t('smart-chat.contact-required');
    if (contact.fields.requiredEmail && !values.email.trim()) nextErrors.email = t('smart-chat.contact-required');
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
      nextErrors.email = t('smart-chat.contact-invalid-email');
    }
    if (contact.fields.requiredPhone && !values.phone.trim()) nextErrors.phone = t('smart-chat.contact-required');
    if (contact.fields.requiredMessage && !values.message.trim()) {
      nextErrors.message = t('smart-chat.contact-required');
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStatus('submitting');
    try {
      await submitSmartChatContact({
        name: values.name.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        message: values.message.trim(),
      });
      setStatus('success');
      trackEvent('Lead', { category: 'SmartChat', action: 'ContactSubmit' });
      onSubmitted?.();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="pp-chat-form-success" role="status">
        {head}
        <p className="pp-chat-form-success__title">{t('smart-chat.contact-success')}</p>
        {contact.successMessage && <p className="pp-chat-form-success__body">{contact.successMessage}</p>}
      </div>
    );
  }

  return (
    <form className="pp-chat-form" onSubmit={submit} noValidate>
      {head ?? <h3 className="pp-chat-form__title">{t('smart-chat.contact-title')}</h3>}
      {contact.introMessage && <p className="pp-chat-form__intro">{contact.introMessage}</p>}

      {contact.fields.name && (
        <label className="pp-chat-field">
          <span>{t('smart-chat.contact-name')}</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="pp-chat-field__error">{errors.name}</span>}
        </label>
      )}

      {contact.fields.email && (
        <label className="pp-chat-field">
          <span>{t('smart-chat.contact-email')}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required={contact.fields.requiredEmail}
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="pp-chat-field__error">{errors.email}</span>}
        </label>
      )}

      {contact.fields.phone && (
        <label className="pp-chat-field">
          <span>{t('smart-chat.contact-phone')}</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => update('phone', event.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <span className="pp-chat-field__error">{errors.phone}</span>}
        </label>
      )}

      {contact.fields.message && (
        <label className="pp-chat-field">
          <span>{t('smart-chat.contact-message')}</span>
          <textarea
            name="message"
            rows={3}
            required={contact.fields.requiredMessage}
            value={values.message}
            onChange={(event) => update('message', event.target.value)}
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <span className="pp-chat-field__error">{errors.message}</span>}
        </label>
      )}

      <button type="submit" className="pp-chat-form__submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? t('smart-chat.contact-sending') : t('smart-chat.contact-submit')}
      </button>

      {status === 'error' && (
        <p className="pp-chat-form__error" role="alert">
          {t('smart-chat.contact-error')}
        </p>
      )}
    </form>
  );
}
