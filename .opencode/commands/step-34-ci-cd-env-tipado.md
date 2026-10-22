---
description: Step 34 — CI/CD + env tipado · Petals & Predators
---
# Step 34 — CI/CD + env tipado

> **Siguiente:** `/step-35-analytics-eventos-faltantes-plataformas-externas-consentimiento-granular`

## Objetivo

Añadir GitHub Actions para CI (`npm ci`, `npm run check`, `npm test`, `npm run test:e2e` con Chromium, `npx @wix/cli build`), configurar release manual/por tag con `wix release` usando credenciales de CI (sin secretos en repo), tipar variables de entorno con `envField` en `astro.config.mjs`, documentar `wix env set`/`wix env pull` y crear `.env.example` sin secretos.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `package.json`, `.npmrc`, `astro.config.mjs`,
  `.github/`, `ROADMAP.md`.

## Functionality

1. **GitHub Actions CI**
   - Crear workflow en `.github/workflows/ci.yml`.
   - Usar `npm ci` (postinstall aplica `patch-package` vía `package.json`).
   - Cache de npm.
   - Ejecutar: `npm run check`, `npm test`, `npm run test:e2e` con Chromium, `npx @wix/cli build`.
   - Artefactos si aplica (build output/logs).

2. **Release con CI**
   - Añadir workflow o job para release manual (`workflow_dispatch`) y/o por tag.
   - Usar `wix release` con credenciales de CI (secrets). **Nunca** commitear secretos.
   - Documentar configuración de secrets.

3. **Env tipado**
   - Definir schema `env` en `astro.config.mjs` con `envField` para config no-Wix.
   - Documentar `wix env set` / `wix env pull`.
   - Crear `.env.example` sin secretos con variables necesarias.
   - Actualizar `.gitignore` si necesario (mantener `.env` fuera del repo).

4. **Verificación**
   - Validar que CI corre localmente conceptualmente y que los comandos existen.
   - Verificar que `patch-package` se aplica en CI con `npm ci`.

## Pages / Sections

- Sin páginas nuevas.

## Design

- Sin cambios de diseño.

## Wix wiring

- `wix release` vía CI con credenciales gestionadas por secrets.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Workflow CI creado y con pasos correctos
- [ ] `envField` configurado en `astro.config.mjs`
- [ ] `.env.example` creado sin secretos
- [ ] Documentación `wix env set/pull` añadida (README o docs interna)
- [ ] Release por CI configurado sin secretos en repo

## Al terminar

1. Marca el paso 34 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-35-analytics-eventos-faltantes-plataformas-externas-consentimiento-granular` (o `/generate-next-steps`).
