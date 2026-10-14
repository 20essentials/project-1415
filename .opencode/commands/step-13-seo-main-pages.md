---
description: Step 13 — SEO main pages + robots/sitemap (dashboard Wix) · Petals & Predators
---
# Step 13 — SEO main pages + robots/sitemap

> **Siguiente:** `/step-14-seo-item-pages`

## Objetivo

Que las **main pages** (URL fija) reciban title, meta description, canonical, social tags
y directives desde el dashboard de Wix (inyección automática del middleware de Astro),
retirando del layout los tags hardcodeados que compiten, y dejando que Wix sea quien sirva
`robots.txt` y `sitemap.xml`.

## Contexto

- **Docs (fuente de verdad):**
  - [About SEO support](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/about-seo-support) — qué inyecta Wix solo con código y qué debemos renderizar.
  - [Manage SEO for main pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/manage-seo-for-main-pages) — flujo de 4 pasos (quitar tags → publicar → configurar → verificar).
  - [Add SEO support to item pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/add-seo-support-to-item-pages) — se ejecuta en el step 14.
- **Decisión adoptada:** *Wix puro* — el dashboard manda. Consecuencia aceptada: en `/es` e `/it` las main pages **no** tienen title ni description propios (Wix cae al patrón por path y omite la description). El resto de idiomas vive en el contenido, no en los metadatos.
- **Estado actual (revisado):**
  - `src/layouts/layout.astro` hardcodea: `<title>` (L47), `<meta name="description">` (L48), `<meta name="robots">` (L49), `<link rel="canonical">` + `hreflang` (L60-70), OG/Twitter (L73-94), `<link rel="sitemap">` (L56). Todo sale de los props `title`/`description` de `interface Props`.
  - Las 11 páginas pasan `title`/`description`: `index`, `products/index`, `journal/index`, `about`, `contact`, `cart`*, `account`*, `thank-you`*, `category/[slug]`, `products/[slug]`, `journal/[slug]` (* también `noindex`).
  - Rutas propias: `src/pages/robots.txt.ts` (Allow /, Disallow /cart, /thank-you) y `src/pages/sitemap.xml.ts` (entries locales + productos + categorías + guías).
  - `astro.config.mjs` → `wix({ robots: { enable: false }, essentials: true, translations: true })`. La opción es `robots?: boolean | { enable?: boolean }` (verificado en `@wix/astro` 2.75.2); hoy **deshabilita** el `robots.txt` de Wix.
  - `output: 'server'` y `@wix/astro-pages` presentes → registra cada ruta en el page registry (`/_wix/pages.json`) al hacer build+release.
  - `@wix/seo` **no** instalado (step 14).
- **Regla de la guía:** probar **solo en el sitio publicado** — `wix dev` local **no** ejecuta la inyección de SEO.

## Functionality

### A. Quitar los tags que el dashboard posee del `<head>`

1. Eliminar de `src/layouts/layout.astro`: `<title>`, `<meta name="description">`, `<link rel="canonical">`,
   todos los `<meta property="og:*">` y `<meta name="twitter:*">`, y el bloque de `<link rel="alternate" hreflang>`
   (incluido `x-default`).
2. **No tocar** los tags no-SEO: `charset`, `viewport`, `theme-color`, `link rel="icon"/"apple-touch-icon"/"manifest"`,
   preconnect + stylesheet de Google Fonts, el `<script>` que añade la clase `js`, y `<slot name="head">`.
3. **`meta robots`:** dejar de emitir `index, follow` por página (lo decide el dashboard). Emitir **solo** cuando
   `Astro.props.noindex === true` → `<meta name="robots" content="noindex, follow">`. Lo siguen necesitando
   `/cart`, `/account`, `/thank-you` y el 404 de `/journal/[slug]`.
4. **`meta robots` + `hreflang`:** retirar el `hreflang` completo (parte de *Wix puro*). **Tradeoff:** la guía de Wix
   no gestiona `hreflang`, así que Wix **no** lo reemplaza — al retirarlo perdemos las declaraciones
   `en/es/it`. Si al ejecutar preferimos conservarlo por SEO técnico multilingüe, son ~8 líneas en el layout;
   anotar la decisión en `ROADMAP.md`.
5. El import de `ogImage` (`src/data/imagenes`) queda sin uso en el layout → retirarlo si nada más lo usa
   (step 14 puede reutilizarlo para `og:image` del journal).

### B. Sin competencia en las páginas

6. Quitar los props `title`/`description` de `interface Props` y de `Astro.props` en `layout.astro`.
7. Actualizar las **11 páginas** para que dejen de pasar `title`/`description` (mantener `noindex` y `header`).

### C. Wix sirve `robots.txt` y `sitemap.xml`

8. `astro.config.mjs`: eliminar `robots: { enable: false }` (o poner `robots: true`) para que sirva el de Wix.
9. Borrar `src/pages/robots.txt.ts` — con dos rutas Astro avisa de colisión y sirve la nuestra.
10. Reproducir en **SEO & GEO → Robots.txt Editor** del dashboard las reglas actuales
    (`Disallow: /cart`, `Disallow: /thank-you`, `Sitemap: https://<dominio>/sitemap.xml`).
11. Borrar `src/pages/sitemap.xml.ts`. Wix sirve `/sitemap.xml` como **sitemap index** (`pages-sitemap.xml`
    + un sitemap por solución de negocio). **Tradeoff:** el index de Wix **no** incluye las guías de
    `/journal/[slug]` (colección CMS, sin tipo soportado) ni el `/lookbook` (futuro). Products/categories
    entran recién en el step 14. Anotar en `ROADMAP.md` si hace falta un sitemap propio para CMS.

### D. Publicar y configurar (orden importa)

12. **Primero publicar:** `npx @wix/cli@latest build` y luego `npx @wix/cli@latest release`.
    Sin publicar, las rutas no aparecen en el dashboard.
13. **SEO & GEO → SEO Settings → Main Pages:**
    - *Customize defaults* → patrón `{Page Name} | {Site Name}` y description por defecto.
    - *Edit by page* → ajustar Home, Products, Journal, About, Contact (title <60 chars, description 150-160),
      e indexability **on**. `Cart`, `Account`, `Thank You` se dejan como `noindex` (emiten su meta en código).
14. **Verificar en el sitio publicado** (nunca en `wix dev`).

> **Ventana de transición:** este step deja las **item pages** (products, category, journal) sin `<title>`
> hasta que se ejecute el step 14. Ejecutar los dos seguidos.

## Pages / Sections

- `src/layouts/layout.astro` — head limpio + `meta robots` solo si `noindex`.
- `src/pages/index.astro`, `products/index.astro`, `journal/index.astro`, `about.astro`, `contact.astro`,
  `cart.astro`, `account.astro`, `thank-you.astro`, `category/[slug].astro`, `products/[slug].astro`,
  `journal/[slug].astro` — sin props `title`/`description`.
- `src/pages/robots.txt.ts` + `src/pages/sitemap.xml.ts` — eliminadas.
- `astro.config.mjs` — `robots` reactivado.

## Design

- Sin cambios visuales: solo se edita el `<head>`. No tocar tokens, motion ni markup de cuerpo.

## Wix wiring

- Dashboard: **SEO & GEO → SEO Settings → Main Pages** (defaults + por página) y **Robots.txt Editor**.
- Page registry servido en `/_wix/pages.json` (lo llena `@wix/astro-pages` al publicar).
- `robots.txt` y `sitemap.xml` los sirve Wix (`WixAstroConfig.robots` default `true`).
- **Probar solo en el sitio publicado.**

## Verificación

- [ ] `npx @wix/cli@latest build` en verde (sin warning de colisión de router)
- [ ] Tras `npx @wix/cli@latest release`: SEO Settings → Main Pages muestra todas las rutas publicadas
- [ ] `curl -s https://<dominio>/about | grep 'wix-seo-tag'` devuelve `<title>`, `<meta name="description">`,
      `<link rel="canonical">` y tags OG/Twitter
- [ ] Cambio una description en el dashboard → vuelvo a hacer `curl` y aparece reflejada (ruta poco tráfico, ver tip de edge-cache)
- [ ] `curl -s https://<dominio>/robots.txt` sirve el editado desde el dashboard
- [ ] `curl -s https://<dominio>/sitemap.xml` responde con el sitemap index de Wix
- [ ] Ninguna main page tiene doble `<title>` (grep del HTML renderizado)
- [ ] `/cart`, `/account`, `/thank-you` y el 404 de journal siguen con `noindex, follow`

## Al terminar

1. Marca el paso 13 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-14-seo-item-pages`.
