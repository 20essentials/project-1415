---
description: Step 1 — Design system + header + navbar + hero · Petals & Predators
---
# Step 1 — Design system + header + navbar + hero

> **Siguiente:** `/step-2-create-footer`

## Objetivo

Convertir la captura de `DESIGN.md` en tokens canónicos, correr el Composer de la
skill para que escriba `layout.astro` (header), `navigation.astro` (navbar) e
`index.astro` (hero), y dejar esa primera pantalla afinada a la marca.

## Contexto

- **Marca:** Petals & Predators — plantas carnívoras + flores, sitio en inglés.
- **Design system:** `@DESIGN.md` — su **frontmatter YAML es la fuente canónica de
  tokens**; el body (la captura) es documentación, no se toca.
- **Páginas hoy:** !`ls src/pages 2>/dev/null || echo "(ninguna)"` · **Comandos:** !`ls .opencode/commands`
- SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless`

## Functionality

### 1. Añadir frontmatter a `DESIGN.md`

Insertar ANTES de la primera línea (`# Design reference`), sin borrar el body:

```yaml
---
version: alpha
name: Petals & Predators
colors:
  paper: "#08090A"
  paper-warm: "#0F0F12"
  ink: "#FAF8F5"
  ink-soft: "#D9D7D4"
  mute: "#969E9B"
  rule: "#1E1F21"
  accent: "#18E299"
  cream: "#FFFFFF"
  error: "#EA4335"
typography:
  display:
    fontFamily: Fraunces, Georgia, serif
    fontWeight: 400
    lineHeight: 52px
    letterSpacing: -2px
  body:
    fontFamily: Inter, ui-sans-serif, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 20px
  mono:
    fontFamily: ui-monospace, SFMono-Regular, monospace
rounded:
  sm: 4px
  md: 6px
  lg: 12px
containers:
  prose: 42rem
  md: 48rem
  3xl: 64rem
  6xl: 76.8rem
googleFontsHref: https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600&display=swap
---
```

**Hex SIEMPRE entre comillas** (sin comillas = comentario YAML). Fraunces sustituye a
arizonaFlare (proprietaria). Roles wix: `paper`=fondo, `ink`=texto, `accent`=mint.

### 2. Proyectar tokens + pre-copias (una sola vez, idempotente)

```bash
node "C:\Users\amoil\.agents\skills\wix-headless\scripts\emit-design-tokens.mjs" "$PWD"

mkdir -p src/styles src/utils
T="C:\Users\amoil\.agents\skills\wix-headless\references\astro\templates"
cp "$T/stores/components-stores.css" src/styles/
cp "$T/ecom/components-ecom.css"     src/styles/
cp "$T/stores/categories.ts"         src/utils/
cp "$T/stores/back-in-stock.ts"      src/utils/
cp "$T/ecom/discounts.ts"            src/utils/
```

(Sin estos CSS, `astro build` falla con `Could not resolve "../styles/components-*.css"`.)

### 3. Correr el Composer (escribe 6 archivos)

```bash
node "C:\Users\amoil\.agents\skills\wix-headless\scripts\compose.mjs" "$PWD" <<'COMPOSE'
{
  "shell": {
    "heroHeadline": "Petals with teeth.",
    "heroSub": "Carnivorous specimens, show-stopping blooms, and care-tested kits — greenhouse-grown and shipped alive to your door.",
    "footerTagline": "Grown by hand, fed by instinct.",
    "navBrandMark": "❀"
  },
  "brand": { "name": "Petals & Predators", "description": "Online store for carnivorous plants and striking flowers" },
  "navLinks": [
    { "href": "/", "label": "Home" },
    { "href": "/products", "label": "Shop" },
    { "href": "/category/carnivorous", "label": "Carnivorous" },
    { "href": "/category/flowers", "label": "Flowers" },
    { "href": "/about", "label": "About" },
    { "href": "/contact", "label": "Contact" }
  ],
  "loadedPacks": ["stores", "ecom"],
  "packsWithComponents": ["stores", "ecom"],
  "disabledPacks": ["gift-cards"]
}
COMPOSE
```

Parsea el manifest JSON de stdout: `status: "failed"` → para y lee el error. El copy
del shell es un punto de partida — refínalo (tono cálido, confiable, en inglés).

### 4. Afinar la primera pantalla

- `src/layouts/layout.astro` — título por defecto, Fraunces via `<link>`, header sticky opcional.
- `src/components/navigation.astro` — marca ❀ + "Petals & Predators", links, menú móvil
  (hamburger con `aria-expanded`, teclado), **deja libre el slot `<!-- nav:actions -->`**
  (step-7 monta ahí el CartBadge).
- `src/pages/index.astro` — hero con el headline Fraunces ~50px/52px `tracking -2px`,
  sub en Inter 16px `mute`, botón primario (`bg accent`, `text paper`, `radius 4px`),
  CTA a `/products`. **Respeta los markers** `<!-- home:… -->` (step-4 los rellena).
- Links a `/products` y `/category/*` se activan en step-5; `/about` y `/contact` en step-8.

## Design

Tokens vía `var(--color-*)` / Tailwind `@theme` (nunca hex sueltos): fondo `paper`,
texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`. Respeta `prefers-reduced-motion`.

## Verificación

- [ ] `.wix/design-tokens.css` y `.wix/site.d.ts` existen
- [ ] `npx @wix/cli@latest build` en verde
- [ ] `/` muestra header + navbar responsive + hero con Fraunces
- [ ] `<!-- nav:actions -->` y `<!-- home:… -->` markers intactos en el HTML

## Al terminar

1. Marca el paso 1 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-2-create-footer`
