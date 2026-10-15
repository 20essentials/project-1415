import { useEffect, useMemo, useState } from "react";
import { currentCart } from "@wix/ecom";
import { trackEvent } from "@/shared/analytics";

const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";
const MAX_QUANTITY = 10;

export interface PurchaseChoice {
  id: string;
  name: string;
}

export interface PurchaseOption {
  id: string;
  name: string;
  choices: PurchaseChoice[];
}

export interface PurchaseVariant {
  id: string;
  choices: { optionId: string; choiceId: string }[];
  priceAmount?: number;
  formattedPrice?: string;
}

export interface PurchaseProduct {
  id: string;
  name: string;
  currency?: string;
  options: PurchaseOption[];
  variants: PurchaseVariant[];
  minFormattedPrice?: string;
  maxFormattedPrice?: string;
}

export interface VariantStock {
  quantity: number;
  trackQuantity: boolean;
  preorderEnabled: boolean;
}

export interface PurchaseLabels {
  stockLeft: string;
  inStock: string;
  decreaseQty: string;
  increaseQty: string;
  added: string;
  adding: string;
  tryAgain: string;
  addToCart: string;
  viewCart: string;
  outOfStock: string;
  selectOptions: string;
}

const DEFAULT_LABELS: PurchaseLabels = {
  stockLeft: "{{count}} left in stock",
  inStock: "In stock",
  decreaseQty: "Decrease quantity",
  increaseQty: "Increase quantity",
  added: "Added ✓",
  adding: "Adding…",
  tryAgain: "Try again",
  addToCart: "Add to cart",
  viewCart: "Added to your cart — view cart →",
  outOfStock: "Out of stock",
  selectOptions: "Select options",
};

interface ProductPurchaseProps {
  product: PurchaseProduct;
  inventoryByVariant?: Record<string, VariantStock>;
  labels?: Partial<PurchaseLabels>;
  cartHref?: string;
}

export default function ProductPurchase({
  product,
  inventoryByVariant = {},
  labels: labelOverrides,
  cartHref = "/cart",
}: ProductPurchaseProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const meaningfulOptions = product.options.filter((option) => option.choices.length > 1);
  const hasOptions = meaningfulOptions.length > 0;

  const [selections, setSelections] = useState<Record<string, string>>({});
  const selectChoice = (optionId: string, choiceId: string) =>
    setSelections((prev) => ({ ...prev, [optionId]: choiceId }));

  const allSelected =
    !hasOptions || meaningfulOptions.every((option) => !!selections[option.id]);

  const resolvedVariant = useMemo(() => {
    if (product.variants.length === 0) return null;
    if (!hasOptions) return product.variants[0] ?? null;
    if (!allSelected) return null;
    return (
      product.variants.find((variant) =>
        variant.choices.every(
          (choice) => selections[choice.optionId] === choice.choiceId,
        ),
      ) ?? null
    );
  }, [hasOptions, allSelected, product.variants, selections]);

  const variantLabel = useMemo(() => {
    if (!hasOptions || !resolvedVariant) return undefined;
    const names = meaningfulOptions
      .map((option) => {
        const choice = option.choices.find((c) => c.id === selections[option.id]);
        return choice ? `${option.name}: ${choice.name}` : null;
      })
      .filter((name): name is string => name !== null);
    return names.length > 0 ? names.join(", ") : undefined;
  }, [hasOptions, resolvedVariant, meaningfulOptions, selections]);

  const price =
    resolvedVariant?.formattedPrice ??
    (hasOptions && product.minFormattedPrice
      ? product.minFormattedPrice === product.maxFormattedPrice
        ? product.minFormattedPrice
        : `${product.minFormattedPrice} – ${product.maxFormattedPrice}`
      : product.minFormattedPrice ?? "");

  const stock = resolvedVariant ? inventoryByVariant[resolvedVariant.id] : undefined;
  const soldOut =
    !!resolvedVariant &&
    !!stock &&
    stock.trackQuantity &&
    !stock.preorderEnabled &&
    stock.quantity <= 0;

  const maxQuantity = useMemo(() => {
    if (resolvedVariant && stock) {
      if (!stock.trackQuantity || stock.preorderEnabled) return MAX_QUANTITY;
      return Math.max(1, Math.min(MAX_QUANTITY, stock.quantity));
    }
    return MAX_QUANTITY;
  }, [resolvedVariant, stock]);

  const stockNote =
    stock && stock.trackQuantity && !stock.preorderEnabled && stock.quantity > 0 && stock.quantity < 10
      ? labels.stockLeft.replace("{{count}}", String(stock.quantity))
      : labels.inStock;

  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, maxQuantity)));
  }, [maxQuantity]);

  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  const handleAddToCart = async () => {
    if (!resolvedVariant) return;
    setStatus("adding");

    try {
      const { cart } = await currentCart.addToCurrentCart({
        lineItems: [
          {
            catalogReference: {
              appId: WIX_STORES_APP_ID,
              catalogItemId: product.id,
              options: { variantId: resolvedVariant.id },
            },
            quantity,
          },
        ],
      });
      setStatus("added");
      trackEvent("AddToCart", {
        id: product.id,
        name: product.name,
        price: resolvedVariant.priceAmount,
        currency: product.currency,
        quantity,
        variant: variantLabel,
        origin: "Product Page",
      });
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: { cart } }));
      window.setTimeout(() => setStatus("idle"), 1500);
    } catch (error) {
      console.error("[product-purchase] add to cart failed:", error);
      setStatus("error");
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: {} }));
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {hasOptions && (
        <div className="flex flex-col gap-4">
          {meaningfulOptions.map((option) => (
            <div key={option.id}>
              <p className="text-xs font-medium tracking-widest text-mute uppercase">{option.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {option.choices.map((choice) => {
                  const selected = selections[option.id] === choice.id;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectChoice(option.id, choice.id)}
                      className={[
                        "rounded-sm border px-4 py-2 text-sm transition-colors duration-500 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        selected
                          ? "border-accent bg-accent text-paper"
                          : "border-rule text-ink-soft hover:border-accent hover:text-ink",
                      ].join(" ")}
                    >
                      {choice.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="font-sans text-2xl font-medium text-ink">{price}</p>

      {resolvedVariant && !soldOut ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center rounded-sm border border-rule">
              <button
                type="button"
                aria-label={labels.decreaseQty}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex size-10 items-center justify-center text-ink-soft transition-colors duration-500 ease-fluid hover:text-ink disabled:opacity-40"
              >
                −
              </button>
              <span aria-live="polite" className="w-8 text-center text-sm font-medium text-ink">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={labels.increaseQty}
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                className="flex size-10 items-center justify-center text-ink-soft transition-colors duration-500 ease-fluid hover:text-ink disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="text-xs text-mute">{stockNote}</p>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={status === "adding" || status === "added"}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-paper transition-colors duration-700 ease-fluid hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status === "added" ? labels.added : status === "adding" ? labels.adding : status === "error" ? labels.tryAgain : labels.addToCart}
          </button>

          {status === "added" && (
            <a href={cartHref} className="text-sm text-accent underline-offset-4 hover:underline">
              {labels.viewCart}
            </a>
          )}
        </div>
      ) : resolvedVariant && soldOut ? (
        <p className="text-sm text-ink-soft">{labels.outOfStock}</p>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-rule px-6 text-sm font-medium text-mute disabled:opacity-60 sm:w-auto"
        >
          {labels.selectOptions}
        </button>
      )}
    </div>
  );
}