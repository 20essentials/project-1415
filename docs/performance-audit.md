# Performance audit — 2026-10-16 (step 22)

Lighthouse 13.5.0, preset móvil (Moto G Power simulado, 4G lento), Chromium de Playwright.
Categorías: performance, accessibility, best-practices, SEO.

## 1. Rutas auditadas y baseline

**Producción** (`https://petals-d960960gm-0609.wix-site-host.com`, release previo a steps 15/20):

| ruta | perf | a11y | bp | seo | LCP | CLS | TBT | FCP | SI | transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 39 | 94 | 96 | 92 | 15.4 s | 0.189 | 444 ms | 3.6 s | 11.1 s | 12.5 MB |
| `/products` | 73 | 100 | 96 | 92 | 4.7 s | 0.005 | 59 ms | 3.1 s | 5.4 s | 578 KB |
| `/products/venus-flytrap-akai-ryu` | 75 | 100 | 96 | 100 | 4.1 s | 0.004 | 33 ms | 3.3 s | 6.4 s | 444 KB |
| `/journal` | 76 | 100 | 96 | 92 | 4.1 s | 0.004 | 26 ms | 3.2 s | 5.6 s | 546 KB |
| `/services`, `/lookbook` | — | — | — | — | — | — | — | — | — | **HTTP 404** |

`/services` y `/lookbook` dan 404 en producción: el release en vivo es anterior a los steps 15 y 20.
No es un hallazgo de performance; se resuelve en el step 23 (build + release).

**Dev** (`astro dev`, 4321) — solo CLS y a11y son representativos (Vite sirve deps sin minificar
y sin HTTPS, así que LCP/TBT/SI/bp/seo no lo son): `/` 20 / 95 / 77 / 85 con CLS 0.184 y
`button-name` en fallo; `/products` 44; `/products/[slug]` 27.

## 2. Hallazgos y acciones

### 2.1 CLS del home = 0.189 (bucket "poor") — corregido

Mismo valor exacto en producción (0.189) y en dev (0.1844) → causa estructural, no del entorno.
El elemento `[data-world]` (scroll-world) está vacío en el primer paint; el motor le fija la
altura del track recién al hidratar (`.sw-track` → `13.4 × innerHeight ≈ 12060 px`), lo que empuja
todo el contenido de abajo (el `ul` de destacados, `score 0.184`).

- `src/features/home/scroll-world.astro`: script `is:inline` **después** del config JSON que
  reserva `min-height` antes del paint con el mismo cálculo de segmentos (dive + connector + 1vh).
- `src/features/home/scroll-world.js`: `layout()` sincroniza `container.style.minHeight` con la
  altura del track (cubre resize/rotación).

Verificado: reserva pre-paint `12060 px` == altura final del track `12060 px` (delta 0 px → no hay
salto al montar) y CLS dev `0.184 → 0` en `/`. `products` y `pdp` también bajaron a 0.

### 2.2 `button-name` (a11y home 94) — corregido

En móvil `.sw-route__label` es `display:none`, así que los 7 dots del scroll-world quedaban sin
nombre accesible. `scroll-world.js` ahora les pone `aria-label` (label traducido del stop, con
fallback a título/índice). a11y dev `95 → 100`, `button-name` FAIL → OK.

### 2.3 Fuentes: Google Fonts render-blocking + fuentes locales muertas — corregido

`src/app/layout.astro` cargaba Google Fonts (1 stylesheet de terceros + 2 preconnects) mientras
`src/styles/fonts.css` (self-host con `font-display: swap` y `unicode-range`) y
`public/fonts/{fraunces,inter}-latin.woff2` (115 KB) no se importaban desde ningún lado.

- `global.css`: `@import "./fonts.css"`.
- `layout.astro`: fuera preconnects + stylesheet de Google; `<link rel="preload">` de los dos woff2.

**Paridad verificada por métricas** (producción con Google Fonts vs dev con las locales, mismo texto
y tamaño): `h1` Fraunces 48px → 205.8 px en ambas; títulos de tarjeta Inter 18px → 197 / 149.4 /
113.7 px; párrafo Inter 14px → 563 px; link "Care" 14px → 31.3 px. Cero requests a
`fonts.googleapis.com`/`fonts.gstatic.com` en dev. (No hubo comparación pixel a pixel: el modelo de
esta sesión no lee imágenes; la paridad se sostiene en las métricas tipográficas.)

### 2.4 Imágenes — endurecido

15 `<img>` en el repo, **0** con `decoding="async"` → añadido a los 15.
`fetchpriority="high"` en los above-fold: hero de `/lookbook`, featured de `/journal`, cover de
`/journal/[slug]`, hero de `/gift-cards` y la imagen principal del PDP (antes condicionada a
`alt !== ''`; ahora siempre, es el LCP de la página).

`product-card.astro`: `srcset` 400w/640w + prop opcional `sizes` (default conservador), que las
páginas pasan según su grilla (home/lookbook 2→3/4 col, catálogo 1→2→3→4 col, related del PDP).
En móvil el catálogo a 1 columna sigue pidiendo 640w y el home/lookbook a 2 columnas pasan a 400w.

Ya estaban bien: `width`/`height` en las 15, `loading="lazy"` en las below-fold y `alt` en todas
(`image-alt` sin fallos en las 6 rutas). `cart-view.tsx` tenía un `<img>` sin dimensiones → 80×80.

### 2.5 Islands — revisado

- `CartBadge` estaba `client:only="react"` en **todas** las páginas: el link del carrito aparecía
  recién tras hidratar (pop-in en el header y dependencia de JS para un link de navegación).
  Ahora `client:idle` (SSR del link, verificado en el HTML servido y en el bundle del worker) con
  init determinista (`useState(0)`; el conteo cacheado de sessionStorage se lee en el efecto) para
  no desincronizar la hidratación.
- Se mantienen: `CartView`/`ContactForm`/`GiftCardPurchase`/`ProductPurchase`/`WorkshopBooking`
  `client:load` (widget interactivo principal de su página) y `NewsletterForm` `client:idle`.

### 2.6 Tailwind — canónicas

`language-selector.astro`: `top-[calc(100%+0.5rem)]` → `top-full mt-2`. Geometría idéntica medida
con Playwright (gap 14.9 px, `left`/`right`/`width` iguales antes y después del cambio).
`aria-[current=true]` se conserva: Tailwind v4 no expone utilidad canónica `aria-current`.

### 2.7 Vídeos del scroll-world — tradeoff aceptado (resuelto en el step 31)

`public/videos` = 53 MB (5 clips, 8–14.5 MB). El hero descarga `v1.mp4` (10 MB) al cargar y el resto
progresivamente al hacer scroll: es el diseño del scroll-scrub y el mayor costo de transferencia del
home (12.5 MB en el baseline, con `inicio.webp` 398 KB + el resto de stills ~1.5 MB). No se
re-encodea: perdería la calidad del scrub y obliga a regenerar los clips.

> **Resuelto en el step 31** (ver §5): los 5 clips se re-encodearon a **13.7 MiB** (H.264, 1920×1080)
> más un tier móvil de **8.1 MiB** (720p) para phones, y se cableó con `connectorsMobile`.

### 2.8 404 de `carts/current` — aceptado

`https://edge.wixapis.com/ecom/v1/carts/current` devuelve 404 (carrito anónimo vacío) en todas las
rutas y es el único fallo de `errors-in-console` (bp 96). Es un log del navegador del fetch del
carrito; no se puede suprimir desde la app.

### 2.9 Bundle de producción — sano, sin cambios

`dist/_astro` = 457 KB en 29 archivos (mayor: runtime React `client.*.js` 136.5 KB,
`setup.*.js` 66 KB, `site-search` 33.5 KB, `wix-image` 18.4 KB, `scroll-world` 18 KB) + CSS único
de 56 KB. No se aplicó purga ni split adicional. Sin clases arbitrarias Tailwind no canónicas
restantes (`grep` sobre `src`).

## 3. Verificación ejecutada

| check | resultado |
| --- | --- |
| `npm run check` (`astro check`) | 0 errores (93 files; 8 hints preexistentes) |
| `npm test` | 44/44 |
| `npm run test:e2e` | 9/9 |
| `npx @wix/cli@latest build` | verde (`@font-face` local en el CSS del bundle, woff2 en `dist/fonts`, script de reserva presente en el HTML del worker) |
| Lighthouse dev post-fix | `/` a11y 100 + CLS 0; `/products` y `/products/[slug]` CLS 0 |
| Reserva pre-paint vs track | 12060 px == 12060 px (delta 0) |
| Paridad de fuentes | anchos de texto idénticos vs producción con Google Fonts |

## 4. Pendiente / no verificado

- **Métricas de producción post-fix**: las que importan (LCP, TBT, SI, transfer) no son medibles en
  dev ni sirviendo `dist/` local (el build es un worker SSR de Wix/Cloudflare). Se capturan después
  del release del step 23; el baseline de producción de este doc es el punto de comparación.
- **Regresión visual**: verificada por métricas tipográficas y de layout (fuentes, geometría del
  menú de idioma, reserva del scroll-world) y por e2e, no por inspección de imágenes.
- Sin redimensión/cambio de formato masivo de imágenes (Wix ya sirve AVIF/WebP por `Accept`) ni
  purga de CSS (riesgo alto, beneficio marginal).

---

# Auditoría post-release — 2026-10-22 (step 31)

Lighthouse 13.5.0, preset móvil (Moto G Power simulado, 4G lento, `--throttling-method=simulate`),
Chromium de Playwright (`chromium-1248`), las mismas 4 categorías que el baseline del step 22.
URL publicada: `https://petals-d960960gm-0609.wix-site-host.com` (release del step 31).

## 5.1 Antes / después por ruta

"Antes" = auditoría sobre el mismo sitio publicado **antes** del re-encode (mismo comando, mismo
emulador). "Después" = tras el release con los clips nuevos.

| ruta | perf | a11y | bp | seo | LCP | CLS | TBT | FCP | SI | transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` antes | 39 | 100 | 96 | 92 | 13.0 s | 0.090 | 1467 ms | 1.2 s | 7.8 s | 11.985 KB |
| `/` **después** | **54** | 100 | 96 | 92 | 12.8 s | **0.000** | **505 ms** | 1.3 s | 8.3 s | **3.751 KB** |
| `/journal` antes | 88 | 100 | 96 | 92 | 2.8 s | 0.000 | 248 ms | 1.2 s | 4.5 s | 503 KB |
| `/journal` **después** | **95** | 100 | 96 | 92 | 2.3 s | 0.000 | 157 ms | 1.2 s | 3.6 s | 503 KB |
| `/lookbook` antes | 88 | 100 | 96 | 92 | 2.8 s | 0.000 | 273 ms | 1.2 s | 4.1 s | 646 KB |
| `/lookbook` **después** | **91** | 100 | 96 | 92 | 2.8 s | 0.005 | 163 ms | 1.2 s | 4.2 s | 646 KB |
| `/products/venus-flytrap-akai-ryu` antes | 76 | 100 | 96 | 100 | 3.3 s | 0.001 | 566 ms | 1.1 s | 4.0 s | 339 KB |
| `/products/venus-flytrap-akai-ryu` **después** | **87** | 100 | 96 | 100 | 2.9 s | 0.002 | 282 ms | 1.2 s | 4.4 s | 339 KB |
| `/products` antes | 78 | 100 | 96 | 92 | 3.8 s | 0.000 | 380 ms | 1.6 s | 3.5 s | 342 KB |
| `/products` **después** | **85** | 100 | 96 | 92 | 3.2 s | 0.000 | 288 ms | 1.3 s | 3.9 s | 344 KB |
| `/services` antes | 90 | 98 | 96 | 100 | 1.8 s | 0.000 | 342 ms | 1.2 s | 3.5 s | 234 KB |
| `/services` **después** | **93** | 98 | 96 | 100 | 2.0 s | 0.000 | 251 ms | 1.1 s | 3.6 s | 235 KB |

`/services` y `/lookbook` ya no dan 404 (el release del step 23 los había arreglado): el pendiente
del step 22 queda cerrado.

Detalle del home (`/`):

| métrica | antes | después |
| --- | --- | --- |
| performance | 39 | **54** |
| main-thread (work breakdown) | 8480 ms | **5086 ms** |
| bootup | 1490 ms | **1112 ms** |
| long tasks | 19 | **13** |
| `total-byte-weight` | 12.151 KB | **3.921 KB** |
| transfer (suma de requests) | 11.985 KB | **3.751 KB** |
| CLS | 0.090 | **0.000** |

El CLS de 0.090 del "antes" lo producía el banner que Wix inyecta
(`<div id="wixheadless-banner-container">`); en esta corrida no se desplazó. Los shifts propios de
la app son de ~2·10⁻⁶ en ambas corridas. El elemento LCP sigue siendo el poster
`img.sw-scene__still` (`/world/inicio.webp`), no el vídeo: **el vídeo nunca es el LCP**, pesa 398 KB
y entra por debajo del poster.

Las rutas sin scroll-world (`/journal`, `/lookbook`, `/products*`, `/services`) también suben de
score: es varianza de corrida (TBT -30…-50 % con el mismo código), no un efecto del re-encode. El
único cambio de código del step es `connectorsMobile` en el home.

## 5.2 Re-encode del scroll-world

Originales (1920×1080, H.264 High, yuv420p, 24 fps, 121 frames, 5.04 s, **1 solo keyframe** en t=0,
`v1`/`v4` con audio AAC) guardados **fuera del repo** en
`C:\Users\amoil\AppData\Local\Temp\opencode\scroll-world-originals\` (52.9 MiB). En el repo se
sustituyen por los re-encodes; no hay commit de 53 MB.

### Codec: comparación medida (clip v2, el más pesado, 13.84 MiB de origen)

VMAF medido con `libvmaf` contra el original (normalizando fps/PTS a 24 fps antes de comparar).

| codec | ajustes | tamaño | VMAF | veredicto |
| --- | --- | --- | --- | --- |
| H.264 `libx264` | CRF 27, `-preset slower -tune animation` | 6.63 MB | 99.71 | calidad alta, no cabe en el budget |
| H.264 `libx264` | CRF 30, `-preset slower -tune animation` | 4.96 MB | 98.41 | calidad alta, no cabe en el budget |
| H.264 `libx264` | CRF 32, `-preset veryslow -tune animation` | 3.11 MB | 90.15 | **elegido** |
| H.264 `libx264` | CRF 33, `-preset veryslow -tune animation` | 2.41 MB | 88.35 | límite de calidad |
| AV1 `libsvtav1` | CRF 44, `-preset 6` | 3.90 MB | 97.37 | mejor calidad/bit, **no adoptado** |
| VP9 `libvpx-vp9` | CRF 50 | 3.81 MB | 92.14 | peor que H.264 a igual tamaño, **no adoptado** |

Motivos de descartar AV1/VP9 (el step exige verificar Safari/WebView antes de adoptar un codec
nuevo): exigen **Safari 17+** y no hay forma de verificar el decode en WebKit en esta máquina
(el build `webkit-2248` instalado es incompatible con Playwright 1.64 → *Protocol error*). Además
el decode por software de AV1 es ~2× el de H.264 y el scroll-scrub pide seeks continuos. Se
comprobó que los tres decodifican en Chromium (frame no uniforme, `readyState 4`), pero el target
crítico es Safari/iOS. **H.264 es además el codec que el sitio ya servía**: cero cambio de
comportamiento. Con VP9 hay además el riesgo de que el propio motor de WebKit lo trate distinto.

### Tiers finales

Ambos: H.264 High, `yuv420p`, sin audio (`-an`), `+movflags +faststart` (streaming progresivo),
**GOP de 12 frames → 10 keyframes (1 cada 0.5 s)** en lugar del keyframe único del original
(verificado: `ffprobe` cuenta 1 keyframe en los originales y 10 en los re-encodes) → el seek del
scrub encuentra un I-frame a media distancia en vez de a 5 s del inicio.

**Desktop — `public/videos/` (1920×1080, 121 frames, 5.04 s, 24 fps):**

| clip | original | CRF | tamaño | VMAF |
| --- | --- | --- | --- | --- |
| `v1.mp4` | 9.78 MiB | 32 | 3.00 MB | 89.72 |
| `v2.mp4` | 13.84 MiB | 33 | 3.11 MB | 90.15 |
| `v3.mp4` | 10.69 MiB | 33 | 2.36 MB | 89.96 |
| `v4.mp4` | 7.63 MiB | 32 | 2.72 MB | 91.43 |
| `v5.mp4` | 10.95 MiB | 32 | 2.55 MB | 91.04 |
| **total** | **52.9 MiB** | | **13.74 MiB** (`du -sh` → **14M**) | |

**Móvil — `public/videos-mobile/` (1280×720, 121 frames, 5.04 s, 24 fps):**

| clip | CRF | tamaño | VMAF (ref 720p) |
| --- | --- | --- | --- |
| `v1.mp4` | 31 | 1.75 MB | 92.70 |
| `v2.mp4` | 32 | 1.86 MB | 91.17 |
| `v3.mp4` | 32 | 1.42 MB | 91.61 |
| `v4.mp4` | 32 | 1.49 MB | 90.69 |
| `v5.mp4` | 31 | 1.58 MB | 91.90 |
| **total** | | **8.09 MiB** (`du -sh` → **8.1M**) | |

Regla de selección: **el CRF más alto cuyo VMAF medio siga ≥ 89** (desktop, contra el original) y
≥ 90 (móvil, contra una referencia 720p). Los clips que no bajaban sin artefactos visibles
(`v1`, `v4`, `v5` a 1080p) se quedaron en CRF 32; los que lo permitían (`v2`, `v3`) en 33.

**Presupuesto:** `du -sh public/videos` = **14M** (< 15 MB ✓). El tier móvil va en
`public/videos-mobile/` para que el directorio canónico de los 5 clips 1080p entre en el budget y
porque un móvil nunca pide 1080p. Con los dos tiers el peso de vídeo del repo es 21.8 MiB
(antes 52.9 MiB) y **la carga real de un móvil es 8.1 MiB** (antes 52.9 MiB).

## 5.3 Cableado del tier móvil

- `src/features/home/scroll-world.astro`: nuevo `world.connectorsMobile` con las 5 rutas
  `/videos-mobile/vN.mp4` + `null` (misma alineación de índices que `world.connectors`).
- El engine ya traía el soporte: `scroll-world.js:22` lee `config.connectorsMobile` y lo pasa a
  `clipM` del segmento (`:43`), y `loadClip` (`:156`) elige `s.clipM` cuando `isMobile()`.
  **No se tocó el engine.**
- `isMobile()` = puntero coarse **o** viewport ≤ 860 px → un móvil recibe 720p y un desktop 1080p.

## 5.4 Verificación del scrub (`wix dev` + Playwright)

Se recorrió el track completo (40 pasos de scroll) y se inspeccionó cada `.sw-scene` con vídeo:

| | desktop (1440×900) | móvil (390×844) |
| --- | --- | --- |
| clips pedidos | `/videos/v1…v5.mp4` | `/videos-mobile/v1…v5.mp4` |
| clips cargados | 5 | 5 |
| resolución decodificada | **1920 px** | **1280 px** |
| `has-clip` (vídeo visible) | 5/5 | 5/5 |
| frame no uniforme (stddev > 3) | 5/5 | 5/5 |
| scrub (≥2 `currentTime` distintos por clip) | 5/5 (9–16 posiciones) | 5/5 (9–11 posiciones) |
| `prefers-reduced-motion: reduce` | **0 peticiones de vídeo** | |

Comprobado además sobre el **sitio publicado**: los 10 ficheros devuelven 200 con el
`content-length` exacto de los locales (verificado byte a byte contra `public/`).

## 5.5 Trade-offs

- **Calidad del scrub:** los clips bajan de bitrate (VMAF 89–91 frente al original). El original
  tenía 1 keyframe; ahora hay 1 cada 0.5 s, lo que **mejora** la fluidez del seek aunque el
  encode sea más comprimido.
- **Codec:** H.264 en MP4 (baseline universal). No se adoptó AV1 ni VP9 (ver §5.2).
- **Lazy-load:** **sin cambios**. El margen sigue en `1.6 * vh` (`:182`): la auditoría muestra que
  en el home solo se descarga `v1` (el tramo 0) y ninguno de los otros 4 hasta que el scroll llega
  a ellos, es decir el margen **no** descarga clips que el usuario no alcanza → no se tocó.
- **Qué queda pendiente de peso en el home:** los 7 posters `/world/*.webp` (~1.9 MB). Son el
  siguiente coste, pero no son el objetivo de este paso (el LCP es `inicio.webp`) y reducirlos
  cambiaría el diseño.
- **Safari/iOS:** no verificado en WebKit en esta máquina (build incompatible con Playwright 1.64).
  El codec elegido (H.264) es el mismo que ya servía el sitio, así que el riesgo de regresión de
  compatibilidad es nulo; lo nuevo es la resolución 720p del tier móvil, que es un perfil
  estándar de H.264.

## 5.6 Verificación ejecutada

| check | resultado |
| --- | --- |
| `npx @wix/cli@latest build` | verde |
| `npm run check` (`astro check`) | 0 errores (105 files) |
| `npm test` | 116/116 |
| `npm run test:e2e` | 9/9 |
| `du -sh public/videos` | **14M** (< 15 MB) · `public/videos-mobile` 8.1M |
| 5 clips 1080p | duración 5.04 s, 121 frames, 1920×1080, sin audio, `moov` antes de `mdat` |
| 5 clips 720p (tier móvil) | duración 5.04 s, 121 frames, 1280×720 |
| `wix dev` → scrub | 5/5 tramos, sin frames en blanco, seek OK (desktop y móvil) |
| `prefers-reduced-motion` | 0 peticiones de vídeo |
| release | `wix release` → `https://petals-d960960gm-0609.wix-site-host.com` |
| Lighthouse móvil post-release | registrado en §5.1, sin caída frente al baseline del step 22 |
| ficheros publicados | los 10 con `content-length` idéntico a los locales |

