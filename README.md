# Petals & Predators

> Tienda headless de plantas carnívoras y flores — Astro + Wix Managed Headless.

Un e-commerce en inglés construido sobre **Wix Stores** como backend (catálogo, carrito y
checkout nativo) y **Astro** como frontend SSR. El diseño sigue una estética oscura y
minimal, inspirada en Mintlify: fondo `#08090A`, acento mint `#18E299`, tipografía
Fraunces + Inter. Ver `DESIGN.md`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Astro 5 (SSR) + islas React 18 |
| Estilos | Tailwind CSS 4 (`@theme`) |
| Backend | Wix Managed Headless (`@wix/astro`) |
| Datos | Wix Stores, Wix CMS, Wix Forms, Wix Blog, Wix Reviews, Wix Members |
| i18n | Wix Multilingual — `en`, `es`, `it` |
| Tests | Vitest + Testing Library · Playwright (E2E) |
| Gestor de paquetes | npm (ver `AGENTS.md`) |

---

## Features

- **Home** con landing cinemática *scroll-world* (6 clips pre-renderizados).
- **Shop** con grilla de productos y páginas por categoría.
- **Product detail** con variantes, cantidad y add-to-cart.
- **Carrito + checkout** nativo de Wix + badge reactivo en el nav.
- **Journal** de cuidado de plantas (Wix CMS) con rutas dinámicas.
- **Lookbook** estacional con mosaico por temporada.
- **Reseñas de producto** (Wix Reviews) — rating en PDP y home.
- **Gift cards** con fallback si la app no está instalada.
- **Miembros** — login, cuenta y logout (Wix Members Area).
- **Multilenguaje** con selector de idioma y SEO por locale.

---

## Apps de Wix

Apps que el proyecto usa (✅) y apps disponibles en la API de Wix que **no** están instaladas ni se usan (❌).

| Estado | App de Wix | Features / páginas / secciones que usa esta web |
| :----: |---|---|
| ✅ | **Wix Stores** (catálogo) | Home (productos destacados) · Shop / grilla de productos · páginas por categoría · PDP (variantes, precio) · Site search |
| ✅ | **Wix eCommerce** (carrito/checkout) | Carrito + badge reactivo en el nav · checkout nativo de Wix · Order history (pedidos) |
| ✅ | **Wix CMS** (`@wix/data`) | Journal (care guides con rutas dinámicas) · Lookbook por temporada · Wishlist · Restock alerts |
| ✅ | **Wix Blog** | Índice `/blog` · posts `/blog/[slug]` con contenido ricos · categorías por slug `/blog/category/[slug]` · posts relacionados |
| ✅ | **Wix Forms** | Contact (formulario de contacto) · Newsletter (suscripción) |
| ✅ | **Wix Reviews** | Rating y reseñas en la PDP · carrusel de reseñas en Home · formulario de crear reseña |
| ✅ | **Wix Members** | Login / logout · página de cuenta (avatar, perfil) · desbloquea Wishlist y Order history por miembro |
| ✅ | **Wix Bookings** | Workshops (Care 101, Repotting 101 — servicios APPOINTMENT) |
| ✅ | **Wix Gift Cards** | Página Gift cards (eGift Card con 5 variantes preset) |
| ✅ | **Wix Pricing Plans** | Club (suscripción, planes monthly / annual) |
| ✅ | **Wix Multilingual** | Selector de idioma `en` / `es` / `it` · SEO y rutas por locale |
| ❌ | **Wix Events** | Sin uso — no vendemos entradas ni RSVP |
| ❌ | **Wix Donations** | Sin uso — e-commerce puro |
| ❌ | **Wix Restaurants** | Sin uso |
| ❌ | **Wix Forum** | Sin uso |
| ❌ | **Wix Portfolio** | Sin uso — el Lookbook es CMS propio |


---

## Estructura

Screaming Architecture: las carpetas gritan **qué hace el negocio**, no qué tecnología usa (ver reglas en `AGENTS.md`).

```
src/
├── app/            # chrome de la app: layout.astro, header, footer, logo, language-selector
├── shared/         # infra cross-cutting (2+ features): i18n, wix-image, ricos, seo,
│                   # analytics, wix-forms, discounts, site, og-image
├── features/       # UNA carpeta por capacidad de negocio (con index.ts como API pública)
│                   # home, product-catalog, cart, journal, lookbook, workshops,
│                   # gift-cards, reviews, account, newsletter, contact, site-search
├── pages/          # rutas delgadas (requisito de Astro): componen features, sin lógica
├── styles/         # global.css + tokens del @theme
├── assets/         # fuentes y medios estáticos
└── translations.json
tests/              # features/, shared/, e2e/, mocks/
```

Reglas: cada feature expone su API en `index.ts` y se importa solo como `@/features/<feature>`; una feature **nunca** importa de otra (si comparten algo → `src/shared/`); `src/pages` solo compone. `src/components/`, `src/utils/` y `src/data/` quedaron deprecados.

> Todo archivo dentro de `src/` va en **kebab-case** y sin `any` (ver `AGENTS.md`).

---

## Empezar

Requiere **npm ≥ 11.10.0** (`.npmrc` usa `min-release-age`) y un Node LTS moderno (Astro 5).

**¿Por qué npm y no pnpm?** Porque el árbol de dependencias de Wix mezcla versiones de
React. Paquetes como `@wix/dashboard` declaran peers con rangos antiguos
(`react: "^16.0.0 || ^18.0.0"`), que chocan con el **React 18** del proyecto bajo la
resolución estricta de peers. `.npmrc` fija `legacy-peer-deps=true` para que la
instalación no aborte por ese conflicto, y `min-release-age=1` (cooldown de 1 día a
versiones recién publicadas). Por eso el único lockfile es `package-lock.json`.

```bash
npm install      # aplica también patch-package (postinstall)

# desarrollo local
npm run dev      # wix dev — http://localhost:4321

# builds y release
npm run build    # wix build
npm run preview  # wix preview
npm run release  # wix release
```

Necesitas sesión de Wix activa (`wix login`) y el proyecto enlazado (ver `step-0`).

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (`wix dev`) |
| `npm run build` | Compila el sitio (`wix build`) |
| `npm run release` | Publica a Wix Hosting |
| `npm run check` | Typecheck de TS y `.astro` (`astro check`) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:e2e` | E2E con Playwright |
| `npm run test:e2e:ui` | E2E en modo UI |
| `npm run wix` | CLI de Wix (translate, env, generate, …) |

## CI/CD

- **CI**: `.github/workflows/ci.yml` runs on push/PR (`npm ci`, `npm run check`, `npm test`, Playwright Chromium E2E, `npx @wix/cli build`).
- **Release**: `.github/workflows/release.yml` supports manual dispatch (`workflow_dispatch`) or tags (`v*`). Uses `wix build` + `wix login --api-key` + `wix release` with secrets (never commit secrets). Set `WIX_API_KEY` in GitHub Secrets (and use environment `production` as desired).

## Environment variables

Use the Wix CLI to manage env vars:

```bash
# Set a public/server variable on Wix (shared with collaborators)
npx @wix/cli env set --key=MY_VAR --value=...

# Pull variables from Wix to .env.local (required for secrets/shared vars)
npx @wix/cli env pull

# Remove a variable
npx @wix/cli env remove --key=MY_VAR
```

Notes:
- Secrets are stored on Wix servers; `wix env pull` downloads them locally. Public vars can be stored in `.env.local` or via `wix env set/pull`.
- Never commit real secrets. `.env`, `.env.local`, `.env.*.local` are gitignored. See `.env.example` for non-secret placeholders.
- Schema is typed in `astro.config.mjs` via `envField` (Astro env schema). Access client vars via `astro:env/client`, server vars via `astro:env/server`.

---

## Cómo se construye

El sitio se desarrolla **por pasos**. Cada archivo `.opencode/commands/step-N-*.md` es la
fuente de verdad de qué hacer a continuación; ejecutar en orden.

- `ROADMAP.md` — estado del backlog (`pending` → `materialized` → `✅ done`).
- `PLAN.md` — decisiones de diseño y mecánica del flujo.
- `AGENTS.md` — convenciones, reglas de trabajo y recetas Wix.

---

## Documentación

- [Wix Managed Headless + Astro](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration)
- [Wix REST API](https://dev.wix.com/docs/api-reference)
- [Wix JS SDK](https://dev.wix.com/docs/sdk)
