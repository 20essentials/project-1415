import type { CSSProperties, ReactNode } from "react";
import "./motion.css";

export interface StarBorderProps {
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function StarBorder({ children, duration = 7, className = "" }: StarBorderProps) {
  const style: CSSProperties | undefined =
    duration === 7 ? undefined : ({ "--motion-star-duration": `${duration}s` } as CSSProperties);

  return (
    <div data-motion="star-border" style={style} className={className}>
      <div data-motion-star-content>{children}</div>
    </div>
  );
}
