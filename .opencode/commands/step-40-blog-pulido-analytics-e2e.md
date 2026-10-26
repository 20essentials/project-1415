---
description: Step 40 — Blog: pulido (teaser home, analytics, E2E) · Petals & Predators
---
# Step 40 — Blog: pulido (teaser home, analytics, E2E)

> **Siguiente:** `/generate-next-steps` (si hay un item `pending` nuevo)

## Objetivo

El blog queda integrado al resto del sitio: teaser **"From the blog"** en el home, evento **`ViewContent`** en las páginas de post (con gating de consentimiento), y E2E del circuito feed → post → categoría → 404.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** el marcador `<!-- home:gift-cards -->` en `src/pages/index.astro` (los teasers de lookbook y gift cards son el patrón), `src/shared/analytics.ts` (gating de consentimiento del step 21/35 y el patrón de `ViewContent` usado en PDP), `src/features/blog/blog.ts` (`listBlogPosts`), los posts seeded del step 39 (slugs en `.wix/seeded.json`), `tests/e2e/` (convención de specs).
- **Docs:** [Track analytics events](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/track-analytics-events#track-analytics-events) (el evento viaja solo en sitio con dominio propio — el futuro step de dominio; en dev se verificará el emit interno).

## Functionality

1. **Teaser en home** — sección "From the blog" justo tras el marcador `<!-- home:gift-cards -->` (patrón de teaser existente): los 3 posts más recientes (`listBlogPosts(3)`) con cover/título/fecha y CTA a `/blog`; **si no hay posts, la sección no se renderiza** (no estado vacío en home). Claves `home.blog.*` en `src/translations.json` + es/it.
2. **Analytics** — `analytics.trackEvent('ViewContent', …)` en `/blog/[slug]` con gating de consentimiento (solo con categoría analytics aceptada); payload mínimo sin PII (usar label = slug del post); nada en feed/categoría.
3. **E2E `tests/e2e/blog.spec.ts`** — assertear solo lo que este repo controla (regla de AGENTS.md): `/blog` → 200 con el título del post más reciente sembrado; `/blog/<slug-seeded>` → 200 con el título en `<h1>`; slug inventado → 404; `/blog/category/<slug-seeded>` → 200 con ≥ 1 post; `/es/blog` → 200 con link nav localizado. Sin asserts de `<title>`/meta tags (los inyecta Wix).
4. **Tradeoffs documentados en la fila 40 del roadmap** — sitemap de Wix no indexa items de blog (mismo tradeoff que `/journal/[slug]`, step 13); comentarios/likes de la app Blog no embebidos en headless (fuera de alcance; decidir si se agregan después).
5. **Release final del módulo** — `npx @wix/cli@latest build` → `npx @wix/cli@latest release`; smoke en producción: `GET /blog`, 1 post, 1 categoría → 200 con contenido.

## Pages / Sections

- `src/pages/index.astro` — sección teaser nueva (backed en el marcador existente).
- Sin rutas nuevas; los posts ya renderizan desde el step 38/39.

## Design

- El teaser replica el lenguaje de los teasers existentes (lookbook/gift cards): imagen + título + categoría + CTA; tokens y transiciones del sistema; responsive y `prefers-reduced-motion` respetados.

## Verificación

- [ ] `npx @wix/cli@latest build` verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde (incl. blog.spec)
- [ ] Home muestra el teaser con 3 posts y CTA a `/blog`; al vaciar el blog la sección desaparece
- [ ] `ViewContent` se emite en post detail SOLO con consentimiento analytics (método step 21/35)
- [ ] Release a producción OK y smoke verde de `/blog`, un post y una categoría
- [ ] Fila 40 con verificaciones + tradeoffs completados en `ROADMAP.md`

## Al terminar

1. Marca el paso 40 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (o el paso que el propietario pida).
