---
description: Step 21 — Build + release (sitio en vivo) · Petals & Predators
---
# Step 21 — Build + release (sitio en vivo)

> **Siguiente:** no hay — si el proyecto continúa, ejecuta `/generate-next-steps`
> para materializar los próximos pasos del ROADMAP.

## Objetivo

Compilar, publicar el sitio en Wix y entregar el resumen final (URL pública +
dashboard) actualizando `AGENTS.md`.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Comandos:** !`ls .opencode/commands` · **Páginas finales:** !`find src/pages -name "*.astro" 2>/dev/null`

## Functionality

1. **Build:**
   ```bash
   npx @wix/cli@latest build
   ```
   - Falla → leer `.wix/debug.log`. Errores conocidos:
     `Missing environment variable WIX_CLIENT_ID` → `npx @wix/cli@latest env pull --json` y reintentar;
     `Cannot find module '@wix/…'` → `npm install --legacy-peer-deps <paquete>`;
     `Legacy HTML single-line comments` → comentarios HTML dentro de frontmatter `.astro` → moverlos a `//`.
   - **No reintentar ciegamente un build roto — son bugs de código, arreglar.**
2. **Release:**
   ```bash
   npx @wix/cli@latest release
   ```
   Extraer la URL de la línea `Site published on <url>`. Errores transitorios
   (`ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`, `STATE_MISMATCH`, "temporarily
   unavailable") → reintentar hasta 3× con backoff `intento * 5`s.
3. **Smoke test de la publicada:** `/` (hero+nav+footer), `/products`,
   un PDP, add-to-cart → badge, `/cart`, `/about`, `/contact`.
4. **Actualizar `AGENTS.md`** (raíz): descripción final del sitio — páginas,
   features (Stores, checkout nativo, Forms), design system, comandos de
   build/release, y el estado del roadmap.
5. **ROADMAP:** marca el paso 21 como `done`.

## Verificación

- [ ] Build verde y release sin errores
- [ ] URL pública responde 200 y se ve correcta (desktop + móvil)
- [ ] Dashboard: `https://manage.wix.com/dashboard/<siteId>`
- [ ] `AGENTS.md` refleja el sitio real

## Al terminar

Resumen al usuario, **primero la URL en negrita**, después el dashboard link.
Si el proyecto sigue creciendo → `/generate-next-steps`.
