import { useRef, type CSSProperties, type ReactNode } from "react";
import "./motion.css";

export interface SpotlightCardProps {
  children: ReactNode;
  radius?: string;
  className?: string;
}

export function SpotlightCard({ children, radius = "16rem", className = "" }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--motion-spot-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--motion-spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      data-motion="spotlight-card"
      onPointerMove={handlePointerMove}
      style={{ "--motion-spot-radius": radius } as CSSProperties}
      className={className}
    >
      {children}
    </div>
  );
}
