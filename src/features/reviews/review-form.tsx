import { useState } from "react";

export interface ReviewFormLabels {
  title: string;
  ratingLabel: string;
  titleLabel: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  retry: string;
  validationRating: string;
}

interface ReviewFormProps {
  productId: string;
  labels: ReviewFormLabels;
}

const STAR_PATH =
  "M12 2.6l2.9 5.88 6.5.94-4.7 4.58 1.11 6.47L12 17.42l-5.81 3.05 1.11-6.47L2.6 9.42l6.5-.94z";
const TITLE_MAX = 100;
const BODY_MAX = 2000;
const RADIO_NAME = "review-rating";

const inputClass =
  "w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function ReviewForm({ productId, labels }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [ratingError, setRatingError] = useState(false);

  const active = hovered || rating;
  const disabled = submitState === "submitting" || submitState === "success";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    if (rating < 1) {
      setRatingError(true);
      return;
    }
    setRatingError(false);

    setSubmitState("submitting");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title.trim() || undefined, body }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setRating(0);
      setTitle("");
      setBody("");
      setSubmitState("success");
    } catch (error) {
      console.error("[review-form] review submit failed:", error);
      setSubmitState("error");
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5 rounded-md border border-rule bg-paper-warm p-6"
    >
      <h3 className="font-display text-xl text-ink">{labels.title}</h3>

      <fieldset
        onBlur={() => setHovered(0)}
        className="flex flex-col gap-2"
      >
        <legend className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.ratingLabel}
        </legend>
        <div role="radiogroup" aria-label={labels.ratingLabel} className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              key={value}
              onMouseEnter={() => setHovered(value)}
              onMouseLeave={() => setHovered(0)}
              className="cursor-pointer rounded-sm p-1 transition-colors duration-500 ease-fluid focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent"
            >
              <input
                type="radio"
                name={RADIO_NAME}
                value={value}
                checked={rating === value}
                onChange={() => {
                  setRating(value);
                  setRatingError(false);
                }}
                className="sr-only"
              />
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className={`size-6 transition-colors duration-500 ease-fluid ${
                  value <= active ? "text-accent" : "text-rule"
                }`}
              >
                <path d={STAR_PATH} />
              </svg>
            </label>
          ))}
        </div>
        {ratingError && (
          <p role="alert" className="text-sm text-error">
            {labels.validationRating}
          </p>
        )}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-title" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.titleLabel}
        </label>
        <input
          id="review-title"
          type="text"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-body" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.bodyLabel}
        </label>
        <textarea
          id="review-body"
          required
          rows={4}
          maxLength={BODY_MAX}
          placeholder={labels.bodyPlaceholder}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={disabled}
          className={`${inputClass} min-h-28 resize-y`}
        />
        <span className="self-end text-xs text-mute">
          {body.length}/{BODY_MAX}
        </span>
      </div>

      {submitState === "success" && (
        <p role="status" className="text-sm text-accent">
          {labels.success}
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
          {submitState === "submitting"
            ? labels.submitting
            : submitState === "error"
              ? labels.retry
              : labels.submit}
        </span>
      </button>
    </form>
  );
}
