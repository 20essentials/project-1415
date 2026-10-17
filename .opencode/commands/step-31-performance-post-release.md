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
