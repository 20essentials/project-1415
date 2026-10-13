---
description: Step 0 — Scaffold + Wix setup · Petals & Predators
---
# Step 0 — Scaffold + Wix setup

> **Siguiente:** `/step-1-create-hero-section`

## Objetivo

Que exista un proyecto Astro + Wix Headless vivo en esta carpeta: sesión CLI
autenticada, proyecto scaffolded y aplanado en CWD, dependencias instaladas con
`--legacy-peer-deps`, apps de Wix (Stores + Forms) instaladas, `.env.local` con
`WIX_CLIENT_ID`, y `wix.config.json` con `siteId`/`appId` válidos.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado actual:** !`ls src/pages 2>/dev/null || echo "(sin proyecto aún)"` · !`ls .opencode/commands`

## Functionality

1. **Auth CLI** (interactivo — avísale al usuario):
   ```bash
   npx @wix/cli@latest whoami || npx @wix/cli@latest login
   ```
   `login` imprime URL + código en stderr y espera el flujo del browser. No continúes sin sesión activa.
2. **Scaffold** (desde CWD, crea subdir y lo aplana en CWD — un solo `.wix/`):
   ```bash
   bash "C:\Users\amoil\.agents\skills\wix-headless\scripts\scaffold.sh" "petals-predators" "Petals & Predators" --frontend astro
   ```
   (Corre `npm create @wix/new@latest headless --business-name "Petals & Predators" --folder-name petals-predators --site-template --no-publish --skip-install` + flatten. Exit ≠ 0 → muestra stderr y detente.)
3. **Instalar dependencias** — npm (`.npmrc` aplica `legacy-peer-deps`):
   ```bash
   npm install --no-fund --no-audit \
     @wix/sdk @wix/stores @wix/ecom @wix/redirects @wix/forms \
     tailwindcss @tailwindcss/vite
   ```
4. **Leer config:** extrae `siteId` y `appId` de `wix.config.json` (guárdalos — los usarás todo el run).
5. **Instalar apps Wix** (SKILL_ROOT/references/SETUP.md § 4a; packs cargados `stores` y `forms`; `ecom` no tiene app):
   ```bash
   TOKEN=$(npx @wix/cli@latest token --site "$SITE_ID")
   # Wix Stores:
   curl -sS -X POST "https://www.wixapis.com/apps-installer-service/v1/app-instance/install" \
     -H "Authorization: Bearer $TOKEN" -H "wix-site-id: $SITE_ID" -H "Content-Type: application/json" \
     -d '{"tenant":{"tenantType":"SITE","id":"'"$SITE_ID"'"},"appInstance":{"appDefId":"215238eb-22a5-4c36-9e7b-e7c08025e04e","enabled":true}}'
   # Wix Forms (mismo body, appDefId "225dd912-7dea-4738-8688-4b8c6955ffc2")
   ```
   200 = OK. 401 persistente → sesión expirada, repetir `login`.
6. **Variables de entorno** (siempre `--json`; sin él el spinner inunda la salida):
   ```bash
   npx @wix/cli@latest env pull --json
   ```

## Verificación

- [ ] `wix.config.json` tiene `siteId` y `appId` no vacíos
- [ ] `.env.local` contiene `WIX_CLIENT_ID`
- [ ] `node_modules/` existe y `npx @wix/cli@latest whoami` funciona
- [ ] Ambos install de apps devolvieron `200`
- [ ] `ROADMAP.md` existe en la raíz

## Al terminar

1. Marca el paso 0 como `done` en `ROADMAP.md` (nota cualquier desviación).
2. Siguiente: `/step-1-create-hero-section`
