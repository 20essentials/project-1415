---
description: Step 23 — Build + release (sitio en vivo) · Petals & Petals & Predators
---
# Step 23 — Build + release (sitio en vivo)

> **Siguiente:** `/step-24-member-order-history`

## Objetivo

Compilar, validar y publicar el sitio Wix Headless (Astro) en entorno vivo con `wix build` + `wix deploy`/release, verificando rutas clave y SEO básico. Build verde.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **CLI Wix:** [Build and deploy with the CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/build-and-deploy-with-the-cli#build-and-deploy-a-headless-project-with-the-wix-cli)
- **Estado:** Proyecto completo hasta step 22. Ver `.wix/`, `wix.config.*`, `package.json` (scripts `wix:*`).

## Functionality

1. **Precheck**
   - `npx @wix/cli@latest --version`
   - Revisar env vars necesarias (si aplica). Build local limpio.
   - `npm ci` si hay dudas de node_modules (opcional).

2. **Build**
   - `npx @wix/cli@latest build` — debe salir en verde. Revisar warnings relevantes.

3. **Deploy/Preview + Release**
   - Seguir flujo CLI: `wix deploy` para preview, validar, luego release a dominio del sitio. Usar comandos del `package.json` (`npm run wix:build`, `npm run wix:deploy` si existen).
   - Obtener URL publicada y anotarla.

4. **Smoke test post-release**
   - Probar rutas: `/`, `/products`, `/products/[slug]`, `/cart`, `/about`, `/contact`, `/gift-cards`, `/lookbook`, `/journal`, `/services` (si existe). Respuestas 200/esperadas.
   - Comprobar i18n `/es/*`, `/it/*`, login/logout, formulario newsletter, gift cards (fallback OK).

5. **Documentar**
   - Anotar URL publicada en `ROADMAP.md` (Notas) o `docs/release.md`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Deploy completado sin errores
- [ ] Smoke test 200 en rutas críticas
- [ ] i18n funciona en publicado (donde aplique)
- [ ] SEO tags básicos presentes (inspección DOM publicado)

## Al terminar

1. Marca paso 23 `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps`.

## Resultado

**Docs:** [Build and deploy with the CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/build-and-deploy-with-the-cli#build-and-deploy-a-headless-project-with-the-wix-cli) · [Write unit tests](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/write-unit-tests#write-unit-tests-for-a-wix-cli-project) · `docs/release.md`. **URL publicada: https://petals-d960960gm-0609.wix-site-host.com** (preview: `dcpyuf-petals-…`; alias topology: `hbinsl-petals-…`). Flujo CLI real: `wix build` → `wix preview` → `wix release` (**no hay `wix deploy`**). Fixes durante el paso: `node_modules` incompleto → `npm install` (faltaba `@astrojs/react`, rompía `astro.config.mjs`); `npm run check` fallaba con `Cannot find package '@emnapi/runtime'` (peer de `@napi-rs/wasm-runtime` vía `@astrojs/astro2tsx`, no instalado por `legacy-peer-deps=true`) → `@emnapi/runtime` en devDeps. **Verificado:** build verde (×2), `npm run check` 0 errores, `npm test` 44/44, smoke test 200 en 17 rutas críticas (incl. `/category/*`, `/account`), **`/services` y `/lookbook` ya no dan 404 en el release vivo** (issue del step 22 resuelto), i18n `lang`/`hreflang`/links localizados OK, login 302, newsletter isla SSR con formId, gift-cards fallback 200, SEO tags inyectados por Wix (title/canonical/og + description en PDP). **Nota:** la home no tiene `meta description` (config SEO de main pages → pendiente manual step 13)
