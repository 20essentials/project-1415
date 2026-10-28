---
description: Step 31 — Performance post-release + vídeo · Petals & Predators
---
# Step 31 — Performance post-release + vídeo

> **Siguiente:** `/generate-next-steps` (si aparece un nuevo item `pending` en el roadmap)

## Objetivo

Re-auditar Lighthouse sobre el sitio **publicado** (cierre del pendiente del step 22) y bajar el peso del scroll-world re-encodeando los 5 clips de vídeo (53 MB → objetivo <15 MB), sin regresiones de CLS ni de calidad visual; dejar `docs/performance-audit.md` actualizado.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `docs/performance-audit.md` (baseline del step 22: `/` 39 perf / CLS 0.189 / 12.5 MB, etc.), `src/features/home/scroll-world.astro` (`world.connectors` = 5 rutas `/videos/vN.mp4` + `null`, reserva pre-paint de altura), `src/features/home/scroll-world.js` (engine), `public/videos/` (v1–v5, **~53 MB**), `public/world/*.webp` (posters, ~1.9 MB), `ROADMAP.md`.
- **URL publicada (step 23):** `https://petals-d960960gm-0609.wix-site-host.com` (preview `dcpyuf-…`, alias `hbinsl-…`). Lighthouse solo es fiable en el sitio **publicado**, no en `wix dev`.
- **Engine (`scroll-world.js`):** `loadClip(s)` **ya es lazy por tramo** (`if (y > s.start - 1.6*vh && y < s.end + 1.6*vh) loadClip(s)`, línea ~182) y bajo `prefers-reduced-motion` no carga clips. Existe soporte `connectorsMobile` (`s.clipM`) y `primeVideo` para iOS. **No** reescribir el engine; el foco es el **peso del archivo** y, opcional, afinar el margen.
- **Herramientas:** `ffmpeg 8.1.2` disponible (codecs `libx264`, `libx265`, `libvpx-vp9`, `libaom-av1`, `libsvtav1`). Los clips no llevan audio (se sirven mudos para scrub).

## Functionality

1. **Baseline + post-release (Lighthouse)**
   - Antes de tocar assets, correr Lighthouse **móvil** sobre la URL publicada en `/`, `/products`, `/products/<slug>`, `/services`, `/lookbook`, `/journal`; registrar Performance/LCP/CLS/TBT y peso transferido por ruta.
   - Comparar contra el baseline del step 22 (`docs/performance-audit.md`): confirmar que el 404 de `/services`/`/lookbook` está resuelto y anotar deltas.
2. **Re-encode de los clips (`public/videos/v1…v5.mp4`)**
   - Guardar los originales fuera del repo (p. ej. `C:\Users\amoil\AppData\Local\Temp\opencode\scroll-world-originals\`) para poder comparar; no commits de 53 MB.
   - Re-encodear a H.264 de alta compatibilidad, sin audio, `+faststart` para streaming progresivo, y **CRF** ajustado a calidad visual equivalente:
     - `ffmpeg -i vN.mp4 -an -c:v libx264 -crf 27 -preset slower -pix_fmt yuv420p -movflags +faststart vN.mp4`
   - Si el peso no baja del objetivo, evaluar `libx265`/`libvpx-vp9` (mejor compresión, más coste de encode) — **verificar** que el navegador objetivo (Safari/iOS incluido) reproduce el codec elegido antes de adoptarlo; el engine usa `URL.createObjectURL(blob)` + seek, así que el contenedor/codec debe soportar seeking.
   - Objetivo: **total < 15 MB** (≈ 3 MB/clip). Si un clip no baja sin artefactos visibles a pantalla completa, subir su CRF y anotarlo.
3. **Encode móvil opcional (mejora)**
   - Si queda margen, generar un encode de menor resolución para móvil (p. ej. 720p / `-crf 30`) y cablearlo con `connectorsMobile` en `world` (`scroll-world.astro`) para que phones sirvan el clip ligero (`s.clipM`); el engine ya elige por `isMobile()`.
4. **Afinado opcional del lazy-load (solo si aporta)**
   - El margen actual es `1.6 * vh` a cada lado del tramo. Si la auditoría muestra que se descargan clips que el usuario no alcanza, reducirlo (p. ej. `1.0 * vh`) en `scroll-world.js` — cambio mínimo y medido, no reescritura.
5. **`docs/performance-audit.md`**
   - Añadir una sección **post-release**: fecha, URL, métricas por ruta (antes/después), peso del scroll-world (53 MB → nuevo total), acciones aplicadas, tradeoffs (calidad de scrub, codecs soportados, margen de lazy-load).
6. **Sin cambios funcionales**
   - No tocar la lógica de secciones/copys ni el pre-paint reserve (evitar regresiones de CLS). Solo assets y, si acaso, el margen del `loadClip`.

## Pages / Sections

- `src/pages/index.astro` (home) — sin cambios de markup; el scroll-world sirve clips más livianos.
- `docs/performance-audit.md` — sección post-release con métricas y acciones.

## Design

- Sin cambios visuales: el scrub debe verse **igual** en desktop y móvil; validar un par de tramos a pantalla completa antes/después del re-encode.
- Tokens/Tailwind intactos; transiciones y `prefers-reduced-motion` sin tocar.

## Wix wiring

- No aplica (assets estáticos servidos desde `public/`). No hay llamadas a SDK en este paso.
- `.wix/seeded.json` no se toca.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde · `npm run test:e2e` 9/9
- [ ] `public/videos/` total **< 15 MB** (medir con `du -sh`); los 5 clips existen y su duración/resolución originales se conservan
- [ ] `wix dev`: `GET /` → 200; el scroll-world hace scrub correctamente en los 5 tramos (sin frames en blanco ni saltos) y con `prefers-reduced-motion` no carga clips
- [ ] Lighthouse móvil post-release registrado en `docs/performance-audit.md` para las rutas auditadas; sin caída frente al baseline del step 22
- [ ] CLS del home no empeora (comparar con el valor post-fix del step 22) y el peso transferido de `/` baja de forma medible
- [ ] Si se adoptó un codec nuevo (VP9/AV1): reproducción + seeking verificados en Chromium **y** WebKit/WebView (Safari), no solo en el navegador de escritorio de desarrollo

## Al terminar

1. Marca el paso 31 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/generate-next-steps` (si el roadmap deja nuevos items `pending`).

## Resultado

Lighthouse móvil re-auditado sobre **producción** (mismo comando y emulador que el baseline del step 22): `/` perf **39 → 54**, CLS **0.090 → 0.000**, TBT **1467 → 505 ms**, transfer **11.985 KB → 3.751 KB**, main-thread **8480 → 5086 ms**, long tasks **19 → 13**; `/journal` 88→95, `/lookbook` 88→91, `/products` 78→85, PDP 76→87, `/services` 90→93 (sin caída; el resto es varianza de corrida). **Vídeo re-encodado**: originales 1920×1080 H.264 24fps 5.04s **52.9 MiB** (1 solo keyframe) guardados fuera del repo en `C:\Users\amoil\AppData\Local\Temp\opencode\scroll-world-originals\`; los 5 clips 1080p re-encodados a **13.74 MiB** (`du -sh public/videos` → **14M** < 15 MB ✓) con **CRF por clip** (32/33/33/32/32), elegido como el más alto que mantiene VMAF ≥ 89 medido con `libvmaf` (89.72–91.43) — sin audio, `+faststart`, GOP 12 (10 keyframes en vez de 1) → seek del scrub más fluido; **tier móvil** 1280×720 en `public/videos-mobile/` (**8.09 MiB**, VMAF 90.7–92.7) cableado con `world.connectorsMobile` → `connectorsMobile` → `clipM` (el engine ya lo soportaba; **no se reescribió**). Codecs evaluados con VMAF: H.264 CRF32 (3.11 MB / 90.15, **elegido**), AV1 SVT CRF44 (3.90 MB / 97.37, **descartado**: exige Safari 17+ y no hay WebKit verificable en esta máquina — `webkit-2248` es incompatible con Playwright 1.64), VP9 CRF50 (3.81 MB / 92.14, **descartado**); se conserva **H.264**, el codec que ya servía el sitio. **Verificado:** `wix build` verde · `npm run check` 0 errores (105 files) · `npm test` 116/116 · `npm run test:e2e` 9/9 · `du -sh public/videos` 14M y `public/videos-mobile` 8.1M · 10 ficheros con duración 5.04s / 121 frames / faststart y `content-length` idéntico en producción · `wix dev` + Playwright: 5/5 tramos con scrub, `has-clip`, frames no uniformes, 1920px en desktop y 1280px en móvil, y **0 peticiones de vídeo** con `prefers-reduced-motion` · `wix release` a `https://petals-d960960gm-0609.wix-site-host.com` · sección post-release en `docs/performance-audit.md` §5. **No verificado:** decode en Safari/WebKit (build de WebKit incompatible con la versión de Playwright instalada) y el peso de los posters `/world/*.webp` (~1.9 MB), que es el siguiente coste del home y queda fuera del alcance del paso
