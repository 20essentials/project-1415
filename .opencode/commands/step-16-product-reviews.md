---
description: Step 16 — Reseñas de producto (Wix Reviews) · Petals & Predators
---
# Step 16 — Reseñas de producto (Wix Reviews)

> **Siguiente:** `/step-17-gift-cards-landing` (aún no existe → `/generate-next-steps`)

## Objetivo

Ratings y reseñas reales de Wix Reviews en la PDP, agregadas en estrellas, más una
sección "What growers say" en el home.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés.
- **SDK:** `npm install --legacy-peer-deps @wix/reviews` (`@wix/essentials` ya está).
- **App:** Wix Reviews (parte de Wix Stores) — si no está activa en el sitio, habilitarla
  en el dashboard antes de esperar reseñas.
- **API:** `reviews.queryReviews(query, options)` con `auth.elevate`; namespace
  `"stores"`, `entityId` = GUID del producto (`product._id`); sort por `_createdDate`
  desc. Aquí es **solo lectura** (crear reseñas exige `contactId` → fuera de alcance).
- **i18n (step-12):** los headings nuevos ("What growers say", "N reviews") salen de
  `src/translations.json` vía `t()`.
- **Estado:** PDP en `src/pages/products/[slug].astro` (ya tiene `product._id`); home en
  `src/pages/index.astro` (markers `<!-- home:* -->`).

## Functionality

1. **Sembrado de prueba:** crear 1-2 contactos (wix-manage `references/contacts/*`) y usar
   `reviews.createReview` elevado con `namespace: 'stores'`, `entityId` de un producto
   sembrado y `author.contactId`; o aprobar reseñas desde el dashboard de Wix Reviews.
   Anotar en ROADMAP si el app no está disponible.
2. **`src/utils/reviews.ts`** — interfaz `ProductReview`
   (`_id`, `author.authorName`, `content.rating|title|body`, `_createdDate`, `verified`);
   helper `averageRating(reviews)`; `getProductReviews(productId)` (filtro
   `namespace: 'stores'` + `entityId`, sort `_createdDate` desc, limit 10) y
   `getFeaturedReviews()` (todas las de `stores`, top por rating/recencia, limit 6).
   Ambas con `auth.elevate(reviews.queryReviews)` y `try/catch` → `[]`.
3. **`src/components/RatingStars.astro`** — estrellas accesibles (SVG), props `rating`
   (0-5, admite medias) y `count?`; `aria-label` desde `t('reviews.ratedOutOf')`.
4. **PDP (`products/[slug].astro`):**
   - Bajo el título, fila de rating (estrellas + `N reviews`) **solo** cuando hay reseñas.
   - Sección "What growers say" antes de "You may also like" con hasta 3 reseñas (autor,
     estrellas, fecha, body). Si no hay reseñas, no se renderiza nada.
5. **Home (`index.astro`)** — sección "What growers say" con `getFeaturedReviews()`:
   grid de quote-cards (estrellas + body + autor), insertada antes de
   `<!-- home:gift-cards -->`. Sin reseñas → no aparece.
6. **i18n:** añadir `reviews.sectionTitle`, `reviews.count` y `reviews.ratedOutOf` a
   `src/translations.json` y renderizarlos con `t()`.
7. **Sitemap:** sin cambios (no crea rutas nuevas).

## Pages / Sections

- `src/pages/products/[slug].astro` — rating summary + sección de reseñas.
- `src/pages/index.astro` — sección "What growers say".

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): estrellas `accent` (llenas) / `rule`
  (vacías); cards `bg paper-warm`, `border border-rule`, `radius 6px`; cita en
  `--font-display`, autor en `ink-soft`. Nada de placeholders de reseñas falsas.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- `reviews.queryReviews(...)` de `@wix/reviews` en SSR con `auth.elevate`, namespace
  `stores`. Envuelto en `try/catch`: si el app no está activo, devuelve `[]` y la página
  sigue renderizando sin la sección. `.wix/seeded.json` solo para IDs de apoyo; nunca
  importarlo en rutas `.astro`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Con reseñas sembradas, la PDP muestra el promedio y su lista (autor, estrellas, fecha)
- [ ] El home muestra "What growers say" cuando hay reseñas
- [ ] Un producto sin reseñas no imprime la sección ni rompe el build
- [ ] Los headings nuevos responden al idioma activo (`t()`)

## Al terminar

1. Marca el paso 16 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-17-gift-cards-landing` (aún no existe → `/generate-next-steps`).
