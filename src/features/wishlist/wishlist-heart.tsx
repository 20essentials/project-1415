import { useState } from "react";

export interface WishlistHeartLabels {
  add: string;
  remove: string;
  signIn: string;
  error: string;
}

interface WishlistHeartProps {
  productId: string;
  productSlug?: string;
  initialWished: boolean;
  isMember: boolean;
  signInHref: string;
  labels: WishlistHeartLabels;
}

const HEART_PATH =
  "M12 20.4C10.5 19.2 4.5 14.7 4.5 9.9A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8c0 4.8-6 9.3-7.5 10.5z";

const BASE_CLASS =
  "inline-flex size-9 items-center justify-center rounded-full border border-rule bg-paper/80 text-ink-soft backdrop-blur transition-colors duration-200 ease-fluid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function WishlistHeart({
  productId,
  productSlug,
  initialWished,
  isMember,
  signInHref,
  labels,
}: WishlistHeartProps) {
  const [wished, setWished] = useState(initialWished);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  if (!isMember) {
    return (
      <a href={signInHref} aria-label={labels.signIn} className={`${BASE_CLASS} hover:text-accent`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4.5"
        >
          <path d={HEART_PATH} />
        </svg>
      </a>
    );
  }

  const toggle = async () => {
    if (pending) return;
    const next = !wished;
    setWished(next);
    setPending(true);
    setError(false);
    try {
      const response = next
        ? await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, slug: productSlug }),
          })
        : await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
            method: "DELETE",
          });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      console.error("[wishlist-heart] toggle failed:", err);
      setWished(!next);
      setError(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-pressed={wished}
        aria-busy={pending}
        aria-label={wished ? labels.remove : labels.add}
        className={`${BASE_CLASS} ${wished ? "text-accent" : "hover:text-accent"} aria-busy:opacity-60`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={wished ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4.5 transition-transform duration-200 ease-fluid motion-reduce:transition-none motion-reduce:transform-none"
        >
          <path d={HEART_PATH} />
        </svg>
      </button>
      {error && (
        <span role="alert" className="sr-only">
          {labels.error}
        </span>
      )}
    </span>
  );
}
