import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
}

export function CountUp({
  to,
  from = 0,
  duration = 1600,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "en-US",
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const animate = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.max(from, from + (to - from) * eased));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setValue(to);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const start = () => animate();
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "undefined") {
      start();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            start();
            observer?.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(node);
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, from, duration]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return (
    <span ref={ref} data-motion="count-up" className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
