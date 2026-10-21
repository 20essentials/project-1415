import { useState } from "react";

export interface ProfileFormLabels {
  title: string;
  firstName: string;
  lastName: string;
  nickname: string;
  "nickname-hint": string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  retry: string;
}

export interface ProfileFormInitial {
  firstName: string;
  lastName: string;
  nickname: string;
}

interface ProfileFormProps {
  initial: ProfileFormInitial;
  labels: ProfileFormLabels;
}

const NAME_MAX = 100;
const NICKNAME_MAX = 100;

const inputClass =
  "w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute transition-colors duration-500 ease-fluid focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function ProfileForm({ initial, labels }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [nickname, setNickname] = useState(initial.nickname);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const disabled = submitState === "submitting" || submitState === "success";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    setSubmitState("submitting");
    try {
      const response = await fetch("/api/member-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          nickname: nickname.trim() || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setSubmitState("success");
      setTimeout(() => {
        setSubmitState((prev) => (prev === "success" ? "idle" : prev));
      }, 3000);
    } catch (error) {
      console.error("[profile-form] update failed:", error);
      setSubmitState("error");
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5 rounded-md border border-rule bg-paper-warm/40 p-6"
    >
      <h3 className="font-display text-xl text-ink">{labels.title}</h3>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-first-name" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.firstName}
        </label>
        <input
          id="profile-first-name"
          type="text"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-last-name" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.lastName}
        </label>
        <input
          id="profile-last-name"
          type="text"
          autoComplete="family-name"
          maxLength={NAME_MAX}
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-nickname" className="text-xs font-medium tracking-widest text-mute uppercase">
          {labels.nickname}
        </label>
        <input
          id="profile-nickname"
          type="text"
          autoComplete="nickname"
          maxLength={NICKNAME_MAX}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          disabled={disabled}
          className={inputClass}
        />
        <p className="text-xs text-ink-soft">{labels["nickname-hint"]}</p>
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
