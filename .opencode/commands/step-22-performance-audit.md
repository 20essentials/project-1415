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

## Resultado

`docs/performance-audit.md`. Lighthouse móvil sobre producción (baseline: `/` 39 perf / CLS 0.189 / 12.5 MB; `/products` 73, `/products/[slug]` 75, `/journal` 76; **`/services` y `/lookbook` dan 404 en el release vivo** → step 23) y sobre dev (CLS 0.184, a11y 95). Correcciones aplicadas: **(1) CLS home** — reserva de altura del scroll-world pre-paint (`<script is:inline>` tras el config JSON en `scroll-world.astro`) + `layout()` sincroniza `container.style.minHeight` con el track (verificado: 12060 px == 12060 px, CLS dev 0.184 → 0); **(2) a11y** — `aria-label` en los 7 dots `.sw-route__dot` (en móvil su label es `display:none`), a11y 95 → 100; **(3) fuentes** — fuera Google Fonts (stylesheet de terceros + preconnects), `@import "./fonts.css"` + preload de `public/fonts/*.woff2` (115 KB que ya existían sin usar), paridad verificada por métricas de texto contra producción (mismos anchos en Fraunces 48px e Inter 14/18px); **(4) imágenes** — `decoding="async"` en los 15 `<img>`, `fetchpriority="high"` en los 5 above-fold (lookbook/journal/journal-slug/gift-cards/PDP), `srcset` 400w/640w + prop `sizes` en `ProductCard` (lo pasa cada página según su grilla), dimensiones en el img del carrito; **(5) islands** — `CartBadge` pasa de `client:only="react"` a `client:idle` (SSR del link, conteo cacheado leído en el efecto para no romper la hidratación); revisados y sin cambios el resto de `client:*`; **(6) canónicas Tailwind** — `top-[calc(100%+0.5rem)]` → `top-full mt-2` (geometría idéntica medida). Tradeoffs aceptados: 53 MB de vídeos del scroll-scrub sin re-encodear, 404 de `carts/current` (log del navegador), purga de CSS descartada. Verificado: `npm run check` 0 errores, `npm test` 44/44, `npm run test:e2e` 9/9, `wix build` verde. Pendiente: métricas de producción post-fix tras el release (step 23)
