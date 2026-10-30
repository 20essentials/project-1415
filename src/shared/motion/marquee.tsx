import type { CSSProperties, ReactNode } from "react";
import "./motion.css";

export interface MarqueeProps {
  children: ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  duration?: number;
  gap?: string;
  className?: string;
  ariaLabel?: string;
}

export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  duration = 40,
  gap,
  className = "",
  ariaLabel,
}: MarqueeProps) {
  const style: CSSProperties = {
    "--motion-marquee-duration": `${duration}s`,
    ...(gap ? { "--motion-marquee-gap": gap } : {}),
  } as CSSProperties;

  return (
    <div
      data-motion="marquee"
      data-reverse={reverse || undefined}
      data-pause-on-hover={pauseOnHover || undefined}
      style={style}
      className={className}
      role={ariaLabel ? "marquee" : undefined}
      aria-label={ariaLabel}
    >
      <div data-motion-track>
        <div data-motion-copy>{children}</div>
        <div data-motion-copy aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
