---
description: Step 28 — Favoritos (wishlist) · Petals & Predators
---
# Step 28 — Favoritos (wishlist)

> **Siguiente:** `/step-29-member-profile` (si aún no existe → `/generate-next-steps`)

## Objetivo

Un miembro logueado guarda productos en una lista de favoritos (corazón en la card del catálogo y en el PDP), los ve en `/account/wishlist` y puede quitarlos. El visitante anónimo ve el corazón que lo invita a iniciar sesión.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/product-catalog/` (`product-card.astro`, `product-purchase.tsx`), `src/pages/products/[slug].astro`, `src/pages/account.astro` + `src/pages/account/orders.astro` (patrón `getCurrentMember` + 302 a login), `src/features/account/member-avatar.ts`, `src/pages/api/reviews.ts` (patrón de API route), `src/translations.json`, `.wix/seeded.json`, `ROADMAP.md`.
- **API (verificar en `node_modules/@wix/data/build/es/index.d.mts`):** `@wix/data` exporta `items` (data items CRUD: `insert`, `query`, `remove`, …) sobre las colecciones del CMS y `collections` (`@wix/auto_sdk_data_collections`) para crearlas. Las colecciones del CMS **no** son escribibles por el visitante: las lecturas/escrituras van en código de servidor con `auth.elevate(...)`, siempre filtrando por el miembro actual (nunca por params del cliente). El dueño de cada fila se identifica con `member._id` (`getCurrentMember`).

## Functionality

1. **Colección CMS — `wishlist`** (una fila por producto guardado)
   - Campos: `memberId` (text, requerido — `member._id`), `productId` (text, requerido), `slug` (text), `createdDate` (date). Índice único sugerido `(memberId, productId)` para impedir duplicados.
   - Crearla **una vez** con `@wix/data` `collections.createCollection` (elevated) o vía REST `POST https://www.wixapis.com/wix-data/v2/collections`; registrar el resultado en `.wix/seeded.json` (bloque `wishlist`).
   - Permisos restrictivos (nada de lectura/escritura pública): todo pasa por el servidor elevado.
2. **Data-access server-only — `src/features/wishlist/wishlist.ts`**
   - `export interface WishlistItem { _id: string; productId: string; slug?: string; createdDate?: string }`.
   - `export async function listWishlist(memberId: string): Promise<WishlistItem[]>` — `items.query(collection).eq('memberId', memberId).descending('createdDate')` elevado; `try/catch` → `[]`.
   - `export async function isWished(memberId: string, productId: string): Promise<boolean>` — query limit 1.
   - `export async function addToWishlist(memberId: string, product: { productId: string; slug?: string }): Promise<void>` — insert elevado; si ya existe, no-op (idempotente).
   - `export async function removeFromWishlist(memberId: string, productId: string): Promise<void>` — query + `items.remove` de las filas coincidentes (siempre con `memberId` en el filtro).
   - `memberId` vacío → `[]`/`false`/no-op sin llamar a la API.
   - Sin `index.ts` de feature: el resto importa la ruta exacta (`@/features/wishlist/wishlist`).
3. **API route — `src/pages/api/wishlist.ts`**
   - Resolver el miembro en servidor (`members.getCurrentMember({ fieldsets: ['FULL'] })` en try/catch). Sin `member._id` → `401 { error: 'NOT_AUTHENTICATED' }`.
   - `GET` → `200 { items }` (favoritos del miembro). `POST` body `{ productId, slug? }` → `200 { wished: true }`; validar `productId` no vacío (`400 INVALID_INPUT`). `DELETE` query `?productId=` → `200 { wished: false }`.
   - `Content-Type: application/json`; errores elevados → `500 { error: 'FAILED' }` sin filtrar el error crudo de Wix.
4. **Isla — `src/features/wishlist/wishlist-heart.tsx`** (`client:idle`, kebab-case, Tailwind + `ease-fluid`)
   - Props: `{ productId: string; productSlug?: string; initialWished: boolean; isMember: boolean; labels: { add; remove; signIn } }`.
   - `isMember === false` → renderiza un link a `localize('/api/auth/login?returnToUrl=…')` con `aria-label` de `signIn` (corazón outline, sin estado).
   - `isMember === true` → botón corazón con `aria-pressed` y `aria-busy`; optimista (togglea el estado y revierte si el `fetch` falla); `POST`/`DELETE /api/wishlist`; mensaje de error accesible (`role="alert"`) en fallo.
   - SVG del corazón inline (stroke cuando no guardado, fill `accent` cuando guardado); foco visible; `prefers-reduced-motion` respetado.
5. **Integración en cards y PDP**
   - `src/features/product-catalog/product-card.astro`: prop opcional `wished`/`isMember` para colocar el corazón en la esquina superior de la imagen; el catálogo (`/products`, `/category/[slug]`) resuelve el set de `productId` guardados del miembro en el frontmatter (una sola query) y lo pasa a cada card.
   - `src/pages/products/[slug].astro`: corazón junto al título/rating con `initialWished = isWished(member._id, product._id)`; solo si hay miembro, si no el link a login.
6. **Página — `src/pages/account/wishlist.astro`**
   - `noindex`; mismo patrón que `account/orders.astro` (302 a login con `returnToUrl` localizado).
   - Re-consulta los productos guardados con `@wix/stores` (`queryProducts` por `_id in productIds`) y los renderiza con `ProductCard` (grid responsive); estado vacío con copy + CTA a `/products` (usar `shop.empty`-style o claves propias).
   - Link "Wishlist" desde `/account` junto a "Order history".
7. **i18n — `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`**
   - Claves nuevas (namespace `wishlist.`): `wishlist.title`, `wishlist.add`, `wishlist.remove`, `wishlist.sign-in`, `wishlist.empty`, `wishlist.empty-cta`, `wishlist.error`, `wishlist.back-to-account`, `account.wishlist`. Paridad exacta de conteo en `en`/`es`/`it`.
8. **Tests — `tests/features/wishlist/wishlist.test.ts`**
   - `vi.mock('@wix/data')` + alias de `@wix/essentials` (ya existe en `tests/mocks/`).
   - `memberId` vacío → sin llamar a la API (`[]`/`false`/no-op).
   - `listWishlist` filtra por `memberId` y ordena por `createdDate` desc.
   - `addToWishlist` inserta con `memberId` + `productId`; `removeFromWishlist` incluye `memberId` en el filtro (nunca remueve filas de otro miembro).
   - Error de la API → `[]`/`false` sin lanzar.

## Pages / Sections

- `src/pages/account/wishlist.astro` — grid de favoritos del miembro + estado vacío.
- `src/pages/api/wishlist.ts` — `GET`/`POST`/`DELETE` scoped al miembro autenticado.
- `src/pages/products/[slug].astro` y `src/features/product-catalog/product-card.astro` — corazón de favorito.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`; error `text-error`.
- Radii 4/6/12px; transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- El corazón deshabilitado/activo usa `accent` con `fill`; sobre la imagen de la card, un fondo `paper/80` + backdrop-blur para legibilidad.

## Wix wiring

- `items` de `@wix/data` **solo** dentro de `src/features/wishlist/wishlist.ts` (servidor; nunca importado desde un `.tsx`).
- `auth.elevate` se queda en el módulo de servidor; el `memberId` sale siempre de `getCurrentMember`, nunca del body/query.
- La colección `wishlist` se crea una vez y se registra en `.wix/seeded.json` (solo IDs de apoyo, nunca importado en rutas `.astro`).
- Productos del wishlist se re-consultan con `@wix/stores` `queryProducts` (`filter: { _id: { $in: [...] } }`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`wishlist`)
- [ ] `wix dev`: `GET /products` → 200 con el corazón (link a login para anónimo) y `GET /products/<slug>` → 200
- [ ] `POST /api/wishlist` sin sesión → `401 { error: 'NOT_AUTHENTICATED' }`; `POST` con `productId` vacío y sesión → `400`
- [ ] Con miembro logueado: corazón → `POST` guarda, recarga el PDP y sigue activo; `DELETE` lo quita; `/account/wishlist` lista solo los productos del miembro y el estado vacío aparece sin favoritos
- [ ] Revisar el código: nunca se filtra por un `memberId`/`productId` provisto por el cliente; `items`/`auth.elevate` no aparecen en ningún `.tsx`
- [ ] Claves `wishlist.*` en `en`/`es`/`it` con el mismo conteo y `/es/account/wishlist` localizado

## Al terminar

1. Marca el paso 28 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-29-member-profile` (o `/generate-next-steps`).

## Resultado

Colección CMS `wishlist` (memberId, productId, slug, createdDate, índice no único por razón de diseño: único solo por 1 campo en el runtime → filtro + idempotencia en código), data-access `src/features/wishlist/wishlist.ts` (`auth.elevate` con `items.query/insert/remove`, `listWishlist`, `isWished`, `addToWishlist`, `removeFromWishlist`, `listWishlistProducts` con `productsV3.in('_id', ...)` manteniendo orden). API `src/pages/api/wishlist.ts` (`GET/POST/DELETE` scoped a miembro: 401 si no auth, 400 si `productId` vacío/JSON inválido, 500 en fallo). Isla `src/features/wishlist/wishlist-heart.tsx` (`client:idle`, link a login con `localize('/api/auth/login?returnToUrl=…')` para anónimo, botón optimista con `aria-pressed`/`aria-busy`, `role="alert"` en error, SVG corazón fill/outline, `prefers-reduced-motion`). Integrado en `product-card.astro` (posicionado absoluto top-right, recibe `isMember`/`wished`, catálogo y categorías resuelven set en frontmatter), `/products/[slug].astro` junto a título, `/account/wishlist.astro` (`noindex`, 302 a login, grid con `ProductCard` o estado vacío) + link "Wishlist" en `/account`. i18n `wishlist.*` + `account.wishlist` en `en`/`es`/`it` (414 claves c/u, paridad). `tests/features/wishlist/wishlist.test.ts` (14 casos) · `npm test` 94/94 · `astro build` verde · `npm run test:e2e` 9/9 · `astro dev`: `/products`/`/es/products` muestran corazón con `signInHref` localizado, `/api/wishlist` anónimo devuelve 401/400, `/account/wishlist` anónimo 302 con `returnToUrl` localizado.
