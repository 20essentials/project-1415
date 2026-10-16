import { useState } from "react";
import { submissions } from "@wix/forms";
import { trackEvent } from "@/shared/analytics";

export interface ContactFormField {
  label: string;
  target: string;
  required: boolean;
  componentType: string;
  identifier?: string;
  options?: { value: string; label: string }[];
}

export interface ContactFormLabels {
  successTitle: string;
  successBody: string;
  sending: string;
  send: string;
  error: string;
  invalid: string;
}

const DEFAULT_LABELS: ContactFormLabels = {
  successTitle: "Thank you — message received.",
  successBody: "We read every note from the greenhouse and reply within one business day.",
  sending: "Sending…",
  send: "Send message",
  error: "Something went wrong. Please try again.",
  invalid: "Invalid value",
};

interface ContactFormProps {
  formId: string;
  fields: ContactFormField[];
  labels?: Partial<ContactFormLabels>;
}

interface FieldError {
  errorPath?: string;
  errorMessage?: string;
}

function readFieldErrors(error: unknown, invalidLabel: string): Record<string, string> {
  const violations = (
    error as { details?: { validationError?: { fieldViolations?: unknown } } }
  )?.details?.validationError?.fieldViolations;

  if (!Array.isArray(violations)) return {};

  const map: Record<string, string> = {};
  for (const violation of violations) {
    const errors = (violation as { data?: { errors?: unknown } })?.data?.errors;
    if (!Array.isArray(errors)) continue;
    for (const fieldError of errors as FieldError[]) {
      const path = fieldError.errorPath?.split(".").pop();
      if (path && !map[path]) map[path] = fieldError.errorMessage ?? invalidLabel;
    }
  }
  return map;
}

const inputClass =
  "w-full rounded-sm border border-rule bg-paper-warm px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function ContactForm({ formId, fields, labels: labelOverrides }: ContactFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setValue = (target: string, value: string) =>
    setValues((prev) => ({ ...prev, [target]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setFieldErrors({});

    try {
      const result = await submissions.createSubmission({ formId, submissions: values });
      if (result.status === "CONFIRMED" || result.status === "PENDING") {
        setValues({});
        setStatus("success");
        trackEvent("Lead", { category: "Contact", action: "Submit" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("[contact-form] submission failed:", error);
      const errors = readFieldErrors(error, labels.invalid);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-md border border-accent/40 bg-accent/10 p-6 text-sm leading-6 text-ink"
      >
        <p className="font-display text-xl text-ink">{labels.successTitle}</p>
        <p className="mt-2 text-ink-soft">
          {labels.successBody}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {fields.map((field) => {
        const hasError = Boolean(fieldErrors[field.target]);
        const errorId = `${field.target}-error`;
        const describedBy = hasError ? errorId : undefined;
        const borderClass = hasError ? "border-error" : "";

        return (
          <div key={field.target} className="flex flex-col gap-2">
            <label htmlFor={field.target} className="text-sm font-medium text-ink-soft">
              {field.label}
              {field.required && (
                <span aria-hidden="true" className="text-accent">
                  {" "}
                  *
                </span>
              )}
            </label>

            {field.target === "message" || field.identifier === "TEXT_AREA" ? (
              <textarea
                id={field.target}
                name={field.target}
                rows={5}
                required={field.required}
                aria-invalid={hasError}
                aria-describedby={describedBy}
                value={values[field.target] ?? ""}
                onChange={(event) => setValue(field.target, event.target.value)}
                className={`${inputClass} resize-y ${borderClass}`}
              />
            ) : (
              <input
                id={field.target}
                name={field.target}
                type={field.target === "email" ? "email" : field.componentType === "PHONE_INPUT" ? "tel" : "text"}
                required={field.required}
                aria-invalid={hasError}
                aria-describedby={describedBy}
                value={values[field.target] ?? ""}
                onChange={(event) => setValue(field.target, event.target.value)}
                className={`${inputClass} ${borderClass}`}
              />
            )}

            {hasError && (
              <p id={errorId} className="text-xs text-error">
                {fieldErrors[field.target]}
              </p>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? labels.sending : labels.send}
      </button>

      {status === "error" && (
        <p role="alert" className="text-sm text-error">
          {labels.error}
        </p>
      )}
    </form>
  );
}
