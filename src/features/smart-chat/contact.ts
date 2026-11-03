import {
  CONTACT_FORM_NAME,
  getFormFieldTargets,
  getFormIdByName,
  submitForm,
  type FormSubmitResult,
} from '@/shared/wix-forms';
import { auth } from '@wix/essentials';
import { formSpamSubmissionReports } from '@wix/forms';
import { sanitizeChatMessageInput } from './sanitize';

export interface SmartChatContactInput {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// submission keys are the form schema's inputOptions.target; the built-in
// Wix contact form splits name into first_name and has no phone field.
const VALUE_ALIASES: Array<{ from: keyof SmartChatContactInput; targets: string[] }> = [
  { from: 'message', targets: ['message'] },
  { from: 'email', targets: ['email'] },
  { from: 'name', targets: ['first_name'] },
  { from: 'phone', targets: ['phone'] },
];

export function mapSmartChatContactToTargets(
  input: SmartChatContactInput,
  targets: string[] | null,
): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const alias of VALUE_ALIASES) {
    const value = input[alias.from];
    if (typeof value === 'string' && value.trim()) raw[alias.from] = value.trim();
  }

  if (!targets) {
    // Fallback for a schema we could not read: only safe generic keys.
    return { email: raw.email, message: raw.message };
  }

  const values: Record<string, string> = {};
  for (const alias of VALUE_ALIASES) {
    for (const target of alias.targets) {
      if (targets.includes(target) && raw[alias.from]) values[target] = raw[alias.from];
    }
  }

  return values;
}

export function validateSmartChatContact(input: SmartChatContactInput): string[] {
  const errors: string[] = [];
  const message = input.message?.trim() ?? '';
  const email = input.email?.trim() ?? '';

  if (!message) errors.push('message');
  if (message.length > 4096) errors.push('message');
  if (!email) errors.push('email');
  if (email && !EMAIL_PATTERN.test(email)) errors.push('email');
  if ((input.name?.trim().length ?? 0) > 200) errors.push('name');
  if ((input.phone?.trim().length ?? 0) > 40) errors.push('phone');

  return errors;
}

export async function submitSmartChatContact(
  input: SmartChatContactInput,
): Promise<FormSubmitResult> {
  const formId = await getFormIdByName(CONTACT_FORM_NAME);
  if (!formId) throw new Error('SMART_CHAT_CONTACT_FORM_NOT_FOUND');

  const targets = await getFormFieldTargets(formId);
  const values = mapSmartChatContactToTargets(input, targets);
  values.message = sanitizeChatMessageInput(values.message ?? '');

  const elevatedCheckForSpam = auth.elevate(formSpamSubmissionReports.checkForSpam);
  try {
    const verdict = await elevatedCheckForSpam({ formId, submissions: values });
    if (verdict?.spam) throw new Error('SMART_CHAT_CONTACT_REPORTED_SPAM');
  } catch (error) {
    if (error instanceof Error && error.message === 'SMART_CHAT_CONTACT_REPORTED_SPAM') throw error;
    // An unavailable spam verdict must not block a legitimate visitor.
    console.error('[smart-chat] contact spam check failed:', error);
  }

  return submitForm(formId, values);
}
