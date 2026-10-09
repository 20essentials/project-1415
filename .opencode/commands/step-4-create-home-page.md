---
description: Step 4 — Home landing scroll-world (código de midudev/mcp-higgsfield-landing + design system) · Petals & Predators
---
# Step 4 — Home landing scroll-world (1:1 del repo midudev, adaptado a la marca)

> **Siguiente:** `/step-5-create-shop-page`

## Objetivo

Replicar la home de https://github.com/midudev/mcp-higgsfield-landing (open source):
misma mecánica de scroll-world (GSAP ScrollTrigger + Lenis, `world.ts`), mismo **design
system** (tokens `bg`/`crema`/`teja`, tipografía Hina Mincho + Zen Kaku Gothic, botones,
máscaras, reveals) y mismas secciones — pero con contenido de **Petals & Predators**
(plantas carnívoras + flores) en inglés y con los **5 vídeos** `v1.mp4`…`v5.mp4` de
`public/videos/`.

> **Decisión de arquitectura (confirmada):** este paso **abandona** el enfoque anterior
> (skill `scroll-world` + `references/scrub-engine.js`). La fuente de verdad del código es
> el repo de midudev. No copiar contenido de Arko (restaurante): solo mecánica y sistema de
> diseño. Mantener atribución del origen en los ficheros que se copien con lógica de
> mecánica (`world.ts`, `motion.ts`, `global.css` → comentario `// Based on
> midudev/mcp-higgsfield-landing`).

## Contexto

- **Marca:** Petals & Predators — plantas carnívoras + flores, sitio en inglés.
- **Fuente del código:** repo clonado en temp como referencia:
  `C:\Users\amoil\AppData\Local\Temp\opencode\higgsfield-landing`
  (si no existe, `git clone --depth 1 https://github.com/midudev/mcp-higgsfield-landing …`).
  Componentes reales allí: `ScrollWorld.astro`, `Stop.astro`, `world.ts`, `motion.ts`,
  `Header.astro`, `Footer.astro`, `Icon.astro`, `Spiral.astro`, `Pending.astro`,
  `Tagline/Dishes/Press/Experiences/Faq/Gift/FinalCta.astro`, `data/arko.ts`,
  `data/schema.ts`, `layouts/Layout.astro`, `styles/global.css`, `scripts/motion.ts`.
- **Design system (adoptado del repo):** tokens `--color-bg:#131209`, `--color-crema:#f3eadb`,
  `--color-teja:#d0703a`, `--ease-fluid:cubic-bezier(0.32,0.72,0,1)`; capa `components` con
  `.btn/.btn-primary/.btn-ghost/.btn-sm`, `.link`, `.mask-arch/.mask-oval/.mask-mirror`,
  `.mirror-frame`, `[data-reveal]`, acordeón `.faq`, `.word` (data-words).
- **Stack:** Astro 5 + Wix Headless. Instalar dependencias nuevas con
  `npm install --legacy-peer-deps gsap lenis @phosphor-icons/core`
  (mecánica del repo las usa; hoy no están en `package.json`).
- **Vídeos (5):** `v1.mp4` … `v5.mp4` en `public/videos/` (1920×1080, H.264, 24 fps,
  ~5 s, con pista de audio que se silencia). Estado actual:
  !`ls public/videos/*.mp4 2>/dev/null || echo "(aún sin vídeos — montar con posters de fallback)"`
- **Datos:** slice `stores` de `.wix/seeded.json` (slugs/IDs de apoyo — las queries al SDK
  van en runtime, no importar seeded.json en la ruta). Los 5 productos están **sin media**
  (`NO-MEDIA`); categorías sembradas. Precios reales: Venus Flytrap $24 · Nepenthes S/M/L
  $24/36/52 · Cape Sundew $18 · Moonlight Orchid $32 · Starter Kit $45.
- **Markers actuales:** !`grep -o 'home:[a-z-]*' src/pages/index.astro 2>/dev/null | sort -u || echo "(revisar markers)"`
  · !`grep -o 'nav:[a-z-]*' src/components/navigation.astro 2>/dev/null | sort -u`
- **Aviso de alcance:** cambiar tokens en `global.css` afecta a `navigation.astro`,
  `footer.astro` y a las páginas de pasos futuros (shop/category/detail). Este cambio es
  explícito (usar el design system del repo); los steps 5–8 se actualizarán después.

## Functionality

### 0. Output format (obligatorio ANTES de codificar)

Correr el intake de `landing-page-design` (A1) adaptado y devolverlo en la respuesta:
- **UNA acción primaria:** comprar una planta → CTA "Shop the collection" → `/products`.
- **Oferta real:** catálogo sembrado con los precios de `.wix/seeded.json` (ver Contexto).
- **Audiencia (asumida):** growers y curiosos que buscan una planta viva y sana con guía.
- **Objeciones (asumidas):** "no sé cuidar plantas", "¿llegará viva?", "¿cuál elijo?".
- **Pruebas reales (copy ya existente):** greenhouse-grown, shipped alive, care guide.
  No inventar cifras, reseñas ni premios.
- **Incluir en el outline:** qué asset va en cada sección y su estado (disponible | PENDIENTE).
  Todo dato que no exista → `PENDIENTE`, nunca inventado.

### 1. Traer el código del repo (adaptar, no copiar a ciegas)

- Clonar/verificar el repo en temp (referencia local).
- Copiar y adaptar a `src/` estos ficheros (siguiendo el patrón de datos del repo:
  un `src/data/site.ts` con `seo`, `paseo`, `links`, `nav`, `faqs`, arrays de productos):
  - `src/scripts/world.ts` — mecánica del paseo, **sin cambios** (es data-driven).
  - `src/scripts/motion.ts` — Lenis + ScrollTrigger + reveal + data-words + espirales.
  - `src/components/ScrollWorld.astro` — el stage del paseo (adaptar paradas y clips).
  - `src/components/Stop.astro` — parada + entrada escalonada del texto.
  - `src/components/Header.astro` — la cabecera píldora flotante (reemplaza `navigation.astro`).
  - `src/components/Icon.astro` — iconos de `@phosphor-icons/core`.
  - `src/components/Spiral.astro`, `src/components/Pending.astro` — motivo/aviso dev.
  - `src/components/Footer.astro` — repintar el footer actual con los tokens nuevos.
  - Secciones del repo: `Tagline` (filosofía), `Dishes`→`Featured`, `Experiences`→`Kits`,
    `Faq`, `FinalCta` (+ `Press`/`Gift` solo como `Pending` si no hay datos reales).
- `src/pages/index.astro`: `Layout` + `ScrollWorld` + `Tagline` + `Featured` + `Kits` +
  `Faq` + `FinalCta`, dejando los marcadores `<!-- home:stores -->` y
  `<!-- home:gift-cards -->` para que los steps futuros los parcheen.
- Eliminar el hero anterior de `index.astro` y lo no usado del scaffold del paso 3.

### 2. El paseo (scroll-world): 6 paradas, 5 clips

Convención del repo: **cada parada tiene un clip que va de ella a la siguiente**; el de la
última parada sigue hasta el final de la sección. Como hay 5 vídeos y 6 paradas, la última
parada (CTA final) va **sin clip** y se apoya en su poster.

| Parada | Id | Still (poster, frame real del vídeo) | Clip |
|---|---|---|---|
| 0 hero | `inicio` | 1er frame de v1 | `/videos/v1.mp4` |
| 1 | `instinct` | 1er frame de v2 | `/videos/v2.mp4` |
| 2 | `collection` | 1er frame de v3 | `/videos/v3.mp4` |
| 3 | `proof` | 1er frame de v4 | `/videos/v4.mp4` |
| 4 | `care` | 1er frame de v5 | `/videos/v5.mp4` |
| 5 CTA final | `tu-casa` | último frame de v5 | — (sin clip) |

- Posters extraídos con ffmpeg a `src/assets/world/*.webp` (importados en `site.ts` como
  `ImageMetadata`, mismo patrón que `src/assets/paseo/` en el repo). Al sacarlos del propio
  mp4 la costura poster↔clip no se nota:
  `ffmpeg -v error -i public/videos/v1.mp4 -frames:v 1 -an src/assets/world/inicio.webp`
  y para el último: `ffmpeg -v error -sseof -0.2 -i public/videos/v5.mp4 -frames:v 1 -an src/assets/world/tu-casa.webp`.
- En `ScrollWorld.astro`, renderizar `<video data-clip data-src={parada.clip}>` **solo**
  cuando la parada tenga clip (la 5 no). `world.ts` ya soporta `clips.length < stops.length`
  (`active = min(clips.length-1, floor(w))` mantiene v5 hasta el final del tramo).
- `focus` por parada: punto horizontal del vídeo (0–100) que destaca en móvil, donde el
  16:9 se recorta (definir uno por frame en `site.ts`).
- Datos y paradas en el frontmatter de `site.ts`/`ScrollWorld.astro` + `.map()`; nunca
  markup pegado.

**Paradas propuestas (ids + copy EN):**

| # | Id | Copy (inglés) |
|---|----|---------------|
| 0 | `inicio` | h1 "Plants with teeth." + sub + CTA "Shop the collection" → `/products` + pills (greenhouse-grown · shipped alive · care guide) |
| 1 | `instinct` | Qué son las plantas carnívoras: el instinto de atrapar insectos |
| 2 | `collection` | La colección con sus precios reales ($18–$52) y 3 categorías |
| 3 | `proof` | Las pruebas: greenhouse-grown, shipped alive, 30-day arrival guarantee (tarjetas-stat como `100 %` del repo) |
| 4 | `care` | Care guide incluida + Starter Kit ("no sé cuidar") + 3 pasos: choose → arrives alive → grow with the guide |
| 5 | `tu-casa` | CTA final idéntico al del hero → `/products` |

### 3. Secciones reales con datos SDK (debajo del engine)

1. **Tagline** — filosofía de marca en una línea con `data-words` (palabra a palabra).
2. **Featured (ex-Dishes)** — fila tipo carta o grid de los 5 productos sembrados: query
   `@wix/stores` en el frontmatter (SSR). Sin media → hueco vacío con `mask-oval`/`mask-arch`
   y copy, nunca un crash. Enlace a `/products/<slug>`.
3. **Kits (ex-Experiences)** — tarjetas con la oferta real: Starter Kit $45, Nepenthes S/M/L
   $24/36/52 (y Cape Sundew $18) con `ring-teja/60` para el destacado y CTA → `/products`.
   Estilo exacto de `Experiences.astro` (precio display grande + botón + etiqueta).
4. **Faq** — dudas reales (care, shipped alive, cuál elegir, devoluciones). Respuestas no
   verificadas → `Pending` en dev (nunca inventar).
5. **FinalCta** — CTA final idéntico con la imagen del último frame en `mask-arch`.
- `Press` (reseñas de growers) y `Gift` (gift cards): **Pending** (roadmap #13 y #14), a
  menos que ya existan datos reales.
- Respetar/colocar los markers `<!-- home:stores -->` y `<!-- home:gift-cards -->`.

### 4. Cabecera píldora flotante + nav

- Usar el `Header.astro` del repo tal cual (píldora glass: `rounded-full bg-bg/60 ring-1
  ring-crema/10 backdrop-blur-xl`, logo, nav con `data-nav-link` + píldora de sección activa,
  menú móvil con `[data-menu-link]`). **Izquierda en desktop, centrada en móvil.**
- Reemplaza `navigation.astro`; conservar los marcadores `<!-- nav:links -->` y
  `<!-- nav:actions -->` para steps futuros.
- Links de la píldora anclados a las paradas del engine (ids de la tabla) vía `nav` de
  `site.ts`.

## Design

- Design system del repo, verbatim: tokens `bg`/`crema`/`teja` + `--ease-fluid`; capa
  `components` de `global.css` (botones, link, máscaras, mirror-frame, reveal, faq, words).
  Mapear también `--font-display`/`--font-sans`.
- **Tipografía:** por defecto la del repo (Hina Mincho display + Zen Kaku Gothic New, servidas
  en local y recortadas a latín) porque se adopta su system-design. **Alternativa** para una
  marca de jardín en inglés: mantener Fraunces/Inter ya servidas y mapearlas a las mismas
  variables. Elegir UNA; si se dudda, preguntar. Sin negritas ni cursivas sintéticas.
- Fondos planos con `bg`; los únicos gradientes permitidos son los velos del stage del
  repo (para leer el texto sobre el vídeo). Es un patrón del sistema copiado, no un arbitrarío.
- Móvil: el 16:9 se recorta en vertical; `focus` por parada (via `--focus-x`, ya lo soporta
  `ScrollWorld.astro`).
- Motion: GSAP + ScrollTrigger + Lenis tal y como `motion.ts`/`world.ts` del repo. **Nunca**
  `window.addEventListener('scroll')`. Verificar que Lenis no pelea con `astro:transitions`
  (`ClientRouter` del layout). `prefers-reduced-motion` → solo posters, sin Lenis ni scrub.
- A11y: `h1` único en la parada 0, headings en orden, links con texto visible, `focus-visible`
  (teja), `alt` descriptivo en cada poster/imagen, rail con `aria-current`.
- Tokens canónicos SIEMPRE (AGENTS.md): `bg-crema`, `text-teja`, `bg-bg`, `ring-crema/10`,
  escala `text-*` de Tailwind; sin valores arbitrarios con equivalente canónico.

## Verificación

- [ ] Output format entregado en la respuesta y reflejado en el código
- [ ] `npm install --legacy-peer-deps gsap lenis @phosphor-icons/core`
- [ ] `npx @wix/cli@latest build` en verde
- [ ] Con 5 mp4 en `public/videos/`: cada costura parada↔clip coherente en las 10 costuras;
      `video.seekable.end(0) > 0` y `currentTime`/`--focus-x` siguen al scroll en cada tramo
- [ ] Lenis no pelea con `ClientRouter` (anclas del header y `data-menu-link` funcionan)
- [ ] Sin vídeos: posters como fallback, sin crash, estructura lista
- [ ] Featured muestra los 5 productos sembrados o el estado vacío (hoy `NO-MEDIA`)
- [ ] Píldora flotante a la izquierda en desktop y centrada en móvil; sin overflow en
      375px / 768px / 1280px
- [ ] `prefers-reduced-motion`: solo posters, sin scrubbing
- [ ] Sin clases no canónicas (diagnósticos Tailwind), markers intactos, tokens `bg/crema/teja`
      en toda la home (nav y footer incluidos)

## Al terminar

1. Marca el paso 4 como `done` en `ROADMAP.md` (y corrige la nota de "6 clips" → 5 vídeos +
   design system del repo).
2. Siguiente: `/step-5-create-shop-page` (pedir actualizar sus tokens a `bg/crema/teja`).