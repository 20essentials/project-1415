import { useState } from "react";
import { trackEvent } from "@/shared/analytics";
import {
  type DonationPreset,
  parseDonationAmount,
} from "./donations";

export interface DonateFormLabels {
  amountLegend: string;
  custom: string;
  customPlaceholder: string;
  minimumNote: string;
  submit: string;
  submitDefault: string;
  submitting: string;
  invalid: string;
  error: string;
}

const DEFAULT_LABELS: DonateFormLabels = {
  amountLegend: "Choose an amount",
  custom: "Choose your own",
  customPlaceholder: "25.00",
  minimumNote: "Minimum {{amount}}.",
  submit: "Donate {{amount}}",
  submitDefault: "Donate",
  submitting: "Redirecting to secure checkout…",
  invalid: "Please enter a valid amount.",
  error: "Could not start the donation. Please try again.",
};

export interface DonateFormProps {
  presets: DonationPreset[];
  customAmountEnabled: boolean;
  minimumAmount: string | null;
  minimumFormattedAmount: string | null;
  language: string;
  labels?: Partial<DonateFormLabels>;
}

export function DonateForm({
  presets,
  customAmountEnabled,
  minimumAmount,
  minimumFormattedAmount,
  language,
  labels: labelOverrides,
}: DonateFormProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [presetId, setPresetId] = useState<string>(presets[0]?.id ?? "");
  const [usingCustom, setUsingCustom] = useState<boolean>(presets.length === 0);
  const [customValue, setCustomValue] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [invalid, setInvalid] = useState(false);
  const [failed, setFailed] = useState(false);

  const selectedPreset = presets.find((p) => p.id === presetId);

  const resolveAmount = (): { ok: true; amount: number; label: string } | { ok: false } => {
    if (usingCustom) {
      const amount = parseDonationAmount(customValue, minimumAmount);
      if (amount === null) return { ok: false };
      return { ok: true, amount, label: `€${customValue.trim().replace(",", ".")}` };
    }
    if (!selectedPreset) return { ok: false };
    return { ok: true, amount: Number(selectedPreset.amount), label: selectedPreset.formattedAmount };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "submitting") return;

    const amount = resolveAmount();
    if (!amount.ok) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    setFailed(false);
    setStatus("submitting");
    try {
      const response = await fetch("/api/donations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount.amount, language }),
      });
      if (!response.ok) {
        setStatus("error");
        setFailed(true);
        return;
      }
      const { checkoutUrl } = (await response.json()) as { checkoutUrl?: string };
      if (!checkoutUrl) {
        setStatus("error");
        setFailed(true);
        return;
      }
      trackEvent("Lead", {
        origin: "Donate Page",
        value: Math.round(amount.amount * 100) / 100,
      });
      window.location.assign(checkoutUrl);
    } catch {
      setStatus("error");
      setFailed(true);
    }
  };

  const fieldLabel = "text-xs font-medium tracking-widest text-mute uppercase";
  const fieldInput =
    "mt-2 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const presetButton = (selected: boolean) =>
    [
      "rounded-sm border px-4 py-2 text-sm font-medium transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      selected
        ? "border-accent bg-accent text-paper"
        : "border-rule text-ink-soft hover:border-accent hover:text-ink",
    ].join(" ");

  const minimumNote =
    minimumFormattedAmount && customAmountEnabled
      ? labels.minimumNote.replace("{{amount}}", minimumFormattedAmount)
      : null;

  const submitLabel = () => {
    if (status === "submitting") return labels.submitting;
    const amount = resolveAmount();
    if (amount.ok) return labels.submit.replace("{{amount}}", amount.label);
    return labels.submitDefault;
  };

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="donate-form" className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className={fieldLabel}>{labels.amountLegend}</legend>
        {presets.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const selected = !usingCustom && preset.id === presetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setUsingCustom(false);
                      setPresetId(preset.id);
                    }}
                    className={presetButton(selected)}
                  >
                    {preset.formattedAmount}
                  </button>
                );
              })}
            </div>
            {!usingCustom && selectedPreset?.description && (
              <p className="max-w-prose text-sm text-ink-soft" data-testid="preset-description">
                {selectedPreset.description}
              </p>
            )}
          </>
        )}
        {customAmountEnabled && (
          <div>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="radio"
                name="donation-mode"
                checked={usingCustom}
                onChange={() => setUsingCustom(true)}
                className="accent-accent"
              />
              {labels.custom}
            </label>
            {usingCustom && (
              <input
                data-testid="custom-amount"
                type="text"
                inputMode="decimal"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={labels.customPlaceholder}
                autoComplete="off"
                className={fieldInput + " max-w-48"}
              />
            )}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        {invalid && (
          <p className="text-sm text-accent" role="alert">
            {labels.invalid}
          </p>
        )}
        {failed && !invalid && status === "error" && (
          <p className="text-sm text-accent" role="alert">
            {labels.error}
          </p>
        )}
        {minimumNote && usingCustom && <p className="text-xs text-mute">{minimumNote}</p>}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          data-testid="donate-submit"
        >
          {submitLabel()}
        </button>
      </div>
    </form>
  );
}
