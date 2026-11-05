import { useState } from "react";

export interface CommentFormLabels {
  label: string;
  placeholder: string;
  submit: string;
  submitting: string;
  success: string;
  pending: string;
  error: string;
  signIn: string;
  signInCta: string;
}

interface CommentFormProps {
  postId: string;
  isMember: boolean;
  /** Pre-localized login URL that returns to the current page. */
  signInHref: string;
  labels: CommentFormLabels;
}

const COMMENT_MAX = 1000;

const inputClass =
  "w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function CommentForm({ postId, isMember, signInHref, labels }: CommentFormProps) {
  const [text, setText] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "pending" | "error">(
    "idle",
  );

  const disabled = submitState === "submitting" || submitState === "success";
  const remaining = COMMENT_MAX - text.length;

  if (!isMember) {
    return (
      <div data-testid="comments-sign-in" className="flex flex-col gap-3 rounded-md border border-rule bg-paper-warm/40 px-6 py-8">
        <p className="text-sm leading-6 text-ink-soft">{labels.signIn}</p>
        <a
          href={signInHref}
          className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream"
        >
          <span className="text-trim">{labels.signInCta}</span>
        </a>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    setSubmitState("submitting");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text }),
      });
      if (response.status === 401) {
        window.location.href = signInHref;
        return;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { status?: string };
      setSubmitState(payload.status === "PUBLISHED" ? "success" : "pending");
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      console.error("[comment-form] comment submit failed:", error);
      setSubmitState("error");
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5 rounded-md border border-rule bg-paper-warm/40 p-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="comment-text" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.label}
        </label>
        <textarea
          id="comment-text"
          required
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder={labels.placeholder}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled}
          className={`${inputClass} min-h-24 resize-y`}
        />
        <span className="self-end text-xs text-mute" aria-live="polite">
          {remaining}/{COMMENT_MAX}
        </span>
      </div>

      {submitState === "success" && (
        <p role="status" className="text-sm text-accent">
          {labels.success}
        </p>
      )}
      {submitState === "pending" && (
        <p role="status" className="text-sm text-accent">
          {labels.pending}
        </p>
      )}
      {submitState === "error" && (
        <p role="alert" className="text-sm text-error">
          {labels.error}
        </p>
      )}

      <button
        type="submit"
        disabled={disabled}
        aria-busy={submitState === "submitting"}
        className="btn btn-primary self-start disabled:opacity-60"
      >
        <span className="text-trim">
          {submitState === "submitting" ? labels.submitting : labels.submit}
        </span>
      </button>
    </form>
  );
}
