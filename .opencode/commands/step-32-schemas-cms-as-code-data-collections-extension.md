---
description: Step 32 — Schemas CMS as code (Data Collections extension) · Petals & Predators
---
# Step 32 — Schemas CMS as code (Data Collections extension)

> **Siguiente:** `/step-33-restock-alerts-event-extension-dashboard-page`

## Objetivo

Codificar las colecciones CMS usadas por el sitio (`care-guides`, `lookbook`, `wishlist`) como una extensión de Data Collections (`wix generate`) para que un clone limpio las reproduzca sin depender solo del seeding manual por REST. Migrar sin perder datos, actualizar el flujo de seeding y `.wix/seeded.json`, registrar con `wix release` y verificar lectura/escritura desde las features.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/`, `src/shared/`,
  `src/app/`, `src/pages/`, `.opencode/commands/`, `ROADMAP.md`, `.wix/seeded.json`,
  `src/features/journal/`, `src/features/lookbook/`, `src/features/wishlist/`.

## Functionality

1. **Auditar colecciones existentes**
   - Revisar `care-guides`, `lookbook` y `wishlist` tal como existen hoy (campos, tipos, permisos, índices si aplica) comparando con lo que usan las features.
   - Documentar diferencias frente al estado actual antes de migrar.

2. **Crear extensión de Data Collections**
   - Ejecutar `wix generate` para crear una extensión de Data Collections.
   - Definir campos/tipos/permisos/indexes equivalentes a `care-guides`, `lookbook` y `wishlist`.
   - Mantener nombres de colección y slugs tal como se usan en código (`care-guides`, `lookbook`, `wishlist`).

3. **Migración sin pérdida de datos**
   - Planificar migración: exportar/respaldar datos existentes antes de aplicar el schema como código.
   - Aplicar la extensión (`wix dev` / flujo de extensiones) verificando que los datos existentes siguen accesibles.
   - Si hay conflictos de permisos, ajustar a los usados por las features (lectura/escritura/elevación donde corresponda).

4. **Actualizar seeding y `.wix/seeded.json`**
   - Actualizar el script/proceso de seeding para ser compatible con el esquema codificado.
   - Actualizar `.wix/seeded.json` con el estado correcto tras la migración.
   - Asegurar que `auth.elevate` sigue funcionando donde las features lo usan (journal/lookbook/wishlist).

5. **Registro y verificación**
   - Registrar con `wix release`.
   - Verificar lectura/escritura desde `src/features/journal/`, `src/features/lookbook/` y `src/features/wishlist/`.
   - Verificar rutas `/journal`, `/journal/[slug]`, `/lookbook`, `/account/wishlist`.

## Pages / Sections

- Sin rutas nuevas obligatorias. Verificar las existentes afectadas por CMS.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- Usar extensiones Data Collections definidas como código.
- Mantener el patrón actual de `auth.elevate` en los data-access de las features.
- `.wix/seeded.json` solo para slugs/IDs de apoyo (nunca importarlo en rutas `.astro`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Datos existentes de `care-guides`, `lookbook`, `wishlist` accesibles tras migración
- [ ] Lectura/escritura verificada desde features afectadas
- [ ] Seeding actualizado y compatible con esquema codificado
- [ ] Extensión registrada con `wix release`

## Al terminar

1. Marca el paso 32 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-33-restock-alerts-event-extension-dashboard-page` (o `/generate-next-steps`).
