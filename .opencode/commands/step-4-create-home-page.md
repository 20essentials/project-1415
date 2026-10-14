---
description: Step 4 — Home landing scroll-world (6 clips) · Petals & Predators
---
# Step 4 — Home landing scroll-world (6 clips)

> **Siguiente:** `/step-5-create-shop-page`

## Objetivo

Convertir `src/pages/index.astro` en la home-landing **scroll-world** de Petals &
Predators usando los clips de `public/videos/`. Mecánica adaptada de
https://www.arkorestaurant.com/ (referencia de MECÁNICA, no de contenido): el vídeo
avanza/retrocede con el scroll, el texto a la izquierda se asienta en cada parada y la
cabecera es una píldora flotante. El ANTES de código es entregar el **Output format**
de `landing-page-design` adaptado a la marca.

**Este fichero SOBRESCRIBE la versión anterior (repuso midudev/GSAP). Fuente de verdad:**
skill `scroll-world` + `references/scrub-engine.js` + receta
`.opencode/references/higgsfield-landing-prompts.md` §4. **No usar GSAP/Lenis/world.ts.**

## Contexto (recon ya hecho — no re-explorar)

- **Marca:** Petals & Predators — plantas carnívoras + flores, sitio en inglés.
- **Clips en `public/videos/`:** `v1.mp4`…`v5.mp4` = 5 de 6. Cada uno 1920×1080, H.264
  (yuv420p), 24 fps, **5.04 s**, pista de audio `aac` (≈5.04 s). Falta el 6.º → montar
  TODO igual con fallback (sección 2). No modificar `generated` nada más.
- **Stills:** ya existen frames reales extraídos en `src/assets/world/{v1..v5,tu-casa}.webp`
  (importados hoy en `src/data/site.ts`, `src/data/imagenes.ts`). Se vuelven a extraer a
  `public/world/` con el mapeo correcto (sección 2) para que el engine los sirva como
  posters de parada.
- **Seed** (`.wix/seeded.json`, slice `stores`): productos → sluga `venus-flytrap-akai-ryu`
  $24 · `nepenthes-pitcher-plant` $24 · `cape-sundew` $18 · `moonlight-orchid` $32 ·
  `carnivorous-starter-kit` $45. Categorías → `carnivorous`
  (`c7a9ab76-a222-4386-8ceb-4a8b891d6008`) y `flowers` (`ec570317-ea8c-48d6-9c06-d6b129b31c21`).
  Solo 2 categorías sembradas. Todos los productos sin media (`NO-MEDIA`).
- **Consulta SDK (patrón válido en este proyecto):** `productsV3.queryProducts({ fields: ["CURRENCY"] })`
  desde `@wix/stores` (ver copia en `src/utils/categories.ts` y template
  `src/utils/../templates/stores/products/index.astro`). Categorías vía
  `listStoreCategories()` de `src/utils/categories.ts` (ya existe, TTL cache).
- **Estado del código hoy:** `src/components/{scroll-world,stop,header,icon,spiral,pending,
  tagline,dishes,experiences,faq,gift,press,final-cta}.astro` y `src/data/arko.ts`,
  `src/data/schema.ts` son vestigios Arko (en español). `layout.astro` importa `Header.astro`
  (píldora) y `Footer.astro`; `navigation.astro` existe pero NO se usa. `index.astro` es el
  hero de paso 1 + markers `<!-- home:stores -->` / `<!-- home:gift-cards -->`.
  `src/scripts/{world.ts,motion.ts}` (GSAP) quedan huérfanos al acabar este paso — **no borrar**
  sin preguntar (destructivo), solo dejar de referenciarlos.
- **Tokens (DISEÑO de este paso):** `paper/ink/accent/paper-warm/ink-soft/mute/rule/cream/error`
  (`.wix/design-tokens.css` y frontmatter de `DESIGN.md`). El resto del sitio usa
  `bg/crema/teja` (legacy Arko) — **no convertir** nada fuera de la home.
- **Tipografía (este paso):** Fraunces (display) + Inter (texto), estilo design system.
  `googleFontsHref` ya está en `DESIGN.md`:
  `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600&display=swap`.
- **Markers a respetar:** `<!-- home:stores -->`, `<!-- home:gift-cards -->` (en index.astro),
  `<!-- nav:actions -->` (+ `<!-- nav:links -->`) en la píldora.
- **Motion:** el engine trae su propio rAF (`references/scrub-engine.js` tiene
  `window.addEventListener('scroll')` interno con rAF pasivo — es SU mecanismo, no añadir otro).
  Nada de `window.addEventListener('scroll')` propio. `prefers-reduced-motion` → solo stills.
- **Comandos:** `npm install --legacy-peer-deps` si un módulo no resuelve; build:
  `npx @wix/cli@latest build`.

## Functionality

### 0. Output format (obligatorio ANTES de codificar — pastar tallo)

**PEGAR en la respuesta el siguiente Output format adaptado, luego codificar:**

```
1. Page outline
   - Hero + scroll-world (engine, 7 paradas)
   - Tagline/claims (3 claims reales con icono SVG)
   - Featured plants (grid 4-6 productos, query SSR @wix/stores)
   - Shop by category (cards → /category/<slug>, slugs reales del seed)
   - CTA final dentro del engine (parada 6)
   - Assets por sección: paradas 0-6 → clips v1..v5 (disponibles) y v6/cap 6 (PENDIENTE, fallback)
   - Featured → productos seed (disponibles) pero SIN media (NO-MEDIA) → estado vacío con
     copy (PENDIENTE imágenes)
   - Categories → carnivorous + flowers (disponibles); una 3.ª categoría no inventada (PENDIENTE)

2. Hero copy
   - h1 (ÚNICO en toda la página, parada 0): "Plants with teeth."
   - Sub: "Carnivorous specimens, show-stopping blooms, and care-tested kits —
     greenhouse-grown and shipped alive to your door."
   - CTA primario: "Shop the collection" → /products (sin CTAs competidores arriba del fold)

3. Benefits (claims)
   - greenhouse-grown · shipped alive · care guide included (pruebas reales, sin cifras inventadas)

4. How it works (3 pasos, parada 5)
   - Choose your plant → It arrives alive → Grow with the care guide

5. FAQ (6-12, respuestas solo con datos reales; las distintas → PENDIENTE)
   - Will my plant arrive alive? / What do carnivorous plants eat? / Do I need a green thumb? /
     Which plant should I pick as a beginner? / Shipping & returns? (dudas reales del seed)

6. SEO/AEO
   - Index. title: "Petals & Predators — Carnivorous plants and flowers".
     description: la del sub. FAQ como texto plano para AEO.

7. Layout recommendation
   - B - Long form story (educar growers y vencer el miedo a cuidar plantas), con scroll-world.

   Oferta real: catálogo sembrado (precios de seeded.json). Audiencia asumida: growers y
   curiosos. Objeciones asumidas: "no sé cuidar plantas", "¿llegará viva?", "¿cuál elijo?".
   Pruebas reales: greenhouse-grown, shipped alive, 30-day arrival guarantee, care guide.
   Nada inventado → `PENDIENTE`.
```

### 1. Verificar clips (rápido, ya mayormente hecho)

- `ls public/videos/*.mp4` → 5: `v1.mp4`…`v5.mp4`. Faltan `v6`/`clip-6` → NO bloquear.
- `ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -of default=noprint_wrappers=1 public/videos/v1.mp4`
  → h264, 1920×1080, 24 fps. **Tienen audio `aac`** → recodificar sin audio (paso siguiente).
- Frames: `ffprobe` para confirmar el 1er y último frame por clip (se ve con ffmpeg al extraer).

### 2. Recodificar clips (Step 6 del skill) + extraer stills

Clip-k va de la parada k-1 a la parada k, con ease-in/out, y se asienta. Recodificar a
seek-friendly sin audio (GOP 8, crf 20). Sobrescribe `public/videos/*.mp4`:

```bash
for f in v1 v2 v3 v4 v5; do
  ffmpeg -v error -y -i "public/videos/$f.mp4" -an \
    -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "public/videos/$f.enc.mp4" && mv "public/videos/$f.enc.mp4" "public/videos/$f.mp4"
done
```

Extraer stills (frame REAL del vídeo, nunca la foto original) a `public/world/*.webp`:

| Parada | Still | Comando |
|---|---|---|
| 0 `inicio` | 1er frame de v1 | `ffmpeg -v error -y -ss 0 -i public/videos/v1.mp4 -frames:v 1 -c:v libwebp -q:v 70 public/world/inicio.webp` |
| 1 `instinct` | 1er frame de v2 | idem con v2 → instinct.webp |
| 2 `collection` | 1er frame de v3 | idem con v3 → collection.webp |
| 3 `proof` | 1er frame de v4 | idem con v4 → proof.webp |
| 4 `care` | 1er frame de v5 | idem con v5 → care.webp |
| 5 `como-funciona` | **fallback:** último frame de v5 (faltó v6) | `ffmpeg -v error -y -sseof -0.24 -i public/videos/v5.mp4 -frames:v 1 -c:v libwebp -q:v 70 public/world/como-funciona.webp` |
| 6 `tu-casa` | último frame de v5 / de v6 cuando exista | `-sseof -0.24` con v6 si aparece, si no con v5 → tu-casa.webp |

**Cuando llegue v6 (clip-6):** conectar entre parada 5 y 6, `tu-casa` = último frame de v6,
`como-funciona` = 1er frame de v6. Hoy: `connectors = [v1,v2,v3,v4,v5, null]` (null =
crossfade directo, el engine lo soporta — sección 11 del skill). Las imágenes de
`src/assets/world/*` se siguen usando para og-image; no tocar.

### 3. Cabecera píldora flotante

Adaptar `src/components/Header.astro` (ya es una píldora; hoy con copy Arko/español):

- Glass: `mt-6 w-max mx-auto rounded-full backdrop-blur` + borde `rule`; **izquierda en
  desktop** (margen lateral `lg:px-8 xl:px-20`), **centrada en móvil** (mantener el flex
  centrado actual). Fondos `paper/60` + `backdrop-blur-xl` + `ring-rule`.
- Logo a la altura del texto (mantener `Logo.astro`, `h-4`), aria-label en inglés.
- Links anclados a las paradas del engine: `nav` → `#inicio`, `#instinct`, `#collection`,
  `#proof`, `#care`, `#como-funciona`, `#tu-casa` + `/products`, `/about`, `/contact`
  (dejar los de `/products` y páginas futuras como están).
- Copy 100 % inglés (quitar "Shop mesa", teléfono Arko, etc.). Botón CTA = "Shop the
  collection" → `/products` (mismo que el hero: UNA acción primaria).
- **Añadir el marcador `<!-- nav:actions -->`** dentro del cluster de acciones de la píldora
  (frecuente CartBadge), y conservar `<!-- nav:links -->` en el `<nav>` de dentro. No borrar
  `navigation.astro` (fuera de alcance), pero un paso futuro puede apuntarlo a este marcador.
- El menú móvil y `data-menu-link` siguen igual (mecánica de `Header.astro` intacta).

### 4. Cablear el engine (receta §4)

1. Copiar `references/scrub-engine.js` → `src/scripts/scroll-world.js` como **módulo ES
   con export**:
   - Envolver el cuerpo en `export function mountScrollWorld(container, config) { … }`
     (el render + loop interno quedan idénticos).
   - **Patch mínimo para la marca:** (a) soporte `focusX` por sección → en `buildScene`
     poner `scene.style.setProperty('--sw-focus-x', s.focusX + '%')` y en CSS usar
     `object-position: var(--sw-focus-x, 50%) 42%` (desktop) / `46%` (móvil);
     (b) en el render de copy, si `s.titleTag === 'h1'` la primera sección usa `h1` en vez
     de `h2` (a11y: un solo h1 en toda la página).
   - Solo estos patches. Todo lo demás (blob seek, crossfade, reduced-motion, móvil) intacto.
2. Reescribir `src/components/ScrollWorld.astro`: un `<div data-world>` de montaje +
   `<script>` que llame `mountScrollWorld(el, config)` (runs en `astro:page-load`). **No**
   usar `world.ts`/GSAP/stop.astro.
3. Config (en el frontmatter del componente, datos + `.map()` — nunca markup pegado):

```js
{
  nav: false, atmosphere: false,            // sin brand ni topcta: ya hay píldora propia
  crossfade: 0.07,
  diveScroll: 0.9, connScroll: 1.0,         // clips de ~5 s (1.4 era para ~8 s)
  sections: [
    { id: 'inicio', label: 'Home', titleTag: 'h1',
      still: '/world/inicio.webp', focusX: 50,
      eyebrow: 'Petals & Predators',
      title: 'Plants with teeth.',
      body: 'Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.',
      tags: ['greenhouse-grown', 'shipped alive', 'care guide'],
      cta: { primary: { label: 'Shop the collection', href: '/products' } },
      scroll: 1.5, linger: 0.35 },
    { id: 'instinct', label: 'Instinct', still: '/world/instinct.webp', focusX: 55,
      eyebrow: 'Instinct', title: 'Nature built the trap.', titleTag: 'h2',
      body: 'Carnivorous plants evolved to catch insects — a quiet, patient hunt in a pot on your windowsill.',
      tags: ['Carnivorous', 'Low-maintenance', 'Conversation starter'] },
    { id: 'collection', label: 'Collection', still: '/world/collection.webp', focusX: 50,
      eyebrow: 'The collection', title: 'Five plants, one standard.', titleTag: 'h2',
      body: 'Venus Flytrap $24 · Nepenthes $24-52 · Cape Sundew $18 · Moonlight Orchid $32 · Starter Kit $45. Care-tested for first-time growers.',
      tags: ['Carnivorous', 'Orchids', 'Starter kits'] },
    { id: 'proof', label: 'Proof', still: '/world/proof.webp', focusX: 50,
      eyebrow: 'Proof', title: 'Shipped alive, guaranteed.', titleTag: 'h2',
      body: 'Greenhouse-grown, packed by hand, and protected by our 30-day arrival guarantee.',
      tags: ['greenhouse-grown', 'shipped alive', '30-day guarantee'] },
    { id: 'care', label: 'Care', still: '/world/care.webp', focusX: 50,
      eyebrow: 'Care', title: 'No green thumb needed.', titleTag: 'h2',
      body: 'Every order includes a care guide covering light, water and humidity. We ship you the plant AND the confidence to keep it growing.',
      tags: ['care guide included', 'Starter Kit', 'low-maintenance'] },
    { id: 'como-funciona', label: 'How it works', still: '/world/como-funciona.webp', focusX: 50,
      eyebrow: 'How it works', title: 'From our greenhouse to your shelf.', titleTag: 'h2',
      body: '',
      tags: [] },
    { id: 'tu-casa', label: 'CTA', titleTag: 'h2',
      still: '/world/tu-casa.webp', focusX: 50,
      eyebrow: 'Your space', title: 'Bring one home.',
      body: 'Pick a plant, skip the guesswork, and watch it come alive in your space.',
      cta: { primary: { label: 'Shop the collection', href: '/products' } },
      scroll: 1.4, linger: 0.3 }
  ],
  connectors: ['/videos/v1.mp4','/videos/v2.mp4','/videos/v3.mp4','/videos/v4.mp4','/videos/v5.mp4', null],
  rollers: undefined                         // no usa JSON internationalization
}
```

   - `connectors` longitud = `sections.length - 1` → 6, con el último `null` (fallback).
   - **Cuerpo de la parada `como-funciona`:** los 3 pasos (Choose → Arrives alive → Grow
     with the guide) como `<ul>` propio render consultado — si el engine no admite listas,
     poner el array en `tags` (3 pasos como pills) o un `body` de 2 líneas; NO inventar.
   - `focusX` por parada: mirar cada still (subject = planta) y ajustar 0–100 para móvil;
     hoy por defecto 50 (PENDIENTE hasta revisar los frames).
   - Colores: en `ScrollWorld.astro` un `<style>` que sobreescriba `:root` de las vars del
     engine al scope (.sw-root/container): `--sw-bg: var(--color-paper)`, `--sw-ink:
     var(--color-ink)`, `--sw-ink-soft: var(--color-ink-soft)`, `--sw-accent:
     var(--color-accent)`, `--sw-font-display: var(--font-display)`, `--sw-font-body:
     var(--font-body)`. Botones del engine: `background: var(--sw-accent)`, texto
     `var(--sw-bg)` (píldora de nav no aparece: `nav:false`).

### 5. `src/pages/index.astro` — home

```text
<Layout title="Petals & Predators — Carnivorous plants and flowers" description="…sub…">
  <ScrollWorld />                    (sustituye el hero)
  <Claim row> 3 claims reales con icono SVG inline: greenhouse-grown · shipped alive ·
             care guide included. Fondo paper, texto ink, fila en grid. (tagline section)
  <!-- home:stores -->               (mantener; pasos futuros montan aquí)
  <Featured>  grid 4-6 productos: frontmatter SSR queryProducts({fields:["CURRENCY"]}).limit(6)
             envuelto en try/catch. Card: nombre, precio (actualPriceRange.minValue), link
             /products/<slug>. Si p.media.mainMedia.image.url → <img> vía resolveWixImageUrl;
             si no (hoy NO-MEDIA) → hueco con copy "Photo coming soon", NUNCA crash.
             Estado vacío general: "Our first batch is still in the greenhouse." </Featured>
  <Shop by category>  listStoreCategories() → cards → /category/<slug> (2 reales sembradas;
             no inventar 3.ª). Título, contador de items, CTA "Explore". </Shop by category>
  <!-- home:gift-cards -->           (mantener)
</Layout>
```

- **Marcadores intactos:** `<!-- home:stores -->`, `<!-- home:gift-cards -->`.
- La parada 6 del engine = CTA final idéntico al hero (`/products`). Sin CTAs competidores.
- Quitar el hero y la sección "story" antiguos. Los componentes Arko dejan de importarse en
  home (no borrar ficheros).
- Tipografía: añadir `<link rel="stylesheet" href={googleFontsHref}>` (DESIGN.md) en
  `layout.astro` y mapear en `global.css`: `--font-display: Fraunces, Georgia, serif` y
  `--font-body/--font-sans: Inter, …`. Fraunces solo peso 400-700 (sin negritas sintéticas),
  Inter 400/500/600. (Impacta al resto del sitio al ser layout/global — es el design system
  de la marca; si dudas, preguntar.)

## Design

- Dark editorial con `paper`/`ink`/`accent` + `paper-warm`. Fondo `paper`, texto `ink`,
  acento `accent` (mint), superficie `paper-warm`, borde `rule`.
- **Tokens canónicos SIEMPRE (AGENTS.md):** `bg-accent`, `text-paper`, `rounded-sm`,
  escala `text-*`. Nada de valores arbitrarios con equivalente canónico
  (`h-[2px]`→`h-0.5`, `gap-[5px]`→`gap-1.25`, `opacity-[0.55]`→`opacity-55`, etc.):
  la escala v4 es `N × 0.25rem`. Push de tokens del @theme → `bg-accent`, nunca
  `bg-[var(--color-accent)]`.
- Sin gradientes en FONDOS. Los UNICOS scrims permitidos son los del engine
  (`sw-copylayer::before` y el velo de título) — patrón del sistema, no arbitrarío.
- Móvil: `focusX` por parada (patch del engine) para que el subject quede a la vista al
  recortarse el 16:9 a 9:16.
- Motion: solo el rAF del engine. Transiciones de UI con `ease-fluid`
  (`cubic-bezier(0.32,0.72,0,1)`, token ya presente) si hace falta. `prefers-reduced-motion`
  → engine usa only stills (verificado: `const reduce = matchMedia` en el engine).
- A11y: h1 único en parada 0, h2 en orden (patch `titleTag`), links con texto visible,
  `:focus-visible` (accent), `alt` descriptivo en cada imagen/der estrón, rail con
  `aria-current`. `video` muted/playsinline (el engine los setea).

## Verificación

- [ ] Output format entregado en la respuesta Y reflejado en el código
- [ ] `npx @wix/cli@latest build` en verde
- [ ] `ls public/videos/*.mp4` y `ffprobe` → h264 1920×1080 24fps, **sin audio**
- [ ] `public/world/*.webp` = 7 stills con el mapeo de la tabla (frames reales)
- [ ] Con dev server + headless (agent-browser/Playwright si está): `video.seekable.end(0) > 0`
      y `currentTime` sigue al scroll en cada uno de los 10 tramos reales (5 clips),
      crossfade en la costura 5↔6 (fallback null) sin pop visible
- [ ] Si llegó v6: costuras coherentes en las 12 (parada↔clip)
- [ ] Featured muestra los 5 productos o el estado vacío hoy (NO-MEDIA → no crash)
- [ ] Píldora a la izquierda en desktop, centrada en móvil; sin overflow en 375/768/1280
- [ ] `prefers-reduced-motion`: solo stills, sin scrubbing (Engine)
- [ ] Sin clases no canónicas (diagnósticos Tailwind del language server) y markers intactos
- [ ] grep markers: `grep -oE '(home|nav):[a-z-]+' src/pages/index.astro src/components/Header.astro`

## Al terminar

1. Marca el paso 4 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-5-create-shop-page` (pedir tokens del design system si llega con los
   legacy `bg/crema/teja`).