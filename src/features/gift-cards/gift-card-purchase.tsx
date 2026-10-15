import { useState } from "react";
import { currentCart } from "@wix/ecom";
import { trackEvent } from "@/shared/analytics";
import {
  WIX_GIFT_CARDS_APP_ID,
  type GiftCardProduct,
  type GiftCardPresetVariant,
} from "./gift-cards";

export interface GiftCardLabels {
  amount: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  messagePlaceholder: string;
  add: string;
  addDefault: string;
  adding: string;
  added: string;
  error: string;
  viewCart: string;
}

const DEFAULT_LABELS: GiftCardLabels = {
  amount: "Amount",
  firstName: "Recipient first name",
  lastName: "Recipient last name",
  email: "Recipient email",
  message: "Personal message",
  messagePlaceholder: "A short note to the recipient…",
  add: "Add {{amount}} gift card to cart",
  addDefault: "Add to cart",
  adding: "Adding…",
  added: "Added ✓",
  error: "Could not add the gift card to your cart. Please try again.",
  viewCart: "Added to your cart — view cart →",
};

interface GiftCardPurchaseProps {
  product: GiftCardProduct;
  labels?: Partial<GiftCardLabels>;
  cartHref?: string;
}

// catalogReference captured from a real paid Wix-Editor gift-card order. On
// ORDER_PAID the gift-card backend issues the card and emails the recipient.
export default function GiftCardPurchase({
  product,
  labels: labelOverrides,
  cartHref = "/cart",
}: GiftCardPurchaseProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };

  const [variantId, setVariantId] = useState<string>(product.presetVariants[0]?.id ?? "");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedVariant: GiftCardPresetVariant | undefined = product.presetVariants.find(
    (v) => v.id === variantId,
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
  const canSubmit =
    !!selectedVariant && recipientFirstName.trim().length > 0 && emailValid && status !== "adding";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedVariant) return;
    setStatus("adding");
    setError(null);
    try {
      const { cart } = await currentCart.addToCurrentCart({
        lineItems: [
          {
            catalogReference: {
              appId: WIX_GIFT_CARDS_APP_ID,
              catalogItemId: product.id,
              options: {
                variantId: selectedVariant.id,
                quantity: 1,
                giftingInfo: {
                  recipientInfo: {
                    email: recipientEmail.trim(),
                    firstName: recipientFirstName.trim(),
                    lastName: recipientLastName.trim(),
                  },
                  greetingMessage: greetingMessage.trim(),
                },
                wixGiftCardsAppNewCatalog: true,
              } as Record<string, unknown>,
            },
            quantity: 1,
          },
        ],
      });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart } }));
      trackEvent("AddToCart", {
        id: product.id,
        name: product.name,
        price: Number(selectedVariant.price.amount),
        quantity: 1,
        variant: selectedVariant.price.formattedAmount,
        origin: "Gift Card Page",
      });
      setStatus("added");
    } catch (err: unknown) {
      console.error("[gift-card-purchase] addToCurrentCart failed:", err);
      setError(err instanceof Error ? err.message : labels.error);
      setStatus("error");
    }
  };

  const fieldLabel = "text-xs font-medium tracking-widest text-mute uppercase";
  const fieldInput =
    "mt-2 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-mute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className={fieldLabel}>{labels.amount}</legend>
        <div className="flex flex-wrap gap-2">
          {product.presetVariants.map((v) => {
            const selected = v.id === variantId;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setVariantId(v.id)}
                className={[
                  "rounded-sm border px-4 py-2 text-sm font-medium transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  selected
                    ? "border-accent bg-accent text-paper"
                    : "border-rule text-ink-soft hover:border-accent hover:text-ink",
                ].join(" ")}
              >
                {v.price.formattedAmount}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col">
          <span className={fieldLabel}>{labels.firstName} *</span>
          <input
            type="text"
            value={recipientFirstName}
            onChange={(e) => setRecipientFirstName(e.target.value)}
            required
            autoComplete="off"
            className={fieldInput}
          />
        </label>

        <label className="flex flex-col">
          <span className={fieldLabel}>{labels.lastName}</span>
          <input
            type="text"
            value={recipientLastName}
            onChange={(e) => setRecipientLastName(e.target.value)}
            autoComplete="off"
            className={fieldInput}
          />
        </label>

        <label className="flex flex-col sm:col-span-2">
          <span className={fieldLabel}>{labels.email} *</span>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
            autoComplete="off"
            className={fieldInput}
          />
        </label>

        <label className="flex flex-col sm:col-span-2">
          <span className={fieldLabel}>{labels.message}</span>
          <textarea
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={3}
            placeholder={labels.messagePlaceholder}
            className={fieldInput}
          />
          <span className="mt-1 text-right text-xs text-mute">{greetingMessage.length} / 500</span>
        </label>
      </div>

      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={!canSubmit || status === "added"}
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "adding"
            ? labels.adding
            : status === "added"
              ? labels.added
              : selectedVariant
                ? labels.add.replace("{{amount}}", selectedVariant.price.formattedAmount)
                : labels.addDefault}
        </button>

        {status === "added" && (
          <a href={cartHref} className="text-sm text-accent underline-offset-4 hover:underline">
            {labels.viewCart}
          </a>
        )}
      </div>
    </form>
  );
}
