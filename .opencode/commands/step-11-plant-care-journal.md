---
description: Step 11 — Plant care journal (CMS) · Petals & Predators
---
# Step 11 — Plant care journal (CMS)

> **Siguiente:** `/step-12-multilingual-support`

## Objetivo

Un diario de cuidados servido desde una colección CMS de Wix: `/journal` lista las guías
y `/journal/[slug]` renderiza cada una con rich text, más un link "Journal" en el nav y
una guía destacada en el home.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés.
- **Recetas:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless`
  (`references/astro/cms/CMS_FOUNDATIONS.md` para el patrón de página) · wix-manage =
  `C:\Users\amoil\.agents\skills\wix-manage` (`references/cms/cms-schema-management.md`
  para crear la colección, `references/cms/cms-data-items-crud.md` para insertar items,
  `references/media/*` para subir las imágenes).
- **SDK:** `npm install --legacy-peer-deps @wix/data` (`@wix/essentials` y el walker
  `src/utils/ricos.ts` ya están en el proyecto).
- **Estado:** nav en `src/data/site.ts` (`nav[]`); home en `src/pages/index.astro`
  (markers `<!-- home:* -->`); layout en `src/layouts/layout.astro`.

## Functionality

1. **Colección CMS `care-guides`** (user collection → id = `care-guides`, sin namespace):
   campos `title` (TEXT), `slug` (TEXT), `intro` (TEXT), `body` (RICH_TEXT), `plantTag`
   (TEXT), `coverImage` (IMAGE). Sembrar 3-4 guías reales en inglés (p. ej. "Watering a
   Venus Flytrap", "Humidity for Nepenthes", "Sundew light", "Repotting without shock")
   siguiendo las recetas de wix-manage. Verificar el id real con
   `GET /wix-data/v2/collections?fields=id` antes de consultar.
2. **`src/utils/journal.ts`** — interfaz `CareGuide` tipada; `queryGuides()` (todas,
   ordenadas por `_createdDate` desc) y `getGuideBySlug(slug)`; ambas usan
   `auth.elevate(items.query)` de `@wix/data` y `try/catch` → `[]` / `null`; resolver
   `coverImage` con `src/utils/wix-image.ts`.
3. **`src/pages/journal/index.astro`** — grid editorial de guías (cover, título, intro,
   `plantTag`); estado vacío cálido con link a `/products`.
4. **`src/pages/journal/[slug].astro`** — SSR por slug (`output: "server"`, sin
   `getStaticPaths`): `Astro.params.slug` → `getGuideBySlug`; 404 si no existe; hero
   (cover + título + intro) + body vía `renderRicos(guide.body)`; CTA a `/products`.
5. **Nav:** añadir `{ href: '/journal', label: 'Journal' }` a `site.nav` en
   `src/data/site.ts`, insertado antes de `About` (sin tocar los links hash actuales).
6. **Home:** bloque "From the journal" con la guía más reciente
   (`queryGuides().slice(0, 1)`) en `src/pages/index.astro`, insertado antes de
   `<!-- home:gift-cards -->`; no borrar markers existentes.
7. **Sitemap:** añadir `/journal` y cada `/journal/<slug>` a `src/pages/sitemap.xml.ts`.

## Pages / Sections

- `src/pages/journal/index.astro` — listado de guías.
- `src/pages/journal/[slug].astro` — detalle rich-text + CTA a la tienda.
- `src/pages/index.astro` — bloque featured "From the journal".
- `src/components/header.astro` — sin cambios (el link llega desde `site.nav`).

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie
  `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Cards de guía: cover `aspect-4/5`, `border border-rule`, `radius 6px`, hover 0.2s;
  prosa del body reutilizando el patrón `.pg-description` de `products/[slug].astro`
  (`--font-display`, `--color-ink`, links `accent`).
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- `items.query('care-guides')` de `@wix/data` en SSR, siempre con `auth.elevate`; render
  del rich text con `renderRicos` (`src/utils/ricos.ts`). Colección user → id sin
  namespace. `.wix/seeded.json` solo para slugs/IDs de apoyo; nunca importarlo en rutas
  `.astro`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/journal` lista las guías sembradas y cada card abre su `/journal/<slug>`
- [ ] `/journal/<slug>` renderiza el rich text (sin `[object Object]`); slug inexistente → 404
- [ ] "Journal" aparece en el nav (desktop + menú móvil) y navega correctamente
- [ ] La guía destacada aparece en el home; `/journal` y sus posts están en el sitemap

## Al terminar

1. Marca el paso 11 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-12-multilingual-support`.

## Resultado

Colección Wix CMS `care-guides` (title, slug, intro, body, plantTag, coverImage) + 4 guías seeded + rutas `/journal` y `/journal/[slug]` (404 si no existe) + link "Journal" en el nav + featured guide en home + sitemap
