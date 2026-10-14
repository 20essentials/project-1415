---
description: Step 10 — Member login + account (Wix Members Area) · Petals & Predators
---
# Step 10 — Member login + account (Wix Members Area)

> **Siguiente:** `/step-11-plant-care-journal`

## Objetivo

Login de miembros con la página de login alojada por Wix (rutas built-in del Astro
integration), acción "Log in"/"Account" en el nav, y una página `/account` que muestra
el perfil del miembro y permite cerrar sesión.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Auth (solo flujo alojado):** la integración `wix()` de Astro inyecta las rutas
  `GET /api/auth/login`, `POST /api/auth/logout`, `/api/auth/signup`, `/api/auth/callback`,
  `/api/auth/logout-callback`. **No** crear endpoints propios ni una página de login custom
  (no soportado en la integración Astro; ver doc "Build a Custom Login Page").
- **App:** Wix Members Area (appDefId `14cc59bc-f0b7-15b8-e1c7-89ce41d0e0c9`) — hoy **no**
  instalada en el sitio; instalarla antes (receta
  `wix-manage/references/app-installation/install-wix-apps.md`, endpoint
  `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`).
- **SDK:** `npm install --legacy-peer-deps @wix/members` (el kit usa `^1.0.511`).
- **Estado:** el nav real es `src/components/header.astro` (marker `<!-- nav:actions -->`),
  importado por `src/layouts/layout.astro`.

## Functionality

1. **Instalar la app Wix Members Area** en el sitio (appDefId de arriba) e instalar
   `@wix/members`.
2. **Login/logout sin código propio:**
   - Log in → `GET /api/auth/login?returnToUrl=/account` (redirige a la página de login de Wix).
   - Log out → `POST /api/auth/logout?returnToUrl=/` (formulario POST, **no** un link GET).
   - `returnToUrl` DEBE ser relativo (una URL absoluta devuelve 400).
3. **Nav (`src/components/header.astro`, marker `<!-- nav:actions -->`):**
   - Sin sesión: link "Log in" → `/api/auth/login?returnToUrl=/account`.
   - Con sesión: link "Account" → `/account`.
   - Detectar sesión en SSR (p. ej. `members.getCurrentMember()` en `layout.astro`, que
     devuelve `null` si no hay miembro) y pasar `loggedIn`/`member` a `Header` por props.
   - Mantener el grid actual del nav sin romperlo en móvil/desktop.
4. **`src/pages/account.astro`:**
   - Sin miembro: `Astro.redirect('/api/auth/login?returnToUrl=/account')`.
   - Con miembro: perfil (nombre, email, foto si existe) desde
     `members.getCurrentMember({ fieldsets: ['FULL'] })` + botón **Log out**
     (form POST a `/api/auth/logout?returnToUrl=/`).
   - Privada: `<Layout noindex ...>`.
5. **Sin historial de órdenes.** No existe API member-scoped de órdenes de *tienda* en
   headless (solo Pricing Plans); queda fuera de alcance.

## Pages / Sections

- `src/pages/account.astro` — perfil del miembro + logout (privada).
- `src/components/header.astro` — acción "Log in" / "Account" en `<!-- nav:actions -->`.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie
  `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Card de perfil: `border rule`, `bg paper-warm/40`, `radius 6px`; Log out con el estilo
  secundario. Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- `members.getCurrentMember()` (`@wix/members`) en runtime SSR; rutas built-in del integration
  para login/logout. Auth ambiental (Wix-managed) — no setear OAuth client.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Con la app instalada: "Log in" abre la página de login de Wix y vuelve a `/account`
- [ ] `/account` sin sesión redirige a login; con sesión muestra perfil + logout
- [ ] Logout cierra sesión y vuelve a `/`

## Al terminar

1. Marca el paso 10 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-11-plant-care-journal`.
