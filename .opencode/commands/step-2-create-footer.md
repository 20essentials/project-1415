---
description: Step 2 — Footer completo · Petals & Predators
---
# Step 2 — Footer completo

> **Siguiente:** `/step-3-seed-plant-catalog`

## Objetivo

Convertir el `footer.astro` básico que escribió el Composer en un footer completo:
columnas de enlaces, tagline, newsletter, redes sociales y fila legal — responsive y accesible.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Páginas hoy:** !`ls src/pages 2>/dev/null || echo "(ninguna)"` · **Comandos:** !`ls .opencode/commands`
- El footer vive en `src/components/footer.astro` y se monta desde `layout.astro` (todas las páginas).

## Functionality

1. **Columna Shop:** All Plants → `/products` · Carnivorous → `/category/carnivorous` ·
   Flowers → `/category/flowers` · Kits & Accessories → `/category/kits-accessories`.
2. **Columna Company:** About → `/about` · Contact → `/contact`.
3. **Columna Care:** enlaces ancla a contenido de soporte (Shipping & Returns, Plant Care 101)
   — por ahora apuntan a `/contact#shipping` y `/contact#care` (step-8 crea el destino).
4. **Newsletter:** input + botón "Get growing tips" (estado visual; la persistencia real
   llega con el roadmap #15 — no inventes submit backend).
5. **Tagline** del shell (`Grown by hand, fed by instinct.`) + marca ❀.
6. **Redes:** iconos SVG inline (Instagram, Pinterest, TikTok) con `aria-label`.
7. **Fila legal:** `© 2026 Petals & Predators` · Terms · Privacy (hrefs `#` con
   `aria-disabled` o `/contact`).

## Design

- Fondo `paper`/`paper-warm`, texto `ink`, enlaces `mute` → `accent` en hover,
  bordes `rule` arriba (`border-t`), radii 4px en el input del newsletter.
- Tipografía: headings de columna Inter 14px/500 `ink`; enlaces 14px `mute` line-height 20px.
- Transición en hover 0.2s `cubic-bezier(.4,0,.2,1)`.
- Responsive: 4 columnas desktop → 2 tablet → 1 móvil (stack con gaps de 16-24px).
- A11y: `<footer>` landmark, targets ≥44px en móvil, focus-visible `accent`, contraste AA.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Footer visible en `/` y en todas las páginas creadas hasta ahora
- [ ] Todos los links internos resuelven (o están en la lista "se activa en step-N")
- [ ] Sin `console.error` de hidratación

## Al terminar

1. Marca el paso 2 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-3-seed-plant-catalog`
