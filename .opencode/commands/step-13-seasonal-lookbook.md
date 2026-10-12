---
description: Step 13 — Lookbook estacional · Petals & Predators
---
# Step 13 — Lookbook estacional

> **Siguiente:** `/step-14-product-reviews`

## Objetivo

Una landing editorial `/lookbook` que arma mosaicos por estación desde el CMS, con sus
fotos y productos destacados, más un CTA desde el home y un link en el nav.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés.
- **Recetas:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless`
  (`references/astro/cms/CMS_FOUNDATIONS.md`) · wix-manage =
  `C:\Users\amoil\.agents\skills\wix-manage` (`references/cms/cms-schema-management.md`,
  `references/cms/cms-data-items-crud.md`, `references/media/*`).
- **SDK:** `@wix/data` (instalado en step-11) y `@wix/essentials`; imágenes con
  `src/utils/wix-image.ts` y productos con `productsV3` (`@wix/stores`).
- **i18n (step-12):** el copy de UI sale de `src/translations.json` vía `t()`
  (`src/utils/i18n.ts`); los enlaces internos pasan por `localize()`. El texto de la
  colección es contenido CMS y se traduce con el mecanismo por-app de Wix Multilingual
  (fuera del alcance de este step).
- **Estado:** nav en `src/data/site.ts`; home en `src/pages/index.astro` (markers
  `<!-- home:* -->`); el catálogo ya se consulta con `productsV3.queryProducts`.

## Functionality

1. **Colección CMS `lookbook`** (id `lookbook`): `season` (TEXT, p. ej. "Spring 2026"),
   `title` (TEXT), `tagline` (TEXT), `story` (RICH_TEXT), `heroImage` (IMAGE),
   `gallery` (IMAGE array), `productSlugs` (TEXT array), `orderIndex` (NUMBER). Sembrar
   2-3 estaciones con 3-4 fotos cada una (wix-manage media), siguiendo el mismo pipeline
   que `care-guides`.
2. **`src/utils/lookbook.ts`** — interfaz `LookbookEntry` tipada; `queryLookbook()`
   (`orderIndex` asc, `auth.elevate(items.query)`, `try/catch` → `[]`) resolviendo
   `heroImage` y `gallery` con `resolveWixImageUrl`.
3. **`src/pages/lookbook.astro`**:
   - Hero editorial de la primera estación (imagen full-bleed + título + tagline).
   - Por cada estación: mosaico editorial asimétrico con la galería, `story` vía
     `renderRicos`, y una fila de productos destacados.
   - Productos destacados: traer el catálogo **una vez** con
     `productsV3.queryProducts({ fields: ['CURRENCY'] }).limit(100)` y mapear por `slug`
     → no usar filtros no soportados por la query v3; si un `productSlug` no matchea, se
     omite sin romper la página.
   - Estado vacío cálido si no hay items.
4. **Nav:** `{ href: '/lookbook', label: 'nav.lookbook' }` en `site.nav`, antes de
   `Journal`, y añadir la clave `nav.lookbook` ("Lookbook") a `src/translations.json`.
5. **Home:** bloque CTA "Shop the lookbook" en `src/pages/index.astro` antes de
   `<!-- home:gift-cards -->`, con el label desde `t('home.lookbookCta')` (añadir la clave).
6. **Sitemap:** añadir `/lookbook` a `src/pages/sitemap.xml.ts`.

## Pages / Sections

- `src/pages/lookbook.astro` — hero + mosaicos por estación + productos destacados.
- `src/pages/index.astro` — CTA "Shop the lookbook".
- `src/data/site.ts` + `src/translations.json` — link `nav.lookbook`.
- `src/components/header.astro` — sin cambios (el link llega desde `site.nav`).

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie
  `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Mosaico: grid `1 → 2 → 3` columnas (640/1024), `gap-4/6`, cards `radius 6/12px`,
  imágenes `object-cover` con `alt` descriptivo; títulos de estación en `--font-display`,
  story en `ink-soft`.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- `items.query('lookbook')` de `@wix/data` en SSR con `auth.elevate`; productos con
  `productsV3.queryProducts` y mapeo en código por `slug`. Colección user → id sin
  namespace. `.wix/seeded.json` solo para slugs/IDs de apoyo; nunca importarlo en rutas
  `.astro`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/lookbook` renderiza las estaciones sembradas con su galería y story (rich text)
- [ ] Los productos destacados aparecen cuando el `slug` existe y se omiten si no
- [ ] "Lookbook" en el nav y el CTA del home navegan a `/lookbook` (y respetan el locale)
- [ ] `/lookbook` está en el sitemap; sin items el estado vacío no rompe la página

## Al terminar

1. Marca el paso 13 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-14-product-reviews`.
