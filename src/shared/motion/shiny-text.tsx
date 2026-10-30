import type { CSSProperties, ReactNode } from "react";
import "./motion.css";

export interface ShinyTextProps {
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function ShinyText({ children, duration = 5, className = "" }: ShinyTextProps) {
  const style: CSSProperties | undefined =
    duration === 5 ? undefined : ({ "--motion-shiny-duration": `${duration}s` } as CSSProperties);

  return (
    <span data-motion="shiny-text" style={style} className={className}>
      {children}
    </span>
  );
}
