import { forms, submissions } from '@wix/forms';
import { auth } from '@wix/essentials';

const FORM_NAMESPACE = 'wix.form_app.form';

export const CONTACT_FORM_NAME = 'Contact Form';
export const NEWSLETTER_FORM_NAME = 'Newsletter';

export interface FormSubmitResult {
  status?: string;
}

const formIdCache = new Map<string, string | null>();

export async function getFormIdByName(name: string): Promise<string | null> {
  if (formIdCache.has(name)) return formIdCache.get(name) ?? null;

  try {
    const elevatedListForms = auth.elevate(forms.listForms);
    const result = await elevatedListForms(FORM_NAMESPACE);
    const form = result.forms?.find((candidate) => candidate.name === name);
    const formId = form?._id ?? null;
    formIdCache.set(name, formId);
    return formId;
  } catch (error) {
    console.error(`[wix-forms] form discovery failed for "${name}":`, error);
    return null;
  }
}

export function submitForm(formId: string, values: Record<string, string>): Promise<FormSubmitResult> {
  return submissions.createSubmission({ formId, submissions: values });
}
