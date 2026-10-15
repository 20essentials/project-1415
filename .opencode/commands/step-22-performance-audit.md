---
description: Step 22 — Performance audit · Petals & Predators
---
# Step 22 — Performance audit

> **Siguiente:** `/step-23-build-and-release` (si aún no existe → `/generate-next-steps`)

## Objetivo

Auditar rendimiento (Lighthouse), optimizar imágenes/formatos, revisar fuentes y bundle sin romper diseño. Documentar hallazgos y aplicar ajustes mínimos/seguros. Build verde.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` + tokens. Usar imágenes ya en `public/`/CMS/Media Manager (Wix gestiona muchas).
- **Referencias:** Lighthouse, Core Web Vitals (LCP, CLS, INP/TBT), imágenes responsive, `loading="lazy"`, `decoding="async"`, `fetchpriority`.

## Functionality

1. **Auditoría base**
   - Ejecutar Lighthouse en rutas clave: `/`, `/products`, `/products/[slug]` (muestra), `/services` (si existe), `/lookbook`, `/journal`. Registrar: Performance, Accessibility, Best Practices, SEO, LCP, CLS, TBT/INP.
   - Revisar bundles: `wix build` → chunks (`gift-card-purchase`, `newsletter-form`, islands). Ver si se puede reducir client JS innecesario.

2. **Imágenes**
   - Verificar formatos (AVIF/WebP preferidos donde posible). Las imágenes de Media Manager/Wix suelen servir optimizadas; no re-encodear masivamente sin necesidad.
   - Añadir `loading="lazy"` en imágenes no críticas (below fold), `decoding="async"`. Hero/above-fold: evaluar `fetchpriority="high"` + `loading="eager"`.
   - Comprobar `width/height` para evitar CLS (si faltan, añadir donde seguro).
   - Asegurar `alt` descriptivo (no decorativo vacío innecesario).

3. **Fuentes**
   - Revisar `@font-face`/Google Fonts en `global.css`. Preload crítico si aplica, `font-display: swap`. Evitar múltiples families innecesarias.

4. **CSS/JS**
   - Revisar clases arbitrarias Tailwind no canónicas (volver a canónicas si aparecen). Ver `@apply` con `@reference` (ya aplicado donde corresponde).
   - Reducir CSS no usado? Preferir no purgar globales manualmente (riesgo). Mantener cambios mínimos.
   - Islands: confirmar `client:*` apropiado (`idle` vs `load` vs `visible`).

5. **Documentar**
   - Crear `docs/performance-audit.md` breve con: fecha, rutas auditadas, métricas, hallazgos, acciones aplicadas, tradeoffs.

## Pages / Sections

- `docs/performance-audit.md` — Registro de auditoría (nuevo, no rompe build).

## Design

- Sin cambios visuales drásticos. Ajustes solo optimización.

## Wix wiring

- N/A (optimización estática/markup).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `docs/performance-audit.md` creado con hallazgos
- [ ] Sin regresiones visuales evidentes (hero, nav, PDP)
- [ ] CLS no aumenta (chequeo rápido en rutas clave)
- [ ] Accesibilidad/Lighthouse sin caer por cambios

## Al terminar

1. Marca paso 22 `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-23-build-and-release` (o `/generate-next-steps`).
