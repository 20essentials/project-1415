---
description: Step 17 — Gift cards landing · Petals & Predators
---
# Step 17 — Gift cards landing

> **Siguiente:** `/step-18-newsletter-signup`

## Objetivo

Activar el pack `gift-cards` (actualmente en `disabledPacks`) para exponer una landing `/gift-cards`, añadir el enlace en la navegación y montar la sección en la home. Quedará una página funcional compilando con Astro/Wix.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/pages/`, `src/components/`, `.opencode/commands/`, `ROADMAP.md`, `src/wix/apps.ts`, `src/i18n/translations.json`, `src/config/site.ts`, `src/pages/index.astro`.

## Functionality

1. **Activar pack Gift Cards**
   - Editar `src/wix/apps.ts`: mover/añadir `gift-cards` desde `disabledPacks` a los packs activos conforme a la configuración del proyecto (ver imports `WixAppDef` y estructura existente). Asegurar que solo se habilita lo necesario.
2. **Añadir navegación**
   - Editar `src/config/site.ts`: incluir enlace "Gift Cards" / traducción clave en `site.nav` y/o `site.navPrimary` siguiendo convención existente.
3. **Crear landing `/gift-cards`**
   - Crear `src/pages/gift-cards.astro` con estructura consistente (layout, hero, copy CTA, info de gift cards) usando tokens (`var(--color-*)`) y clases Tailwind canónicas.
4. **Montar en home**
   - Editar `src/pages/index.astro`: descomentar/montar la sección `<!-- home:gift-cards -->` que ya existe como marcador (o renderizar el componente/markup correspondiente) para enlazar a `/gift-cards`.
5. **Traducciones (si faltan)**
   - Añadir claves necesarias en `src/translations.json` (en/es/it) para textos de gift cards/CTA siguiendo el formato plano existente (no romper). Solo añadir si no existen.

## Pages / Sections

- `src/pages/gift-cards.astro` — Landing de gift cards con hero + CTA + notas informativas.
- `src/pages/index.astro` — Monta sección gift cards antes/después según layout (ver marcador `<!-- home:gift-cards -->`).
- `src/config/site.ts` — Añade enlace "Gift Cards".

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- Reutilizar patrones existentes (hero, botón primario, grid) sin clases arbitrarias.

## Wix wiring

- Pack `gift-cards` activo en `src/wix/apps.ts`. No importar `.wix/seeded.json` en rutas `.astro`. Si se necesita contenido dinámico, usar queries `@wix/gift-cards` vía runtime autorizado; mantener estático el landing si no requiere datos.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/gift-cards` renderiza correctamente (200 en build/preview)
- [ ] Enlace "Gift Cards" visible en nav (desktop/móvil según layout)
- [ ] Sección gift cards visible en home con link a `/gift-cards`
- [ ] No hay regresiones en rutas existentes

## Al terminar

1. Marca el paso 17 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-18-newsletter-signup` (o `/generate-next-steps`).
