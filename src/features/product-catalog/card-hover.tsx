import { useEffect } from "react";

export function CardHover() {
  useEffect(() => {
    let frame = 0;
    const handleMove = (event: Event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const pointer = event as PointerEvent;
        const card = (pointer.target as Element | null)?.closest?.("[data-product-card]");
        if (!(card instanceof HTMLElement)) return;
        const rect = card.getBoundingClientRect();
        card.style.setProperty("--card-glow-x", `${pointer.clientX - rect.left}px`);
        card.style.setProperty("--card-glow-y", `${pointer.clientY - rect.top}px`);
      });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
