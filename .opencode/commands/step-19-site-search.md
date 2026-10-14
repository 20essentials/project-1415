---
description: Step 19 — Site search · Petals & Predators
---
# Step 19 — Site search

> **Siguiente:** `/generate-next-steps`

## Objetivo

Añadir overlay de búsqueda de productos en el nav (atclado a `/`) que usa `queryProducts` con búsqueda por texto. Debe funcionar sin recarga, con navegación a producto/categoría, accesible (focus trap, ESC, aria) y respetar diseño del sistema.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/components/nav*.astro`, `src/layouts/BaseLayout.astro`, `src/utils/products.ts`, `src/utils/category.ts` (si aplica), `src/i18n/translations.json`, `ROADMAP.md`. Ya existe `queryProducts` en utils (step 5/6).

## Functionality

1. **Componente Search**
   - Crear `src/components/site-search.astro` o `.ts` + markup: botón "Search" en nav, overlay modal (dialog-like) atclado a `/` (raíz). Usar patrón existente de modales/header.
2. **Búsqueda de productos**
   - Implementar búsqueda con `queryProducts` (search por nombre/slug o campos disponibles). Debounce (mín. 150–250ms), mínimo 2 caracteres, manejo de vacío/cargando.
3. **Resultados**
   - Listar productos encontrados (imagen, nombre, precio, categoría). Enlazar a `/products/[slug]`. Mostrar "No results" accesible.
4. **Integración en nav**
   - Añadir trigger de búsqueda en `src/components/nav.astro` y/o `src/components/nav-primary.astro` (desktop+móvil). Mantener orden y evitar wrapping (recordar ajuste step 12).
5. **Accesibilidad**
   - Focus trap, cerrar con ESC, cerrar al click fuera, `aria-modal`, `role="dialog"`, `aria-live` para resultados, focus inicial en input.
6. **Traducciones**
   - Añadir claves `search.*` (placeholder, results, noResults, close) en `src/translations.json` (en/es/it).

## Pages / Sections

- `src/components/site-search.astro` — Overlay + lógica cliente (script ligero TypeScript).
- `src/components/nav*.astro` — Integración del trigger.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- Overlay con backdrop, z-index coherente con header.

## Wix wiring

- Usar `queryProducts` de `@wix/stores` (o pack stores activo) vía runtime autorizado. Búsqueda cliente-side con debounce; no llamar en build. Evitar importar `.wix/seeded.json`.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Trigger "Search" visible en nav (desktop y móvil)
- [ ] Overlay abre/cierra (click, ESC, botón cerrar)
- [ ] Búsqueda con >=2 caracteres devuelve resultados relevantes
- [ ] Click en resultado navega a `/products/[slug]`
- [ ] Estado vacío "No results" accesible
- [ ] Focus trap funciona correctamente

## Al terminar

1. Marca el paso 19 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (o ejecutar cuando se creen nuevos pending).
