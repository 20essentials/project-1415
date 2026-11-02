import {
  CONTACT_FORM_NAME,
  getFormIdByName,
  submitForm,
  type FormSubmitResult,
} from '@/shared/wix-forms';

export interface SmartChatContactInput {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const values: Record<string, string> = {
    message: input.message.trim(),
  };

  const name = input.name?.trim();
  const email = input.email?.trim();
  const phone = input.phone?.trim();

  if (name) values.name = name;
  if (email) values.email = email;
  if (phone) values.phone = phone;

  return submitForm(formId, values);
}
