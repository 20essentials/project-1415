import { useState, type FormEvent } from "react";
import { submitForm } from "@/shared/wix-forms";
import { trackEvent } from "@/shared/analytics";

export interface NewsletterLabels {
  label: string;
  placeholder: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  invalid: string;
}

const DEFAULT_LABELS: NewsletterLabels = {
  label: "Email address",
  placeholder: "you@example.com",
  submit: "Subscribe",
  sending: "Subscribing…",
  success: "You're on the list. Welcome to the greenhouse.",
  error: "Something went wrong. Please try again.",
  invalid: "Enter a valid email address.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NewsletterFormProps {
  formId: string;
  labels?: Partial<NewsletterLabels>;
}

export default function NewsletterForm({ formId, labels: labelOverrides }: NewsletterFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      setStatus("error");
      setMessage(labels.invalid);
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const result = await submitForm(formId, { email: value });
      if (result.status === "CONFIRMED" || result.status === "PENDING") {
        setEmail("");
        setStatus("success");
        setMessage(labels.success);
        trackEvent("Lead", { category: "Newsletter", action: "Subscribe" });
      } else {
        setStatus("error");
        setMessage(labels.error);
      }
    } catch (error) {
      console.error("[newsletter-form] submission failed:", error);
      setStatus("error");
      setMessage(labels.error);
    }
  };

  const invalid = status === "error";
  const messageClass = status === "success" ? "text-accent" : "text-error";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor="newsletter-email" className="text-xs font-medium tracking-widest text-mute uppercase">
        {labels.label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={labels.placeholder}
          disabled={status === "submitting"}
          aria-invalid={invalid}
          aria-describedby="newsletter-status"
          className={`w-full rounded-sm border bg-paper-warm px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60 ${
            invalid ? "border-error" : "border-rule focus-visible:border-accent"
          }`}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? labels.sending : labels.submit}
        </button>
      </div>
      <p id="newsletter-status" role="status" aria-live="polite" className={`min-h-5 text-xs ${message ? messageClass : "text-mute"}`}>
        {message}
      </p>
    </form>
  );
}
