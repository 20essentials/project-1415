---
description: Step 29 — Perfil de miembro editable · Petals & Predators
---
# Step 29 — Perfil de miembro editable

> **Siguiente:** `/step-30-gift-cards-official-app` (si aún no existe → `/generate-next-steps`)

## Objetivo

Un miembro logueado edita su nombre, apellido y nickname desde `/account/profile`; los cambios se guardan en Wix Members (`members.updateMember`) y se reflejan en `/account` (nombre e iniciales). El avatar se muestra reutilizando `member-avatar.ts`.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/pages/account.astro` (ya resuelve `member`, `displayName`, `initials`, avatar y linkea "Order history"), `src/features/account/member-avatar.ts` (`resolveMemberAvatarUrl`), `src/pages/account/orders.astro` (patrón `noindex` + 302 a login), `src/pages/api/reviews.ts` (patrón de API route + mapeo de errores), `src/translations.json`, `ROADMAP.md`.
- **API (verificar en `node_modules/@wix/auto_sdk_members_members`):** `members.updateMember(_id, { contact: { firstName, lastName }, profile: { nickname } })` (el shape exacto de `UpdateMember` puede exigir solo los campos a cambiar). El objeto `Member` trae `contact.firstName/lastName`, `profile.nickname` y `profile.photo`. `getCurrentMember({ fieldsets: ['FULL'] })` es la fuente del miembro — el `_id` nunca se toma del request.
- **Avatar:** la **subida** de foto requiere el flujo de archivos del Member Avatar app (fuera de alcance de este paso); se mantiene la **visualización** actual con `resolveMemberAvatarUrl`. Dejar el punto explícito en las notas.

## Functionality

1. **Data-access server-only — `src/features/account/member-profile.ts`**
   - `export interface MemberProfileInput { firstName?: string; lastName?: string; nickname?: string }`.
   - `export type MemberProfileCode = 'INVALID_INPUT' | 'NOT_AUTHENTICATED' | 'FAILED'` + `export class MemberProfileError extends Error { code: MemberProfileCode }` (mismo estilo que `ReviewSubmitError`/`WorkshopBookingError`).
   - `export async function updateMemberProfile(memberId: string, input: MemberProfileInput): Promise<void>`:
     - `memberId` vacío → `NOT_AUTHENTICATED`.
     - Sanear: `trim()`, límites (`firstName`/`lastName` ≤ 100, `nickname` ≤ 100); vacío → `undefined` (no se borra el campo salvo que el diseño lo pida — dejar el comportamiento explícito).
     - Llamada con `auth.elevate(members.updateMember)(memberId, { contact: { firstName, lastName }, profile: { nickname } })`; error → `FAILED` (`console.error`).
   - Sin `index.ts` de feature: import por ruta exacta (`@/features/account/member-profile`).
2. **API route — `src/pages/api/member-profile.ts`**
   - Resolver el miembro en servidor (`members.getCurrentMember({ fieldsets: ['FULL'] })` en try/catch); sin `member._id` → `401 { error: 'NOT_AUTHENTICATED' }`.
   - `POST` (o `PATCH`) body `{ firstName?, lastName?, nickname? }`; parseo defensivo (patrón `api/reviews.ts`); validar longitudes en servidor → `400 INVALID_INPUT`.
   - `updateMemberProfile(...)` → `200 { ok: true }`; `NOT_AUTHENTICATED` → `401`; `INVALID_INPUT` → `400`; `FAILED` → `500`; `Content-Type: application/json`, sin filtrar el error crudo de Wix.
3. **Isla — `src/features/account/profile-form.tsx`** (`client:idle`, kebab-case, Tailwind + `ease-fluid`)
   - Props: `{ initial: { firstName: string; lastName: string; nickname: string }; labels: ProfileFormLabels }` (`title`, `firstName`, `lastName`, `nickname`, `nickname-hint`, `submit`, `submitting`, `success`, `error`, `retry`).
   - Tres campos de texto con `maxlength` y `autoComplete` correctos (`given-name`, `family-name`, `nickname`); labels visibles.
   - Estados idle / submitting (botón `disabled` + `aria-busy`) / success (`role="status"`, limpieza del mensaje tras unos segundos) / error (`role="alert"` + retry).
   - `fetch('/api/member-profile', { method: 'POST', … })`; en `!res.ok` mapea `error` a un mensaje.
4. **Página — `src/pages/account/profile.astro`**
   - `noindex`; mismo patrón que `account/orders.astro` (302 a login con `returnToUrl` localizado).
   - Muestra el avatar (`resolveMemberAvatarUrl`, reutilizado) + email de login (solo lectura) y monta `<ProfileForm client:idle initial={…} labels={…} />`.
   - Link "Edit profile" / breadcrumb de vuelta a `/account`.
5. **`src/pages/account.astro`**
   - Añadir el link "Profile" junto a "Order history" y al logout.
6. **i18n — `src/translations.json` + `.wix/multilingual/translations/{es,it}.json`**
   - Claves nuevas (namespace `profile.`): `profile.title`, `profile.first-name`, `profile.last-name`, `profile.nickname`, `profile.nickname-hint`, `profile.submit`, `profile.submitting`, `profile.success`, `profile.error`, `profile.retry`, `profile.back-to-account`, `account.profile`. Paridad exacta de conteo en `en`/`es`/`it`.
7. **Tests — `tests/features/account/member-profile.test.ts`**
   - `vi.mock('@wix/members')` + alias de `@wix/essentials` (ya existe).
   - `memberId` vacío → `NOT_AUTHENTICATED` sin llamar a `updateMember`.
   - Campos con espacios → se envían `trim()`eados; sobre el límite → `INVALID_INPUT` sin llamada.
   - Camino feliz: `updateMember` recibe el `memberId` correcto y solo los campos provistos.
   - Error de la API → `FAILED`.

## Pages / Sections

- `src/pages/account/profile.astro` — edición de nombre/apellido/nickname + avatar de solo lectura.
- `src/pages/api/member-profile.ts` — endpoint que actualiza el perfil del miembro autenticado.
- `src/pages/account.astro` — link a "Profile".

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`; error `text-error`.
- Radii 4/6/12px; transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- La card del formulario sigue el lenguaje de `/account` (`rounded-md border border-rule bg-paper-warm/40 p-6`), inputs del tema con foco visible.

## Wix wiring

- `members.updateMember` de `@wix/members` **solo** dentro de `src/features/account/member-profile.ts` (servidor); `auth.elevate` se queda en ese archivo.
- `getCurrentMember` en el frontmatter de `/account/profile` y en la API route; el `_id` sale del miembro actual, nunca del body.
- `resolveMemberAvatarUrl` (de `src/features/account/member-avatar.ts`) reutilizado para mostrar la foto.
- `.wix/seeded.json` solo para IDs de apoyo (nunca importado en rutas `.astro`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde (`member-profile`)
- [ ] `wix dev`: `GET /account/profile` sin sesión → 302 a login con `returnToUrl=/account/profile` (localizado en `/es/…`, `/it/…`)
- [ ] `POST /api/member-profile` sin sesión → `401 { error: 'NOT_AUTHENTICATED' }`
- [ ] Con miembro logueado: guardar nombre/apellido/nickname → `200`, `/account` muestra el `displayName` actualizado y las iniciales cambian; nickname vacío cae al nombre del contacto
- [ ] Revisar el código: `updateMember`/`auth.elevate` no se importan desde ningún `.tsx`; el `_id` sale de `getCurrentMember`
- [ ] Claves `profile.*` en `en`/`es`/`it` con el mismo conteo y el form localizado en `/es/account/profile`
- [ ] Nota en el reporte: la subida de avatar queda fuera de alcance (requiere el flujo de archivos del Member Avatar app); solo se muestra

## Al terminar

1. Marca el paso 29 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-30-gift-cards-official-app` (o `/generate-next-steps`).
