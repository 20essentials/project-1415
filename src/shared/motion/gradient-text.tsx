import type { CSSProperties, ReactNode } from "react";
import "./motion.css";

export interface GradientTextProps {
  children: ReactNode;
  duration?: number;
  className?: string;
}

export function GradientText({ children, duration = 9, className = "" }: GradientTextProps) {
  const style: CSSProperties | undefined =
    duration === 9 ? undefined : ({ "--motion-gradient-duration": `${duration}s` } as CSSProperties);

  return (
    <span data-motion="gradient-text" style={style} className={className}>
      {children}
    </span>
  );
}
