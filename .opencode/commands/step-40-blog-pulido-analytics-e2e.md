---
description: Step 40 — Blog: pulido (teaser home, analytics, E2E) · Petals & Predators
---
# Step 40 — Blog: pulido (teaser home, analytics, E2E)

> **Siguiente:** `/step-41-blog-traduccion-posts-es-it` (documentación retroactiva — ya ejecutado)

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
- [ ] Verificaciones + tradeoffs en la sección `## Resultado` de este archivo (fila 40 del ROADMAP corta, ver AGENTS.md)

## Al terminar

1. Marca el paso 40 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (o el paso que el propietario pida).

## Resultado

**Teaser home:** sección condicional `blogTeaser.length > 0` tras `<!-- home:gift-cards -->` en `src/pages/index.astro` — los 3 posts más recientes (`listBlogPosts(3)`) en grilla 1/2/3 columnas (cover aspect-video + categoría + título H3 + fecha `Intl.DateTimeFormat` + min-read con claves PLURALES existentes `blog.min-read[-one]`, CTA "All posts" a `/blog`, sin estado vacío); clave nueva `home.from-blog` en en/es/it (503 claves c/u, el resto de copy reutiliza `blog.*` del step 38) · **Analytics:** `AnalyticsView event="ViewContent"` en `/blog/[slug]` con payload sin PII (`origin: 'Blog Post'`, `label = post.slug`, `name = post.title`), emitido solo con aceptación analytics del step 21/35 (patrón `hasAnalyticsConsent` de `src/shared/analytics.ts`); nada en feed/categoría · **E2E `tests/e2e/blog.spec.ts`** (5 tests, asserts solo de lo que controla el repo): `/blog` 200 + título sembrado y link `/blog/how-flytraps-…`, teaser home visible con eyebrow "From the blog" + CTA href `/blog`, `/blog/<slug>` con `<h1>` + `<h2> "The rule of two touches"` + `figure img` visible, slug inventado → 404 + copy `not-found`, `/blog/category/stories` con sus 2 posts, `/es/blog` `html[lang="es"]` + link `/es/blog` localizado · **Bug del propio step corregido:** el CTA apuntaba a la clave inexistente `home.all-posts` (la correcta es `blog.all-posts`) — `npm run check` lo dejó pasar literal, lo atrapó el E2E · **Tradeoffs:** el sitemap de Wix no indexa items de blog (mismo que `/journal/[slug]`, step 13); comentarios/likes de la app Blog no embebidos en headless (fuera de alcance) · **Release:** `npx @wix/cli@latest` bloqueado por Node 22 (mín. 24.18.0) pero el binario local `node_modules/.bin/wix` (1.1.258) sí sirve — `wix build` verde 46s y **`wix release` publicado** en https://petals-d960960gm-0609.wix-site-host.com · **Smoke producción:** `/blog`, `/blog/how-flytraps-actually-catch-their-prey` y `/blog/category/stories` → 200 · **Verificado:** `npm run check` 0 errores (141 files) · `npm test` 176/176 · `npx astro build` verde · `npm run test:e2e` 28/28 (23 previos + 5 de blog)
