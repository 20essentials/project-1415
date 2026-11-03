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

const formTargetsCache = new Map<string, string[]>();

interface FormFieldShape {
  fieldType?: unknown;
  inputOptions?: { target?: unknown };
}

function readFormFields(result: unknown): FormFieldShape[] {
  const direct = result as { formFields?: FormFieldShape[] };
  const wrapped = result as { form?: { formFields?: FormFieldShape[] } | FormFieldShape[] };
  if (Array.isArray(wrapped.form)) return wrapped.form;
  return wrapped.form?.formFields ?? direct.formFields ?? [];
}

// listForms only returns field ids; getForm is the call that carries
// inputOptions.target, which is the key submissions expects.
export async function getFormFieldTargets(formId: string): Promise<string[] | null> {
  if (formTargetsCache.has(formId)) return formTargetsCache.get(formId) ?? null;

  try {
    const elevatedGetForm = auth.elevate(forms.getForm);
    const result = await elevatedGetForm(formId);
    const targets = [
      ...new Set(
        readFormFields(result)
          .filter((field) => field.fieldType === 'INPUT')
          .map((field) => field.inputOptions?.target)
          .filter((target): target is string => typeof target === 'string' && Boolean(target)),
      ),
    ];
    formTargetsCache.set(formId, targets);
    return targets;
  } catch (error) {
    console.error(`[wix-forms] field targets lookup failed for form "${formId}":`, error);
    return null;
  }
}
