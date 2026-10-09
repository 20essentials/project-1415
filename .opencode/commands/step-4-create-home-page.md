---
description: Step 4 — Home landing scroll-world (6 clips pre-generados) · Petals & Predators
---
# Step 4 — Home landing scroll-world (6 clips)

> **Siguiente:** `/step-5-create-shop-page`

## Objetivo

Convertir `src/pages/index.astro` en la home-landing **scroll-world** de Petals &
Predators usando los **6 clips ya generados** en `public/videos/`. Adapta la MECÁNICA de
https://www.arkorestaurant.com/ (referencia de idea, NO de contenido — no copiar imágenes
ni datos del restaurante): el vídeo avanza/retrocede con el scroll, el texto a la izquierda
se asienta en cada parada, y la cabecera es una píldora flotante. El ANTES de código es
entregar el **Output format** de `landing-page-design` adaptado a la marca.

## Contexto

- **Marca:** Petals & Predators — plantas carnívoras + flores, sitio en inglés.
- **Receta de la mecánica (cómo se cableó Arko):**
  `.opencode/references/higgsfield-landing-prompts.md` → sección 2 (diseño previo del
  scroll-world) y **sección 4** (montaje con la skill scroll-world, pasos de generación
  ya quitados). Skill local `scroll-world` (SKILL_ROOT = `.opencode/skills/scroll-world`),
  engine en `references/scrub-engine.js`.
- **Design system:** `DESIGN.md` + tokens en `.wix/design-tokens.css` /
  `src/styles/global.css` (`@theme`). No cambiar tokens sin preguntar.
- **Datos:** slice `stores` de `.wix/seeded.json` (slugs/IDs de apoyo — las queries al SDK
  van en runtime, no importar seeded.json en la ruta). Los 5 productos están **sin media**
  (`NO-MEDIA`); categorías sembradas.
- **Clips:** !`ls public/videos/*.mp4 2>/dev/null || echo "(aún sin clips — montar estructura con fallback)"`
  · **ffprobe disponible** para extraer stills. Imágenes Wix → `resolveWixImageUrl`/`srcSet`.
- **Comandos:** !`ls .opencode/commands` · **Markers actuales:** !`grep -o 'home:[a-z-]*' src/pages/index.astro 2>/dev/null | sort -u || echo "(revisar markers)"`

## Functionality

### 0. Output format (obligatorio ANTES de codificar)

Correr el intake de `landing-page-design` (A1) con esta adaptación y devolverlo en la
respuesta:
- **UNA acción primaria:** comprar una planta → CTA "Shop the collection" → `/products`.
  Sin CTAs competidores arriba del fold.
- **Oferta real:** catálogo sembrado — Venus Flytrap $24 · Nepenthes S/M/L $24/36/52 ·
  Cape Sundew $18 · Moonlight Orchid $32 · Starter Kit $45 (precios de `.wix/seeded.json`).
- **Audiencia (asumida):** growers y curiosos que buscan una planta viva, sana, con guía.
- **Objeciones (asumidas):** "no sé cuidar plantas", "¿llegará viva?", "¿cuál elijo?".
- **Pruebas reales (copy ya existente):** greenhouse-grown, shipped alive, marca 100 %.
  No inventar cifras, reseñas ni premios.
- **Incluir en el outline:** qué asset va en cada sección y su estado (disponible | PENDIENTE).
  Todo dato que no exista → `PENDIENTE`, nunca inventado.

### 1. Verificar los clips

- Esperar 6 mp4 16:9 sin audio en `public/videos/` (p. ej. `clip-1.mp4` … `clip-6.mp4`;
  ajustar a los nombres reales que haya). `ffprobe` para comprobar H.264, resolución y que
  no lleven audio.
- `clip-k` va de la parada k-1 a la parada k, con ease-in/ease-out y se asienta en la parada
  (misma convención que la receta, sección 4). Si aún no están los 6 → montar TODO igual pero
  con fallback tokenizado en el panel; no bloquear el paso.

### 2. Cablear el engine (patrón receta sección 4)

Los clips son tramos ENTRE paradas, no diving dentro de una escena; el texto de cada parada
se ve con la cámara quieta en esa parada, no a mitad de tramo. Por eso:

- Copiar `references/scrub-engine.js` → `src/scripts/scroll-world.js` como módulo ES (con
  export) y montarlo desde un `src/components/ScrollWorld.astro`, sustituyendo el hero actual.
- `nav: false`, sin brand ni topcta del engine (ya existe `navigation.astro` y el logo de la
  marca). `atmosphere: false` (fotorrealista, sin partículas).
- `sections` = las **7 paradas de la marca SIN `clip`**; su `still` es un **frame real del
  vídeo** (regla de costura), nunca una foto suelta:
  | Parada | Still |
  |---|---|
  | 0 hero | primer frame de clip-1 |
  | 1–5 | primer frame de clip-(k+1) |
  | 6 CTA final | último frame de clip-6 |
  Extraerlos con ffmpeg a webp en `public/world/`.
- `connectors` = los **6 clips en orden** (clip-1 entre paradas 0↔1 … clip-6 entre 5↔6).
  `connectorsMobile`: encodes 720p del §6 solo si la receta los pide; aquí los clips ya
  sirven a ambos (el 16:9 se recorta en móvil).
- `crossfade` ~0.06–0.08 · `connScroll` ~1.4 (clips de ~8 s) · paradas ~0.9 · más scroll en
  la primera y la última.

**Paradas propuestas (ids + copy EN; datos en el frontmatter de ScrollWorld.astro + `.map()`,**
nunca markup pegado):

| # | Id | Copy (inglés) |
|---|----|---------------|
| 0 | `inicio` | h1 "Plants with teeth." + sub + CTA "Shop the collection" + pills (greenhouse-grown · shipped alive · care guide) |
| 1 | `instinct` | Qué son las plantas carnívoras: el instinto de atrapar insectos |
| 2 | `collection` | La colección con sus precios reales ($18–$52) y 3 categorías |
| 3 | `proof` | Las pruebas: greenhouse-grown, shipped alive, 30-day arrival guarantee |
| 4 | `care` | Care guide incluida + Starter Kit (respuesta a "no sé cuidar") |
| 5 | `como-funciona` | 3 pasos: elige la planta → llega viva → la cuidas con guía |
| 6 | `tu-casa` | CTA final idéntico al del hero → `/products` |

### 3. Secciones reales con datos SDK (debajo del engine)

1. **Featured plants** — grid de 4-6 productos: query `@wix/stores` (frontmatter SSR),
   `ProductCard`-ligero (imagen vía `resolveWixImageUrl`, nombre, precio, link a
   `/products/<slug>`). Sin media → estado vacío con copy, nunca un crash.
2. **Shop by category** — 3 cards con links a `/category/<slug>` (slugs de seed).
3. **Claim row** — 3 claims reales (greenhouse-grown, shipped alive, care guide included)
   con icono SVG inline.

- Respetar/colocar los markers `<!-- home:stores -->` y `<!-- home:gift-cards -->`
  (steps futuros los parchean) y `<!-- nav:actions -->` en el nav.

### 4. Cabecera píldora flotante

- Glass: `mt-6 w-max mx-auto rounded-full backdrop-blur` + borde `rule`; **izquierda en
  desktop** (con margen lateral), **centrada en móvil**. Logo a la altura del texto.
- Links de la píldora anclados a las paradas del engine. Marcador `<!-- nav:… -->` intacto.

## Design

- Tema oscuro editorial con los tokens actuales (`paper`/`ink`/`accent` + `paper-warm`).
  Mapear las vars del engine: `--sw-bg` → `paper`, `--sw-ink` → `ink`, `--sw-ink-soft` →
  `ink-soft`, `--sw-accent` → `accent`, `--sw-font-display`/`--sw-font-body` → nuestras.
- Móvil: el 16:9 se recorta en vertical. Definir un `object-position` horizontal por parada
  para que el sujeto del frame quede a la vista.
- Tipografía: Fraunces (display) + Inter (texto) del design system. Sin cursivas ni negritas
  sintéticas. (El look Arko con fuentes japonesas es decisión aparte — preguntar.)
- Tokens canónicos SIEMPRE (ver AGENTS.md): `bg-accent`, `text-paper`, `rounded-sm`, escala
  `text-*` de Tailwind; sin valores arbitrarios con equivalente canónico. Sin gradientes en fondos.
- Motion: el engine trae su propio suavizado con rAF (`references/scrub-engine.js`). No
  añadir GSAP/Lenis salvo que se pida; si se añade Lenis, verificar que no pelea con el
  engine. **Nunca** `window.addEventListener('scroll')`. `prefers-reduced-motion` → solo stills.
- A11y: `h1` único en la parada 0, headings en orden, links con texto visible, `focus-visible`,
  alt descriptivo en cada imagen.

## Verificación

- [ ] Output format entregado en la respuesta y reflejado en el código
- [ ] `npx @wix/cli@latest build` en verde
- [ ] Con 6 mp4 en `public/videos/`: each costura parada↔clip coherente en las 12 costuras;
      `video.seekable.end(0) > 0` y `currentTime` sigue al scroll en cada tramo
- [ ] Sin clips todavía: fallback tokenizado, sin crash, estructura lista
- [ ] Featured muestra los 5 productos sembrados o el estado vacío (hoy `NO-MEDIA`)
- [ ] Píldora flotante a la izquierda en desktop y centrada en móvil; sin overflow en
      375px / 768px / 1280px
- [ ] `prefers-reduced-motion`: solo stills, sin scrubbing
- [ ] Sin clases no canónicas (diagnósticos Tailwind) y markers intactos

## Al terminar

1. Marca el paso 4 como `done` en `ROADMAP.md`.
2. Siguiente: `/step-5-create-shop-page`