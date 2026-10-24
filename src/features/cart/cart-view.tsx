import { useEffect, useMemo, useState } from "react";
import { currentCart, currentCartV2 } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { trackEvent } from "@/shared/analytics";
import { resolveWixImageUrl } from "@/shared/wix-image";
import {
  couponErrorCode,
  couponErrorMessage,
  type CouponMessages,
} from "./coupon-messages";
import { normalizeCart, type CartLineItem } from "./cart-shape";

const CART_CACHE_KEY = "cart:last-snapshot";

// Wix sets the `wixLanguage` cookie for the visitor's current locale (see the
// Astro localization middleware); its language is passed to Wix-hosted
// redirect sessions so checkout renders in the same language.
function readSiteLanguage(): string {
  if (typeof document === "undefined") return "en";
  const match = /(?:^|;\s*)wixLanguage=([a-z]{2,3})/i.exec(document.cookie);
  return match?.[1] ?? "en";
}

type Cart = unknown;

interface Snapshot {
  lineItems: Array<{ quantity?: number | null }>;
  total?: number | null;
}

function publishCartUpdate(cart: Cart, delta?: number) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCart(cart);
  const snapshot: Snapshot = {
    lineItems: normalized.lineItems.map((item) => ({ quantity: item.quantity })),
    total: normalized.totals.total,
  };
  try {
    window.sessionStorage.setItem(CART_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore cache write errors
  }
  window.dispatchEvent(
    new CustomEvent("cart-updated", {
      detail: { cart: snapshot, delta },
    })
  );
}

function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return "";
  const cur = currency || "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${cur}`;
  }
}

function formatLinePrice(item: CartLineItem, currency: string | null | undefined): string {
  return (
    item.formattedLineTotal ??
    formatCurrency(item.lineTotal, currency)
  );
}

export interface CartLabels {
  title: string;
  loading: string;
  empty: string;
  continueShopping: string;
  errorLoad: string;
  errorUpdate: string;
  errorRemove: string;
  errorCheckout: string;
  quantityFor: string;
  decreaseQty: string;
  increaseQty: string;
  remove: string;
  summary: string;
  subtotal: string;
  discount?: string;
  total?: string;
  redirecting: string;
  checkout: string;
  product: string;
  coupon?: CouponMessages & {
    label: string;
    placeholder: string;
    apply: string;
    applying: string;
    applied: string;
    remove: string;
  };
}

const DEFAULT_LABELS: CartLabels = {
  title: "Cart",
  loading: "Loading your cart…",
  empty: "Your cart is empty.",
  continueShopping: "Continue shopping",
  errorLoad: "Failed to load cart",
  errorUpdate: "Failed to update cart",
  errorRemove: "Failed to remove item",
  errorCheckout: "Failed to start checkout",
  quantityFor: "Quantity for {{name}}",
  decreaseQty: "Decrease quantity",
  increaseQty: "Increase quantity",
  remove: "Remove",
  summary: "Order summary",
  subtotal: "Subtotal",
  discount: "Discount",
  total: "Total",
  redirecting: "Redirecting…",
  checkout: "Check out securely",
  product: "Product",
  coupon: {
    label: "Coupon code",
    placeholder: "Enter coupon code",
    apply: "Apply",
    applying: "Applying…",
    applied: "Applied coupon",
    remove: "Remove",
    invalid: "Invalid coupon code",
    expired: "Coupon expired or not valid",
    already: "Coupon already applied",
    giftCard: "This coupon cannot be applied to gift cards",
    network: "Network error while applying coupon",
    unknown: "Failed to apply coupon",
  },
};

interface CartViewProps {
  labels?: Partial<CartLabels>;
  continueHref?: string;
  thankYouPath?: string;
}

export function CartView({
  labels: labelOverrides,
  continueHref = "/products",
  thankYouPath = "/thank-you",
}: CartViewProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, setCouponPending] = useState(false);

  const refreshCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await currentCart.getCurrentCart()) as unknown;
      setCart(data);
      publishCartUpdate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshCart();
  }, []);

  const normalized = useMemo(() => normalizeCart(cart), [cart]);
  const lineItems = normalized.lineItems;
  const coupons = normalized.coupons;
  const {
    subtotal,
    discount,
    total,
    currency,
    formattedSubtotal,
    formattedTotal,
    formattedDiscount,
  } = normalized.totals;

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await currentCart.updateCurrentCartLineItemQuantity([
        { _id: itemId, quantity },
      ]);
      const updated = res?.cart as unknown;
      if (updated) {
        setCart(updated);
        publishCartUpdate(updated);
        trackEvent("CustomEvent", {
          eventCategory: "Cart",
          eventAction: "CartUpdated",
          eventLabel: itemId,
          quantity,
        });
      } else {
        await refreshCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorUpdate);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart) return;
    setUpdating(true);
    setError(null);
    const removed = lineItems.find((item: CartLineItem) => item.id === itemId);
    const removedQuantity = removed?.quantity ?? 1;
    try {
      const res = await currentCart.removeLineItemsFromCurrentCart([itemId]);
      const updated = res?.cart as unknown;
      if (updated) {
        setCart(updated);
        publishCartUpdate(updated, -removedQuantity);
        trackEvent("RemoveFromCart", {
          id: itemId,
          name: removed?.title ?? labels.product,
          price: removed?.unitPrice ?? undefined,
          currency,
          quantity: removedQuantity,
          origin: "Cart Page",
        });
      } else {
        await refreshCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorRemove);
    } finally {
      setUpdating(false);
    }
  };

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (couponPending) return;
    const code = couponInput.trim();
    if (!code) return;
    setCouponPending(true);
    setCouponError(null);
    try {
      const res = await currentCartV2.addCouponToCurrentCart({ code });
      const updated = res?.cart as unknown;
      if (updated) {
        setCart(updated);
        publishCartUpdate(updated);
        trackEvent("CustomEvent", {
          eventCategory: "Cart",
          eventAction: "ApplyCoupon",
          eventLabel: code,
        });
        setCouponInput("");
      } else {
        await refreshCart();
      }
    } catch (err) {
      const codeErr = couponErrorCode(err);
      const msgs = labels.coupon ?? DEFAULT_LABELS.coupon!;
      setCouponError(couponErrorMessage(codeErr, msgs));
    } finally {
      setCouponPending(false);
    }
  };

  const handleRemoveCoupon = async (couponId?: string | null) => {
    if (couponPending) return;
    const id = couponId ?? coupons[0]?.id;
    if (!id) return;
    setCouponPending(true);
    setCouponError(null);
    try {
      const res = await currentCartV2.removeCouponFromCurrentCart(id);
      const updated = res?.cart as unknown;
      if (updated) {
        setCart(updated);
        publishCartUpdate(updated);
      } else {
        await refreshCart();
      }
    } catch (err) {
      const codeErr = couponErrorCode(err);
      const msgs = labels.coupon ?? DEFAULT_LABELS.coupon!;
      setCouponError(couponErrorMessage(codeErr, msgs));
    } finally {
      setCouponPending(false);
    }
  };

  const handleCheckout = async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const checkoutRes = await currentCart.createCheckoutFromCurrentCart({
        channelType: currentCart.ChannelType.WEB,
      });
      const checkoutId = checkoutRes?.checkoutId;
      if (!checkoutId) {
        throw new Error("Missing checkoutId from createCheckoutFromCurrentCart");
      }
      const redirectRes = await redirects.createRedirectSession({
        ecomCheckout: { checkoutId },
        preferences: { additionalQueryParameters: { lang: readSiteLanguage() } },
        callbacks: {
          postFlowUrl: typeof window !== "undefined" ? `${window.location.origin}${thankYouPath}` : thankYouPath,
        },
      });
      const fullUrl = redirectRes?.redirectSession?.fullUrl || redirectRes?.redirectSession?.urlDetails?.endpoint || redirectRes?.redirectSession?.shortUrl;
      if (!fullUrl) {
        throw new Error("Missing redirect session URL");
      }
      trackEvent("InitiateCheckout", {
        origin: "Cart Page",
        contents: lineItems.map((item: CartLineItem) => ({
          id: item.id,
          name: item.title ?? labels.product,
          price: item.unitPrice,
          currency,
          quantity: item.quantity,
        })),
      });
      // Checkout hosted by Wix: CheckoutStep/AddPaymentInfo not instrumentable here.
      trackEvent("StartPayment", {
        origin: "Cart Page",
        currency,
        value: total ?? undefined,
      });
      window.location.href = fullUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorCheckout);
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-shell">
        <div className="cart-header">
          <h1>{labels.title}</h1>
          <p className="cart-subtle">{labels.loading}</p>
        </div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="cart-shell">
        <div className="cart-header">
          <h1>{labels.title}</h1>
        </div>
        <div className="cart-empty">
          <p>{labels.empty}</p>
          <a className="btn btn-primary" href={continueHref}>
            <span className="text-trim">{labels.continueShopping}</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <div className="cart-header">
        <h1>{labels.title}</h1>
      </div>

      {error && <div className="cart-error" role="alert">{error}</div>}

      <div className="cart-grid">
        <div className="cart-items">
          {lineItems.map((item: CartLineItem) => {
            const image = item.image;
            const imageUrl = resolveWixImageUrl(image, 160, 160) || "";
            const maxQty = 100;
            const qty = item.quantity;
            const title = item.title ?? labels.product;

            return (
              <article key={item.id} className="cart-row">
                <div className="cart-row-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={title} width="80" height="80" loading="lazy" decoding="async" />
                  ) : (
                    <div className="cart-row-image-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="cart-row-info">
                  <div className="cart-row-name">{title}</div>
                  {item.description && <div className="cart-row-desc">{item.description}</div>}
                  <div className="cart-row-price">{formatLinePrice(item, currency)}</div>
                </div>
                <div className="cart-row-actions">
                  <div className="cart-stepper" role="group" aria-label={labels.quantityFor.replace("{{name}}", title)}>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item.id, Math.max(1, qty - 1))}
                      disabled={updating || qty <= 1}
                      aria-label={labels.decreaseQty}
                    >
                      −
                    </button>
                    <span className="cart-stepper-qty">{qty}</span>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item.id, Math.min(maxQty, qty + 1))}
                      disabled={updating || qty >= maxQty}
                      aria-label={labels.increaseQty}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => handleRemove(item.id)}
                    disabled={updating}
                  >
                    {labels.remove}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>{labels.summary}</h2>
          <div className="cart-summary-row">
            <span>{labels.subtotal}</span>
            <span className="cart-summary-subtotal">
              {formattedSubtotal ?? formatCurrency(subtotal, currency)}
            </span>
          </div>
          {coupons.length > 0 && coupons[0] && (
            <div className="cart-summary-row">
              <span>{labels.discount ?? "Discount"}</span>
              <span className="cart-summary-discount">
                −{formattedDiscount ?? formatCurrency(discount, currency)}
              </span>
              <span className="cart-coupon-chip">
                {coupons[0].code}
                <button
                  type="button"
                  className="cart-coupon-remove"
                  onClick={() => handleRemoveCoupon(coupons[0]?.id)}
                  aria-label={`${labels.coupon?.remove ?? "Remove"} ${coupons[0]?.code ?? ""}`}
                  disabled={couponPending}
                >
                  {labels.coupon?.remove ?? "Remove"}
                </button>
              </span>
            </div>
          )}
          {discount > 0 && (
            <div className="cart-summary-row">
              <span>{labels.total ?? "Total"}</span>
              <span className="cart-summary-total">
                {formattedTotal ?? formatCurrency(total, currency)}
              </span>
            </div>
          )}
          {coupons.length === 0 && (
            <form className="cart-coupon-form" onSubmit={handleApplyCoupon}>
              <label htmlFor="coupon-input" className="sr-only">
                {labels.coupon?.label ?? "Coupon code"}
              </label>
              <input
                id="coupon-input"
                name="coupon"
                type="text"
                autoComplete="off"
                className="cart-coupon-input"
                placeholder={labels.coupon?.placeholder ?? "Enter coupon code"}
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponError) setCouponError(null);
                }}
              />
              <button
                type="submit"
                className="btn btn-secondary cart-coupon-btn"
                disabled={couponPending || couponInput.trim() === ""}
                aria-busy={couponPending}
              >
                {couponPending ? labels.coupon?.applying ?? "Applying…" : labels.coupon?.apply ?? "Apply"}
              </button>
              {couponError && (
                <div className="cart-coupon-error" role="alert">
                  {couponError}
                </div>
              )}
            </form>
          )}
          {coupons.length > 0 && couponError && (
            <div className="cart-coupon-error" role="alert">
              {couponError}
            </div>
          )}
          {coupons.length > 0 && (
            <div className="cart-coupon-applied" role="status">
              {labels.coupon?.applied ?? "Applied coupon"}
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleCheckout}
            disabled={checkoutLoading || updating}
          >
            <span className="text-trim">{checkoutLoading ? labels.redirecting : labels.checkout}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
