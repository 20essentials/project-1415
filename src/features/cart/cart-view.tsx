import { useEffect, useState } from "react";
import { currentCart } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { trackEvent } from "@/shared/analytics";
import { resolveWixImageUrl } from "@/shared/wix-image";

const CART_CACHE_KEY = "cart:last-snapshot";

// Wix sets the `wixLanguage` cookie for the visitor's current locale (see the
// Astro localization middleware); its language is passed to Wix-hosted
// redirect sessions so checkout renders in the same language.
function readSiteLanguage(): string {
  if (typeof document === "undefined") return "en";
  const match = /(?:^|;\s*)wixLanguage=([a-z]{2,3})/i.exec(document.cookie);
  return match?.[1] ?? "en";
}

type CartFromSDK = Awaited<ReturnType<typeof currentCart.getCurrentCart>>;
type Cart = CartFromSDK & {
  lineItems?: Array<{
    _id: string;
    name?: string | null;
    description?: string | null;
    quantity?: number | null;
    image?: any;
    price?: {
      amount?: number | null;
      total?: number | null;
      amountPerItem?: number | null;
      convertedAmount?: number | null;
      formattedAmount?: string | null;
      formattedConvertedAmount?: string | null;
    } | null;
  }>;
  summary?: {
    subtotal?: number | null;
    lineItemsSubtotal?: number | null;
    currencyCode?: string | null;
  } | null;
};
type LineItem = NonNullable<Cart["lineItems"]>[number];

function isCart(c: unknown): c is Cart {
  if (typeof c !== "object" || c === null) return false;
  const rec = c as Record<string, unknown>;
  return Array.isArray(rec.lineItems) || (rec as any).lineItems !== undefined || true; // be permissive with SDK shapes
}

interface Snapshot {
  lineItems: NonNullable<Cart["lineItems"]>;
  summary: Cart["summary"];
}

function publishCartUpdate(cart: Cart, delta?: number) {
  if (typeof window === "undefined") return;
  const snapshot: Snapshot = {
    lineItems: cart.lineItems ?? [],
    summary: cart.summary,
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
  const cur = currency || "USD";
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
  redirecting: string;
  checkout: string;
  product: string;
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
  redirecting: "Redirecting…",
  checkout: "Check out securely",
  product: "Product",
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

  const refreshCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await currentCart.getCurrentCart()) as unknown as Cart;
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

  const lineItems = cart?.lineItems ?? [];
  const summary = cart?.summary;

  const subtotal = summary?.subtotal ?? summary?.lineItemsSubtotal ?? 0;
  const currency = summary?.currencyCode ?? "USD";

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await currentCart.updateCurrentCartLineItemQuantity([
        { _id: itemId, quantity },
      ]);
      const updated = res?.cart as unknown;
      if (isCart(updated)) {
        setCart(updated as Cart);
        publishCartUpdate(updated as Cart);
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
        const prevCount = lineItems.reduce((sum: number, item: LineItem) => sum + (item.quantity ?? 0), 0);
    const removed = lineItems.find((item: LineItem) => item._id === itemId);
    try {
      const res = await currentCart.removeLineItemsFromCurrentCart([itemId]);
      const updated = res?.cart as unknown;
      if (isCart(updated)) {
        setCart(updated as Cart);
        publishCartUpdate(updated as Cart, -(prevCount > 0 ? prevCount : 1));
        trackEvent("RemoveFromCart", {
          id: itemId,
          name: removed?.name ?? labels.product,
          price: removed?.price?.amountPerItem ?? removed?.price?.amount ?? undefined,
          currency,
          quantity: removed?.quantity ?? 1,
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
        contents: lineItems.map((item: LineItem) => ({
          id: item._id,
          name: item.name ?? labels.product,
          price: item.price?.amountPerItem ?? item.price?.amount ?? undefined,
          currency,
          quantity: item.quantity ?? 1,
        })),
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
          {lineItems.map((item: LineItem) => {
            const image = item.image;
            const imageUrl = resolveWixImageUrl(image, 160, 160) || image?.url || "";
            const price = item.price?.total ?? item.price?.amountPerItem ?? 0;
            const maxQty = 100;
            const qty = item.quantity ?? 1;

            return (
              <article key={item._id} className="cart-row">
                <div className="cart-row-image">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name ?? labels.product} width="80" height="80" loading="lazy" decoding="async" />
                  ) : (
                    <div className="cart-row-image-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="cart-row-info">
                  <div className="cart-row-name">{item.name}</div>
                  {item.description && <div className="cart-row-desc">{item.description}</div>}
                  <div className="cart-row-price">{formatCurrency(price, currency)}</div>
                </div>
                <div className="cart-row-actions">
                  <div className="cart-stepper" role="group" aria-label={labels.quantityFor.replace("{{name}}", item.name ?? labels.product)}>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item._id, Math.max(1, qty - 1))}
                      disabled={updating || qty <= 1}
                      aria-label={labels.decreaseQty}
                    >
                      −
                    </button>
                    <span className="cart-stepper-qty">{qty}</span>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item._id, Math.min(maxQty, qty + 1))}
                      disabled={updating || qty >= maxQty}
                      aria-label={labels.increaseQty}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => handleRemove(item._id)}
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
            <span className="cart-summary-subtotal">{formatCurrency(subtotal, currency)}</span>
          </div>
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
