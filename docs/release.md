# Release — step 23 (build + deploy)

Fecha: 2026-10-16 · CLI `@wix/cli@1.1.263` · login `whoami` OK.

## URLs

| Entorno | URL |
|---|---|
| **Producción (release)** | https://petals-d960960gm-0609.wix-site-host.com |
| Producción (alias en `.wix/topology.json`) | https://hbinsl-petals-d960960gm-0609.wix-site-host.com |
| Preview | https://dcpyuf-petals-d960960gm-0609.wix-site-host.com |
| Dashboard | https://manage.wix.com/dashboard/c6608ff9-497b-4734-8fe9-74132892d04c |

## Comandos

```bash
npm run build          # wix build (verde)
npx @wix/cli@latest preview
npx @wix/cli@latest release -c "Step 23: build + release"
```

No existe `wix deploy`: el flujo CLI es `preview` → `release`.

## Precheck (arreglado durante el paso)

- `node_modules` incompleto tras el arranque → `npm install` (faltaba `@astrojs/react` y rompía `astro.config.mjs`).
- `npm run check` (`astro check`) pedía instalar `@astrojs/check`: la importación fallaba por `Cannot find package '@emnapi/runtime'` — peer de `@napi-rs/wasm-runtime` (usado por `@astrojs/astro2tsx`) que `legacy-peer-deps=true` no instala. **Fix:** `@emnapi/runtime` añadido a `devDependencies`.

## Smoke test (producción, `curl -L`)

| Ruta | Código |
|---|---|
| `/` | 200 |
| `/products` | 200 |
| `/products/venus-flytrap-akai-ryu` | 200 |
| `/category/carnivorous`, `/category/flowers`, `/category/kits-accessories` | 200 |
| `/cart` | 200 |
| `/about`, `/contact` | 200 |
| `/gift-cards` | 200 (fallback OK, renderiza "eGift Card") |
| `/lookbook` | 200 |
| `/journal`, `/journal/humidity-for-nepenthes` | 200 |
| `/services` | 200 |
| `/account` | 200 |
| `/es`, `/es/products`, `/es/products/venus-flytrap-akai-ryu`, `/es/gift-cards` | 200 |
| `/it`, `/it/products`, `/it/journal` | 200 |

**Fix del issue de step 22:** `/services` y `/lookbook` ya **no** dan 404 en el release vivo.

## i18n

- `<html lang>`: `en` en `/`, `es` en `/es`, `it` en `/it/products`.
- `hreflang` alternates `en`/`es`/`it` presentes en el head.
- Links localizados renderizados en `/es`: `/es/products`, `/es/journal`, `/es/services`.
- Selector de idioma (desktop + menú móvil) con los 3 locales.

## Auth / formularios

- `GET /api/auth/login?returnToUrl=/account` → **302** (endpoint integrado de `@wix/astro`; no hay `/login` propio).
- Newsletter: isla `NewsletterForm` SSR con `formId` `8974409a-af25-484f-8e93-a73b42dcb611` + label/placeholder/estado `aria-live` en el HTML. (El submit es client-side con el SDK; no verificado end-to-end desde curl.)
- Gift cards: `/gift-cards` siempre 200 (producto presente → compra; sin producto → fallback).

## SEO (inspección del HTML publicado)

- `/`: `<title wix-seo-tag="true">Home | Petals &amp; Predators</title>`, `rel=canonical`, `og:title`/`og:url`/`og:type`.
- `/products/[slug]`: title de producto (`'Akai Ryu' Venus Flytrap | …`) + `<meta name="description">` (emitida por el `<slot name="head">`, step 14).
- **Nota:** la home no tiene `<meta name="description">` (Wix no la inyecta; los tags de main pages se configuran en el dashboard, pendiente manual del step 13). No bloqueante.

## Verificación ejecutada

- `npx @wix/cli@latest build` → **verde** (2 veces: antes y después del fix de deps).
- `npm run check` (`astro check`, 92 files) → **0 errores / 0 warnings / 8 hints**.
- `npm test` → **44/44**.
- Smoke test de rutas (tabla arriba) contra el dominio publicado.
