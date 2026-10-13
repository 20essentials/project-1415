import { useEffect, useState } from "react";
import { currentCart } from "@wix/ecom";

// CartView escribe { lineItems, summary } aquí; el badge lee la misma clave para
// pintar el conteo cacheado antes de que corra el fetch fresco.
const CART_CACHE_KEY = "cart:last-snapshot";

interface CachedLineItem {
  quantity?: number | null;
}

interface CachedSnapshot {
  lineItems?: CachedLineItem[] | null;
}

interface CartUpdateDetail {
  cart?: { lineItems?: CachedLineItem[] | null } | null;
  delta?: number;
}

interface CartBadgeLabels {
  empty: string;
  withCount: string;
}

interface CartBadgeProps {
  labels?: CartBadgeLabels;
  href?: string;
}

const DEFAULT_LABELS: CartBadgeLabels = {
  empty: "Cart",
  withCount: "Cart, {{count}} items",
};

function countItems(lineItems: CachedLineItem[] | null | undefined): number {
  return (lineItems ?? []).reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
}

function readCachedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(CART_CACHE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as CachedSnapshot;
    return countItems(parsed.lineItems);
  } catch {
    return 0;
  }
}

export default function CartBadge({ labels = DEFAULT_LABELS, href = "/cart" }: CartBadgeProps = {}) {
  const [count, setCount] = useState(() => readCachedCount());

  const fetchCount = async () => {
    try {
      const cart = await currentCart.getCurrentCart();
      setCount(countItems(cart.lineItems));
    } catch {
      setCount(0);
    }
  };

  useEffect(() => {
    void fetchCount();

    const handleCartUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdateDetail>).detail;
      if (detail?.cart?.lineItems) {
        setCount(countItems(detail.cart.lineItems));
      } else if (typeof detail?.delta === "number") {
        setCount((prev) => prev + (detail.delta ?? 0));
      } else {
        void fetchCount();
      }
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, []);

  return (
    <a
      href={href}
      className="cart-badge"
      aria-label={count > 0 ? labels.withCount.replace("{{count}}", String(count)) : labels.empty}
    >
      <svg
        className="cart-badge-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M5 8h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && <span className="cart-badge-count">{count}</span>}
    </a>
  );
}
