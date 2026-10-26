---
description: Step 38 — Wix Blog: app + feature blog (feed, categorías, post) · Petals & Predators
---
# Step 38 — Wix Blog: app + feature blog (feed, categorías, post)

> **Siguiente:** `/step-39-blog-contenido-draft-posts`

## Objetivo

La app **Wix Blog** queda instalada y el sitio renderiza su contenido headless: feature nueva `src/features/blog/` con data-access sobre el SDK `@wix/blog` y rutas `/blog`, `/blog/[slug]` y `/blog/category/[slug]` integradas al nav y al i18n. El **Journal se mantiene como está** (CMS `care-guides`): blog es un canal de contenido adicional.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/journal/journal.ts` (patrón data-access a imitar: `auth.elevate` + `try/catch`→`[]`), `src/pages/journal/index.astro` y `src/pages/journal/[slug].astro` (páginas delgadas + `<Fragment slot="head">` + JSON-LD), `src/shared/ricos.ts` (`renderRicos`), `src/shared/site.ts` (arrays `site.nav` / `site.navPrimary`), `src/app/header.astro`, `src/shared/wix-image.ts` (`resolveWixImageUrl`), `src/pages/products/[slug].astro:26-28` (patrón `SEO.Tags` con `WIX_APPS`).
- **App (dato verificado, no adivinar):** `WIX_APPS.blogs.id = '14bcded7-0066-7c35-14d7-466cb3f09103'` — constante tipada de `@wix/essentials` (`build/wix-apps.d.ts`). Trae además el metadata para el patrón SEO del step 14: `postPageMetadata.pageIdentifier: 'wix.blog.sub_pages.post'` (identifiers.slug `BLOG.POST.SLUG`) y `categoryPageMetadata.pageIdentifier: 'wix.blog.sub_pages.category'` (`BLOG.CATEGORY.SLUG`). La app **no está instalada aún** (`.wix/seeded.json` no tiene bloque `blog`).
- **Docs (leer los artículos completos antes de escribir llamadas):** [About the Posts and Stats API](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/introduction) · [Query posts](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/query-posts) · [List posts](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/list-posts) · [Get post](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/get-post) · [Posts: Supported Filters and Sorting](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/filter-and-sort) · [About the Categories API](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/introduction) · [Query categories](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/query-categories) · [Add SEO support to item pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/add-seo-support-to-item-pages#add-seo-support-to-item-pages)
- **Gotchas confirmados en docs (re-verificar contra el método real antes de codificar):** en posts `slug` solo filtra con `$hasSome`/`$hasAll` (no `$eq`); `categoryIds` solo `$hasSome`/`$hasAll`; el sort default de Query Posts es `firstPublishedDate` DESC con pinned primero; el de Query Categories es `displayPosition`; paging default 50, máx 100 por request.

## Functionality

1. **Instalar la app Wix Blog vía REST** (patrón del step 0 · propagación con backoff 1s/2s/4s; una respuesta tipo "ya instalada" se trata como OK):
   ```bash
   SITE_ID=<siteId de wix.config.json>
   TOKEN=$(npx @wix/cli@latest token --site "$SITE_ID")
   curl -sS -X POST "https://www.wixapis.com/apps-installer-service/v1/app-instance/install" \
     -H "Authorization: Bearer $TOKEN" -H "wix-site-id: $SITE_ID" -H "Content-Type: application/json" \
     -d '{"tenant":{"tenantType":"SITE","id":"'"$SITE_ID"'"},"appInstance":{"appDefId":"14bcded7-0066-7c35-14d7-466cb3f09103","enabled":true}}'
   ```
   200 = OK. Registrar en `.wix/seeded.json` el bloque `blog: { appDefId, instanceId }` (nunca importarlo en rutas `.astro`).
2. **Dependencia:** `npm install @wix/blog` (npm plano; `.npmrc` aplica `legacy-peer-deps` + cooldown 1 día). Antes de escribir el mapping, verificar en `node_modules/@wix/blog` (namespaces `posts`, `categories`, `tags`) la forma real del builder (`posts.queryPosts()`, `.hasSome(...)`, `.find()` → `items`) y los fieldsets disponibles (`URL`, `METRICS`, `CONTENT_TEXT`, `SEO`) — no asumir el shape.
3. **`src/features/blog/blog.ts`** — data-access server-side (sin barrels, exports concretos):
   - `export interface BlogPost` — `{ id, title, slug, excerpt, hero: {url, width, height} | null, firstPublishedDate: Date | null, minutesToRead: number | null, featured, pinned, categories: string[], language }`; labels de categorías resueltos en el mapping; hero con `resolveWixImageUrl(cover, w, h)`.
   - `export async function listBlogPosts(limit = 50): Promise<BlogPost[]>` — `posts.queryPosts()` (sort default de la API: pinned primero, `firstPublishedDate` DESC) + fieldsets mínimos verificados en docs; `auth.elevate` + `try/catch` → `console.error` + `[]` (patrón journal).
   - `export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null>` — `hasSome('slug', [slug])` + limit 1 (**nunca** `eq('slug', …)`, no existe en la tabla de filtros); slug vacío → `null` sin llamar.
   - `export async function listBlogCategories(): Promise<BlogCategory[]>` — `categories.queryCategories` con fieldsets `URL` (label, slug, postCount); `try/catch` → `[]`.
   - `export async function getBlogCategoryBySlug(slug: string)` — con el operador que la tabla de filtros de categories admita para `slug`; si no hay match directo, traer todas con `listBlogCategories()` y filtrar en código.
   - `export async function relatedPosts(categoryIds: string[], excludeId: string, limit = 3): Promise<BlogPost[]>` — `queryPosts().hasSome('categoryIds', categoryIds)`, excluyendo `excludeId` en código; fallo o vacío → `[]`.
4. **Rutas delgadas** (componen la feature, como journal):
   - **`src/pages/blog/index.astro`** — feed: post destacado (pinned o featured; el más reciente si no hay) en bloque grande + grid del resto (cover, fecha localizada, categoría, título, excerpt, minutos de lectura); empty state con copy i18n + CTA a `/journal` solo si no hay posts.
   - **`src/pages/blog/[slug].astro`** — detalle: hero de portada full-bleed, `<h1>`, fila meta (fecha localizada + `blog.minRead` + chips de categoría enlazando a `/blog/category/<slug>`), cuerpo vía `renderRicos` (inyección `set:html` + `<style is:global>`, igual que journal-slug), related posts (≤3, solo si hay), breadcrumb, `404` + `noindex` si el slug no existe (patrón journal-slug).
   - **`src/pages/blog/category/[slug].astro`** — feed filtrado por categoría (grid, sin hero), título con el label de la categoría, 404 si la categoría no existe.
   - **SEO item pages** (ambas rutas `[slug]`): `SEO.Tags` con `loadSEOTagsServiceConfig({ pageUrl })` + `appDefId: WIX_APPS.blogs.id` + `postPageMetadata` / `categoryPageMetadata` — clon del patrón ya probado en `products/[slug].astro` (con `x-wix-forwarded-url` y fallback `Astro.url.href`). **Si en runtime el patrón no entrega tags para blog**, caer al head manual estilo journal (`title` + description + `og:image` + `Article` JSON-LD) y anotar la desviación en la fila 38 del roadmap. La página index no pisa metas (tradeoff del step 13).
5. **Nav** — `src/shared/site.ts`: en `site.navPrimary` reemplazar el ancla `/#care` por `/blog` (desktop se mantiene en 6 links, medidos en el step 17); añadir `/blog` a `site.nav` (menú móvil). El label nuevo `nav.blog` en `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`; header y footer lo consumen vía `t('nav.blog')`.
6. **i18n `blog.*`** en `src/translations.json` + paridad exacta es/it (`.wix/multilingual/translations/{es,it}.json`): título del feed, intro, empty state + CTA a journal, `blog.minRead` / `blog.minRead-one` (plurales, convención `count-one` como `reviews.count`), "In {{category}}" (token con el label real de la categoría), "Related posts", "All posts", breadcrumb "Blog", 404. Idioma del request vía `i18n.getLanguage()` (patrón de los steps 12/36).
7. **Tests `tests/features/blog/blog.test.ts`** — `vi.mock('@wix/blog')` (y, si hace falta, `@wix/essentials`): mapping DTO completo (cover `wix:image://` → URL, `firstPublishedDate` string → `Date`, labels de categorías), `listBlogPosts` error → `[]`, `getBlogPostBySlug` invoca `hasSome('slug', …)` (assertear args del mock) y slug vacío → `null` sin llamadas, `relatedPosts` excluye el post actual, `listBlogCategories` error → `[]`. Reset de memoización con `vi.resetModules` si el módulo memoiza.

## Pages / Sections

- `src/pages/blog/index.astro` — feed de posts (destacado + grid + empty state).
- `src/pages/blog/[slug].astro` — post completo (hero, meta, body rich, related), 404 + `noindex`.
- `src/pages/blog/category/[slug].astro` — feed por categoría, 404.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Cards al nivel de `ProductCard`/journal (spacings canónicos Tailwind, sin clases `[...]`; transiciones 0.2s `ease-fluid`); responsive 375/768/1024/1280; `prefers-reduced-motion` respetado; el cuerpo del post usa el mismo lenguaje visual que `journal-body` para coherencia.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (tests de blog incluidos)
- [ ] `npm run test:e2e` no rompe (9/9)
- [ ] `wix dev`: `GET /blog` → 200 (empty state si aún no hay posts); `GET /blog/<slug-inexistente>` → 404 con `noindex`; `GET /blog/category/<c>` → 200 / 404 según exista
- [ ] `wix dev`: `GET /es/blog` y `GET /it/blog` → 200 con labels y links localizados
- [ ] `navPrimary` en 1280–1366px sin wrapping (Playwright: 0 labels a 2 líneas, método del step 17)
- [ ] Opcional: crear 1 post de prueba desde el dashboard de Wix Blog y verificar el render end-to-end en dev

## Al terminar

1. Marca el paso 38 como `✅ done` en `ROADMAP.md` (con verificaciones reales y tradeoffs en la fila).
2. Siguiente: `/step-39-blog-contenido-draft-posts`.
