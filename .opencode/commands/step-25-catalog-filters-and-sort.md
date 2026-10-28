---
description: Step 25 — Filtros y ordenación del catálogo · Petals & Predators
---
# Step 25 — Filtros y ordenación del catálogo

> **Siguiente:** `/step-26-cart-coupons` (si aún no existe → `/generate-next-steps`)

## Objetivo

El listado (`/products`) y las páginas de categoría (`/category/[slug]`) ganan orden y filtros manejados por query params: orden por precio (asc/desc), nombre (A–Z), novedad y destacados, más un filtro de disponibilidad, con contador de resultados y estado compartible/recargable.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/product-catalog/` (`categories.ts`, `product-card.astro`, `category-rail.astro`), `src/pages/products/index.astro`, `src/pages/category/[slug].astro`, `src/shared/i18n.ts`, `src/translations.json`, `ROADMAP.md`.
- **Restricción de la API (verificada en `node_modules/@wix/auto_sdk_stores_products-v-3`):** el spec `V3ProductQuerySpec.wql` de `productsV3.queryProducts` **solo** permite `sort` sobre `_createdDate`, `_updatedDate`, `slug` y `visible` (BOTH) y filtros sobre `_id`/`handle` (`*`, sin sort), `options._id` (`$hasAll`/`$hasSome`, sin sort) y los cuatro anteriores. **Precio, nombre y `inventory.availabilityStatus` NO son filtrables ni ordenables server-side** en Products V3. Por eso el orden/filtro de este step se resuelve en el frontmatter de Astro (SSR, sin hidratación) sobre la página ya traída. No hay que inventar un filtro WQL que la API va a rechazar.

## Functionality

1. **Módulo puro — `src/features/product-catalog/catalog-filters.ts`** (sin SDK, testeable sin mocks)
   - Tipos: `export type CatalogSort = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest'`; `export type CatalogAvailability = 'all' | 'in-stock'`; `export interface CatalogQuery { sort: CatalogSort; availability: CatalogAvailability }`; `export interface CatalogItem { _id?: string | null; name?: string | null; slug?: string | null; ribbon?: { name?: string | null } | null; inventory?: { availabilityStatus?: string | null } | null; variantSummary?: { minPriceVariant?: { price?: { priceAfterDiscount?: string | null; actualPrice?: string | null } } | null } | null; actualPriceRange?: { minValue?: { amount?: string | null } | null } | null; _createdDate?: string | Date | null }`.
   - `DEFAULT_CATALOG_QUERY: CatalogQuery = { sort: 'featured', availability: 'all' }`.
   - `parseCatalogQuery(searchParams: URLSearchParams): CatalogQuery` — valida contra whitelists; cualquier valor desconocido cae al default (nunca lanza).
   - `buildCatalogHref(basePath: string, query: CatalogQuery, extras?: { cursor?: string | null }): string` — serializa solo los params no-default (URL limpia) + `cursor` si viene; el `basePath` ya llega localizado (se le pasa `localize('/products')` o `localize('/category/<slug>')`).
   - `isCatalogFiltered(query: CatalogQuery): boolean` — true si algún valor difiere del default (controla el link "Clear").
   - `minPrice(item: CatalogItem): number | null` — `Number(variantSummary.minPriceVariant.price.priceAfterDiscount ?? price.actualPrice)`; `Number.isFinite` si no → `Number(actualPriceRange.minValue.amount)`; si no → `null`.
   - `sortCatalogItems<T extends CatalogItem>(items: T[], sort: CatalogSort): T[]` — copia ordenada: `featured` respeta el orden entrante; `price-asc`/`price-desc` por `minPrice` con `null` al final (y desempate por nombre); `name-asc` `localeCompare` (idioma del sitio); `newest` por `_createdDate` desc (fecha inválida/ausente al final). Nunca muta el array.
   - `filterCatalogItems<T extends CatalogItem>(items: T[], availability: CatalogAvailability): T[]` — `in-stock` deja `inventory.availabilityStatus !== 'OUT_OF_STOCK'`.
2. **Toolbar SSR — `src/features/product-catalog/catalog-toolbar.astro`** (Astro puro, cero JS de framework)
   - Props: `{ query: CatalogQuery; resultCount: number; clearHref: string | null }`.
   - `<form method="get">` con: `<label>` + `<select name="sort">` (5 opciones) y `<select name="availability">` (2 opciones), botón submit (`btn btn-ghost`) con el label de aplicar; al enviarse recarga con los params (funciona sin JS y respeta `prefers-reduced-motion`).
   - Muestra el contador (`shop.results.count`, singular/plural) y, si `clearHref`, un link "Limpiar filtros" (`text-accent hover:underline`).
   - El form **no** incluye `cursor`: cambiar filtros/orden resetea la paginación.
3. **Listado — `src/pages/products/index.astro`** (ruta delgada)
   - Query con más campos: `productsV3.queryProducts({ fields: ['CURRENCY', 'MIN_PRICE_VARIANT', 'DISCOUNT_INFO'] })` (para poder ordenar por precio). Mantener `PAGE_SIZE` y `next/prevCursor` como están.
   - `const query = parseCatalogQuery(Astro.url.searchParams);` → `productList = sortCatalogItems(filterCatalogItems(productList, query.availability), query.sort);` (después del filtro de gift cards existente).
   - Renderizar `<CatalogToolbar query={query} resultCount={productList.length} clearHref={isCatalogFiltered(query) ? localize('/products') : null} />` entre el `CategoryRail` y la grilla.
   - `pageHref(cursor)` debe construir con `buildCatalogHref(localize('/products'), query, { cursor })` para que la paginación conserve filtros.
4. **Categoría — `src/pages/category/[slug].astro`** (mismo tratamiento)
   - `listProductsInCategory` en `src/features/product-catalog/categories.ts` pasa a pedir `fields: ['CURRENCY', 'MIN_PRICE_VARIANT', 'DISCOUNT_INFO']`.
   - Parsear `query`, aplicar `filterCatalogItems` + `sortCatalogItems`, renderizar la toolbar (`clearHref` = `buildCatalogHref(localize('/category/' + category.slug), DEFAULT_CATALOG_QUERY)` cuando haya filtros activos) y preservar filtros en `pageHref` con `buildCatalogHref`.
5. **i18n — `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`**
   - Claves nuevas (namespace `shop.`): `shop.sort.label`, `shop.sort.featured`, `shop.sort.price-asc`, `shop.sort.price-desc`, `shop.sort.name-asc`, `shop.sort.newest`, `shop.filter.availability`, `shop.filter.all`, `shop.filter.in-stock`, `shop.filter.apply`, `shop.filter.clear`, `shop.results.count` (`{{count}} plants`), `shop.results.count-one` (`{{count}} plant`). Paridad exacta de conteo en `en`/`es`/`it`.
6. **Tests — `tests/features/product-catalog/catalog-filters.test.ts`**
   - `parseCatalogQuery`: default sin params; valores válidos; valores basura → default.
   - `buildCatalogHref`: omite defaults, añade no-defaults, propaga `cursor`, no duplica `?`.
   - `sortCatalogItems`: `price-asc`/`price-desc` ordenan con `minPrice` y dejan los `null` al final sin mutar el input; `name-asc` ordena alfabéticamente; `newest` ordena por fecha; `featured` preserva el orden.
   - `filterCatalogItems`: `in-stock` excluye `OUT_OF_STOCK`, conserva los que no traen `inventory`.

## Pages / Sections

- `src/pages/products/index.astro` — grilla completa con toolbar de orden/filtro, contador y paginación que conserva los params.
- `src/pages/category/[slug].astro` — igual, acotado a la categoría.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- La toolbar no usa islas React: `<select>`/`<button>` nativos, foco visible (`focus-visible:outline-accent`), un solo renglón en desktop y apilada en móvil.

## Wix wiring

- `productsV3.queryProducts` / `listProductsInCategory` (`@wix/stores`) en runtime, ahora con `fields: ['CURRENCY', 'MIN_PRICE_VARIANT', 'DISCOUNT_INFO']`. No pedir `MIN_PRICE_VARIANT` en el PDP (ya usa `actualPriceRange`) si no hace falta.
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).
- Tradeoff documentado en el step: el orden por precio/nombre es client-side sobre la página de 24; con un catálogo grande habría que migrar a `searchProducts`/aggregations. Anotarlo en `ROADMAP.md` al cerrar.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`catalog-filters`)
- [ ] `wix dev`: `GET /products` → 200 con la toolbar; `GET /products?sort=price-asc` → 200 y precios ascendentes en el HTML; `GET /products?availability=in-stock` → 200 sin productos `OUT_OF_STOCK`
- [ ] `GET /category/<slug>?sort=name-asc&availability=in-stock` → 200, contador correcto y link "Limpiar filtros"
- [ ] La paginación conserva quirks: `nextHref`/`prevHref` incluyen `sort`/`availability` (inspeccionar el HTML cuando haya más de 24 items)
- [ ] `sort`/`availability` inválidos (`?sort=__x`) caen al default sin error 500
- [ ] Claves `shop.*` presentes en `en`/`es`/`it` con el mismo conteo y la página se localiza (`/es/products?sort=price-asc`)

## Al terminar

1. Marca el paso 25 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-26-cart-coupons` (o `/generate-next-steps`).

## Resultado

orden (price asc/desc, name A–Z, newest, featured) + filtro de disponibilidad en `/products` y `/category/[slug]`, estado en query params, contador y "limpiar". Feature `product-catalog`: `catalog-filters.ts` (módulo puro: `parseCatalogQuery`, `buildCatalogHref`, `isCatalogFiltered`, `minPrice`, `sortCatalogItems<T extends CatalogItem>`, `filterCatalogItems<T>`; `CatalogItem` es un contrato estructural mínimo) + `catalog-toolbar.astro` (form GET con dos `<select>` + submit, contador plural `shop.results.count[-one]`, link "limpiar" opcional) cableado en ambas páginas; `fields: ['CURRENCY','MIN_PRICE_VARIANT','DISCOUNT_INFO']` en `queryProducts` (products page y `listProductsInCategory`). **Desviación del step (shape real del SDK):** `variantSummary.minPriceVariant.price.priceAfterDiscount`/`actualPrice` son `FixedMonetaryAmount` (`{amount?, formattedAmount?}`), **no** strings — `minPrice` lee `.amount` y cae a `actualPriceRange.minValue.amount`. **Cambio de tipos:** `ProductPage.items` pasó de `any[]` a `V3Product[]` y se eliminó la interfaz duplicada `CardProduct` de `products/[slug].astro` (ahora `related: V3Product[]`). 13 claves `shop.*` nuevas → 388 claves por idioma (paridad en/es/it verificada). **Verificado:** `npm run check` 0 errores · `npm test` 65/65 (17 nuevos en `tests/features/product-catalog/catalog-filters.test.ts`) · `npx @wix/cli@latest build` verde · `npm run test:e2e` 9/9 · curl en `astro dev` (parseo del grid por `<h3>`/precio de tarjeta): `/products?sort=price-asc` → 18,24,24,32,45 y `?sort=price-desc` invertido; `name-asc` alfabético; `featured`/params basura → orden original y sin link "limpiar"; `availability=in-stock` con link "limpiar"; `/category/carnivorous?sort=price-desc` invertido con `clearHref=/category/carnivorous`; `/es/products?sort=price-asc` con `clearHref=/es/products` localizado. **Verificado solo por unit (sin >24 productos en el seed):** propagación de `cursor` en `buildCatalogHref` y paginación con filtros. **Segunda desviación:** `sortCatalogItems` lleva un 3.º param opcional `locale` (las páginas pasan `currentLanguage()`) para que `name-asc` use el idioma del sitio — la firma de 2 args del step no podía cumplir "idioma del sitio". **Tradeoff:** el orden por precio/nombre es client-side sobre la página de 24 elementos; con un catálogo grande habría que migrar a `searchProducts`/aggregations
