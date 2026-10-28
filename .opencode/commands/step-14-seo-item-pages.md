---
description: Step 14 — SEO item pages con @wix/seo · Petals & Predators
---
# Step 14 — SEO item pages con @wix/seo

> **Siguiente:** `/step-15-seasonal-lookbook`

## Objetivo

Que las **item pages** (producto y categoría) rendericen los tags que Wix resuelve desde el
dashboard con `@wix/seo` y queden registradas en el page registry — el que alimenta el sitemap y
el editor SEO del dashboard. Cierra además la ventana del step 13 (páginas de item sin `<title>`).

## Contexto

- **Doc (fuente de verdad):** [Add SEO support to item pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/add-seo-support-to-item-pages) — registro de rutas + render de tags.
- **Dependencias (verificado en este repo):** `@wix/essentials` está en **1.0.15** (≥ 1.0.10 ✓);
  `@wix/seo` **no está instalado** → `npm install @wix/seo` (el `.npmrc` ya aplica `legacy-peer-deps`).
- **Runtime:** `output: 'server'` ya está en `astro.config.mjs` — estas rutas **no** deben usar
  `prerender = true` ni `getStaticPaths()` (las llamadas de SEO dependen del request).
- **Valores exactos de `WIX_APPS` (verificados con Node en este repo):**
  - `WIX_APPS.checkoutAndOrders.productPageMetadata` → `{ pageIdentifier: 'wix.stores.sub_pages.product', identifiers: { handle: 'STORES.PRODUCT.SLUG' } }`
  - `WIX_APPS.checkoutAndOrders.categoryPageMetadata` → `{ pageIdentifier: 'wix.stores.sub_pages.category', identifiers: { collection: 'STORES.CATEGORY.SLUG' } }`
  - `WIX_APPS.data` **solo** tiene `id`/`name` → no sirve para registrar items del CMS.
  - Para Stores hay que usar `checkoutAndOrders`, **no** `WIX_APPS.stores` (ese `id` es el catalogReference).
- **Estado actual:**
  - `src/pages/products/[slug].astro:12` ya exporta `wixMetadata` pero con **valores hardcodeados**
    (`'1380b703-ce81-ff05-f115-39571d94dfcd'`, `'wix.stores.sub_pages.product'`, `'STORES.PRODUCT.SLUG'`)
    → hay que migrarlo a `WIX_APPS` sin cambiar el resultado.
  - `src/pages/category/[slug].astro` **no** tiene `wixMetadata`.
  - `src/pages/journal/[slug].astro` es una colección **CMS** → tipo no soportado por `WIX_APPS`/`@wix/seo`.
  - El `<slot name="head">` del layout existe y es por donde se empujarán los tags propios del journal.
- **i18n (step 12):** tras el middleware de multilingüe, `Astro.url.href` puede usar `http:` y perder el
  segmento de idioma → leer `x-wix-forwarded-url` y caer a `Astro.url.href` si no está o no es `http(s)` válido.
- **Navegación:** el sitio hace full reload, así que `<SEO.Tags>` basta; `SEO.Root` + `SEO.UpdateTagsTrigger`
  solo aplicarían a un flujo de navegación en cliente (no usar por ahora).

## Functionality

### A. Layout

1. Añadir `<slot name="seo-tags" />` al `<head>` de `src/layouts/layout.astro` (junto a `<slot name="head">`),
   **sin** `<title>` ni `<meta name="description">` de fallback dentro del slot: los empuja el step 13 y se
   duplicarían. Las main pages dejan el slot vacío y siguen recibiendo la inyección automática.

### B. Registrar las rutas (`wixMetadata`)

2. **`src/pages/products/[slug].astro`** — reemplazar el export hardcodeado por:

   ```js
   import { WIX_APPS } from '@wix/essentials';

   export const wixMetadata = {
     appDefId: WIX_APPS.checkoutAndOrders.id,
     pageIdentifier: WIX_APPS.checkoutAndOrders.productPageMetadata.pageIdentifier,
     identifiers: { slug: WIX_APPS.checkoutAndOrders.productPageMetadata.identifiers.handle },
   };
   ```

   Referenciar `WIX_APPS` **dentro** del objeto: es un export a nivel de módulo, así que no vale leerlo
   antes en una `const` del cuerpo (rompe el registro y vacía `/_wix/pages.json` entero).

3. **`src/pages/category/[slug].astro`** — mismo patrón con `categoryPageMetadata` y
   `identifiers: { slug: WIX_APPS.checkoutAndOrders.categoryPageMetadata.identifiers.collection }`.

4. **La key dentro de `identifiers` es el parámetro del archivo de ruta, no el token de Wix.** Ambas rutas se
   llaman `[slug].astro` → key `slug`, aunque el token de Wix sea `handle`/`collection`.

### C. Fetch + render de los tags

5. Importar en el frontmatter de **ambas** rutas:

   ```js
   import { SEO } from '@wix/seo/components';
   import { loadSEOTagsServiceConfig } from '@wix/seo/services';
   import { seoTags } from '@wix/seo';
   ```

6. Definir `pageUrl` con el header de Wix (antes de cualquier `loadSEOTagsServiceConfig`):

   ```js
   const forwardedUrl = Astro.request.headers.get('x-wix-forwarded-url');
   const pageUrl =
     forwardedUrl && URL.canParse(forwardedUrl) && /^https?:$/.test(new URL(forwardedUrl).protocol)
       ? forwardedUrl
       : Astro.url.href;
   ```

7. **PDP (`products/[slug].astro`)** — correr en paralelo con el fetch del producto (`Promise.all`) para no
   añadir un round trip: `itemType: seoTags.ItemType.STORES_PRODUCT`,
   `itemData: { slug: Astro.params.slug! }`.
8. **Categoría (`category/[slug].astro`)** — solo la config (no hay item que traer):
   `itemType: seoTags.ItemType.STORES_CATEGORY`, `itemData: { slug: Astro.params.collection ?? Astro.params.slug! }`.
9. Como **primer hijo** de `<Layout>`: `<SEO.Tags seoTagsServiceConfig={seoTagsServiceConfig} slot="seo-tags" />`.
10. Mantener el retorno `404` existente **antes** de pedir los tags (producto/categoría inexistente).

### D. Journal (CMS) — sin tipo soportado

11. `src/pages/journal/[slug].astro` no se registra en el registry (`WIX_APPS.data` no expone metadatas de CMS).
    Compensa los tags del layout retirando en el step 13 renderizándolos **desde el item**: empujar por
    `<slot name="head">` un `<title>`, un `<meta name="description">` con `guide.title`/`guide.intro` y,
    opcional, `<script type="application/ld+json">` con `Article` (autor, fecha `createdDate`, `mainEntityOfPage`).
    El `noindex={!guide}` actual se mantiene fuera del slot.

### E. Structured data

12. En productos, Wix ya genera y edita el `Product` JSON-LD desde el dashboard → **no duplicarlo**.
    JSON-LD propio solo donde el dashboard no cubre (journal → `Article`).

## Pages / Sections

- `src/layouts/layout.astro` — `<slot name="seo-tags" />` en el head.
- `src/pages/products/[slug].astro` — `wixMetadata` desde `WIX_APPS` + `<SEO.Tags>`.
- `src/pages/category/[slug].astro` — `wixMetadata` nuevo + `<SEO.Tags>`.
- `src/pages/journal/[slug].astro` — title/description propios por `<slot name="head">` + `Article` JSON-LD.

## Design

- Sin cambios visuales: solo `<head>`. El markup y los tokens del body quedan intactos.

## Wix wiring

- `@wix/seo` (`loadSEOTagsServiceConfig`, `<SEO.Tags>`, `seoTags.ItemType`) + `WIX_APPS` de `@wix/essentials`.
- El registry `/_wix/pages.json` debe listar las rutas registradas: alimenta el sitemap y hace que el dashboard
  muestre "Product"/"Category" como tipos de página editables.
- Los **valores** de title/description se editan en **SEO & GEO → SEO Settings** (por tipo y por item); el código
  solo renderiza lo resuelto.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npx @wix/cli@latest release` y `curl -s https://<dominio>/products/<slug-real> | grep -o '<title[^>]*>[^<]*</title>'`
      → devuelve el **título real del producto**, no un fallback genérico
- [ ] Ídem para `https://<dominio>/category/<slug-real>`
- [ ] `curl -s https://<dominio>/_wix/pages.json` lista `products/[slug]` y `category/[slug]` (si solo aparecen
      las páginas estáticas, revisar el `wixMetadata`)
- [ ] `curl -s .../journal/<slug> | grep 'wix-seo-tag'` → sin tags de Wix (esperado: CMS) pero con `<title>`
      propio y sin duplicados
- [ ] Cambio un title en el dashboard para el tipo "Product" → recargo la PDP publicada y aparece
- [ ] Los títulos responden al idioma activo y no hay dobles `<title>` en ninguna página

## Al terminar

1. Marca el paso 14 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-15-seasonal-lookbook`.

## Resultado

**Docs:** [Add SEO support to item pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/add-seo-support-to-item-pages#add-seo-support-to-item-pages) · `<slot name="seo-tags">` + `wixMetadata` desde `WIX_APPS` (`checkoutAndOrders`, no `stores`) en `/products/[slug]` y `/category/[slug]` + `<SEO.Tags>` con `loadSEOTagsServiceConfig` (`pageUrl` desde `x-wix-forwarded-url` con fallback a `Astro.url.href`; fetch de producto en paralelo); journal (CMS, sin tipo Wix) auto-renderiza title/description/`og:image` + `Article` JSON-LD vía `<slot name="head">`. Publicado. **Gotcha:** `@wix/seo` trae `@wix/headless-seo` que importa `@wix/services-manager` como *peer* de `@wix/services-manager-react`; con `legacy-peer-deps=true` no se instala solo → añadido `@wix/services-manager` a deps. **Tradeoff aceptado:** Wix sigue inyectando además un `<title>` genérico por path (`Products`/`Category`/`Journal`) en el item page; el primer `<title>` (el de `SEO.Tags`/nuestro) gana en el navegador (sin off-switch desde código). **Follow-up (descripción):** el patrón por defecto de Wix para `STORES_PRODUCT`/`STORES_CATEGORY` no trae `<meta name="description">` y `{{product.description}}` resuelve vacío → se emite la description en el `<slot name="head">` (`toMetaDescription` en `src/utils/seo.ts`): product usa su `plainDescription`/rich, category cae a `category.meta-description` (los productos/categorías no tienen description en Wix). Publicado y verificado
