import { useEffect, useState } from "react";
import { currentCart } from "@wix/ecom";
import { redirects } from "@wix/redirects";
import { trackEvent } from "@/utils/analytics";
import { resolveWixImageUrl } from "@/utils/wix-image";

const CART_CACHE_KEY = "cart:last-snapshot";

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

export default function CartView() {
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
      setError(err instanceof Error ? err.message : "Failed to load cart");
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
        trackEvent("cart_updated", { itemId, quantity });
      } else {
        await refreshCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cart");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart) return;
    setUpdating(true);
    setError(null);
        const prevCount = lineItems.reduce((sum: number, item: LineItem) => sum + (item.quantity ?? 0), 0);
    try {
      const res = await currentCart.removeLineItemsFromCurrentCart([itemId]);
      const updated = res?.cart as unknown;
      if (isCart(updated)) {
        setCart(updated as Cart);
        publishCartUpdate(updated as Cart, -(prevCount > 0 ? prevCount : 1));
        trackEvent("cart_removed", { itemId });
      } else {
        await refreshCart();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
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
        callbacks: {
          postFlowUrl: typeof window !== "undefined" ? `${window.location.origin}/thank-you` : "/thank-you",
        },
      });
      const fullUrl = redirectRes?.redirectSession?.fullUrl || redirectRes?.redirectSession?.urlDetails?.endpoint || redirectRes?.redirectSession?.shortUrl;
      if (!fullUrl) {
        throw new Error("Missing redirect session URL");
      }
      trackEvent("cart_checkout_started", { checkoutId });
      window.location.href = fullUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-shell">
        <div className="cart-header">
          <h1>Cart</h1>
          <p className="cart-subtle">Loading your cart…</p>
        </div>
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="cart-shell">
        <div className="cart-header">
          <h1>Cart</h1>
        </div>
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <a className="btn btn-primary" href="/products">
            <span className="text-trim">Continue shopping</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-shell">
      <div className="cart-header">
        <h1>Cart</h1>
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
                    <img src={imageUrl} alt={item.name ?? "Product"} loading="lazy" />
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
                  <div className="cart-stepper" role="group" aria-label={`Quantity for ${item.name ?? "product"}`}>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item._id, Math.max(1, qty - 1))}
                      disabled={updating || qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-stepper-qty">{qty}</span>
                    <button
                      type="button"
                      className="cart-stepper-btn"
                      onClick={() => handleQuantityChange(item._id, Math.min(maxQty, qty + 1))}
                      disabled={updating || qty >= maxQty}
                      aria-label="Increase quantity"
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
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span className="cart-summary-subtotal">{formatCurrency(subtotal, currency)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={handleCheckout}
            disabled={checkoutLoading || updating}
          >
            <span className="text-trim">{checkoutLoading ? "Redirecting…" : "Check out securely"}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}
