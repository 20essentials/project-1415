---
description: Step 27 — Escribir reseña de producto · Petals & Predators
---
# Step 27 — Escribir reseña de producto

> **Siguiente:** `/step-28-wishlist` (si aún no existe → `/generate-next-steps`)

## Objetivo

Un miembro logueado puede escribir una reseña (estrellas 1–5 + título + texto) desde el PDP; la reseña se crea en Wix Reviews con su autor (`contactId`) y queda en moderación. El visitante anónimo ve la invitación a iniciar sesión.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/reviews/` (`reviews.ts`, `rating-stars.astro`), `src/pages/products/[slug].astro` (sección "What growers say", hoy solo si hay reseñas), `src/pages/account.astro` (patrón de `members.getCurrentMember` + redirect a login), `src/pages/api/bookings.ts` (patrón de API route + mapeo de errores), `src/translations.json`, `.wix/seeded.json`, `ROADMAP.md`.
- **API (verificada en `node_modules/@wix/auto_sdk_reviews_reviews`):** `reviews.createReview(review)` exige `content` (con `rating`), `entityId` y `namespace`; la doc indica que **requiere un `author.contactId`** (contacto del autor) y que, si `authorName` va vacío, se usa el nombre del miembro. La app Wix Reviews ya está instalada (step 16). El estado de moderación por defecto lo define la config del sitio (normalmente queda pendiente de aprobación) — la reseña recién creada **no tiene por qué aparecer** en el listado público hasta aprobarse.

## Functionality

1. **Data-access server-only — `src/features/reviews/create-review.ts`**
   - `export interface ReviewInput { productId: string; rating: number; title?: string; body: string }`.
   - `export interface CreatedReview { id: string; moderationStatus: string | null }`.
   - `export class ReviewSubmitError extends Error { code: 'INVALID_INPUT' | 'NOT_AUTHENTICATED' | 'FAILED' }` (mismo estilo que `WorkshopBookingError`).
   - `export async function submitProductReview(input: ReviewInput, member: Member | null): Promise<CreatedReview>`:
     - Valida `productId` no vacío y `rating` entero 1–5 (si no → `INVALID_INPUT`, sin llamar a la API).
     - Sin `member?.contactId` → `NOT_AUTHENTICATED` (no se inventa contacto).
     - `reviews.createReview({ namespace: 'stores', entityId: productId, author: { contactId: member.contactId }, content: { rating, title: title?.trim() || undefined, body: body.trim() } })`. Probar con auth ambiental del sitio; **si** la API responde error de permisos, envolver con `auth.elevate(reviews.createReview)` — ese poder se queda en este archivo de servidor (nunca importado desde un `.tsx` cliente).
     - Devuelve `{ id, moderationStatus: review.moderation?.moderationStatus ?? null }`; cualquier error → `FAILED` (con `console.error`).
   - **No** crear `index.ts` de feature: el resto del código importa la ruta exacta (`@/features/reviews/create-review`).
2. **API route — `src/pages/api/reviews.ts`** (`export const POST: APIRoute`)
   - Body JSON `{ productId, rating, title?, body? }`; parseo defensivo (patrón de `api/bookings.ts`).
   - Resolver el miembro en servidor: `members.getCurrentMember({ fieldsets: ['FULL'] })` (try/catch → `null`).
   - Validar en servidor igual que el módulo: `rating` entero 1–5, `body` no vacío (≤ 2000), `title` ≤ 100.
   - `submitProductReview(...)` → `201 { review }`; `NOT_AUTHENTICATED` → `401`; `INVALID_INPUT` → `400`; `FAILED` → `500`; `Content-Type: application/json`, sin filtrar el error crudo de Wix.
3. **Isla — `src/features/reviews/review-form.tsx`** (`client:idle`, kebab-case, Tailwind + `ease-fluid`)
   - Props: `{ productId: string; labels: ReviewFormLabels }` donde `ReviewFormLabels` incluye: título de la sección, `ratingLabel`, `titleLabel`, `bodyLabel`, `bodyPlaceholder`, `submit`, `submitting`, `success` (aviso de moderación), `error`, `retry`, `validationRating`.
   - Campo de estrellas como `role="radiogroup"`/`<fieldset><legend>` con 5 `<input type="radio">` visualmente ocultos y estrellas clicables (hover + `focus-visible`), mismo trazado SVG que `rating-stars.astro`; teclado completo (flechas/espacio) y `aria-checked`.
   - Título opcional (`maxlength=100`), texto obligatorio (`textarea` `maxlength=2000` con contador opcional).
   - Estados: idle / submitting (botón `disabled` + `aria-busy`) / success (mensaje `role="status"` con el aviso de que pasará por moderación y limpieza del form) / error (`role="alert"` + botón retry).
   - `fetch('/api/reviews', { method: 'POST', headers: {...}, body: JSON.stringify(...) })`; en `!res.ok` mapea el `error` a un mensaje.
4. **PDP — `src/pages/products/[slug].astro`**
   - En el frontmatter: resolver el miembro (`members.getCurrentMember({ fieldsets: ['FULL'] })` en try/catch → `null`), solo para decidir qué renderizar (`isMember = Boolean(member?.contactId)`); no exponer el objeto miembro.
   - La sección de reseñas **siempre** se renderiza (hoy el `topReviews.length > 0 && …` la esconde y un producto sin reseñas no puede recibir la primera): `<h2>` de la sección + lista de reseñas existentes (si hay) + bloque de acción:
     - `isMember` → `<ReviewForm client:idle productId={product._id} labels={reviewFormLabels} />`.
     - anónimo → párrafo + link a `localize(`/api/auth/login?returnToUrl=${localize(`/products/${slug}`)}`)` con el copy "Inicia sesión para reseñar" (mismo patrón que `account.astro`/`account/orders.astro`).
   - Mantener el rating bajo el `<h1>` como está (solo con reseñas) — no duplicar la sección.
5. **i18n — `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`**
   - Claves nuevas (namespace `reviews.form.`): `reviews.form.title`, `reviews.form.rating`, `reviews.form.subject`, `reviews.form.body`, `reviews.form.body-placeholder`, `reviews.form.submit`, `reviews.form.submitting`, `reviews.form.success`, `reviews.form.error`, `reviews.form.retry`, `reviews.form.rating-required`, y `reviews.write`/`reviews.login-to-review`/`reviews.be-first`. Paridad exacta de conteo en `en`/`es`/`it`.
6. **Tests — `tests/features/reviews/create-review.test.ts`**
   - `vi.mock('@wix/reviews')` + `vi.mock('@wix/essentials')`.
   - Rating fuera de rango o `productId` vacío → `ReviewSubmitError` `INVALID_INPUT` **sin** llamar a `createReview`.
   - `member` sin `contactId`/`null` → `NOT_AUTHENTICATED` sin llamada.
   - Camino feliz: `createReview` recibe `namespace: 'stores'`, `entityId` del producto, `author.contactId` del miembro y `content.rating`/`body`; devuelve id + `moderationStatus` mapeados.
   - `createReview` rechaza → `FAILED`.

## Pages / Sections

- `src/pages/products/[slug].astro` — sección de reseñas siempre visible; añade el formulario (miembro) o la invitación a login (anónimo).
- `src/pages/api/reviews.ts` — endpoint POST que crea la reseña del miembro autenticado.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`; error `text-error`.
- Radii 4/6/12px; transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- El formulario sigue el lenguaje de las cards de reseña existentes (`rounded-md border border-rule bg-paper-warm p-6`), con los inputs del tema y foco visible.

## Wix wiring

- `reviews.createReview` de `@wix/reviews` **solo** dentro de `src/features/reviews/create-review.ts` (código de servidor; nunca importarlo desde el `.tsx`).
- `members.getCurrentMember` de `@wix/members` en el frontmatter del PDP y en la API route (auth ambiental del sitio).
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).
- Nota de moderación: la reseña creada queda pendiente según la config del sitio; la verificación exitosa es la respuesta `201` + el registro en Wix (dashboard → Reviews), **no** su aparición inmediata en el PDP.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`create-review`)
- [ ] `wix dev`: `GET /products/<slug>` → 200; anónimo ve la invitación a login; la sección de reseñas aparece aunque el producto no tenga reseñas
- [ ] `POST /api/reviews` sin sesión → `401` con `{ error: 'NOT_AUTHENTICATED' }`
- [ ] `POST /api/reviews` con sesión y payload inválido (`rating: 9`) → `400`; el endpoint no llama a Wix
- [ ] Con miembro logueado + payload válido → `201` y la reseña aparece en el dashboard de Wix Reviews con el autor correcto; el form muestra el aviso de moderación
- [ ] Revisar el código: `createReview` no se importa desde ningún `.tsx`; el `contactId` sale de `getCurrentMember`, nunca del body
- [ ] Claves `reviews.form.*` en `en`/`es`/`it` con el mismo conteo y el form se localiza en `/es/products/<slug>`

## Al terminar

1. Marca el paso 27 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (materializa los próximos `pending`: favoritos, perfil editable, gift cards, performance).
