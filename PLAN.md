# PLAN — Petals & Predators (garden store) · flujo por comandos

Plan aprobado. Este documento es la referencia del diseño de la mecánica; la ejecución
paso a paso vive en `.opencode/commands/step-N-*.md` y el backlog en `ROADMAP.md`.

## 1. Decisiones

| Decisión | Valor |
|---|---|
| Marca | **Petals & Predators** — e-commerce en inglés de plantas carnívoras + flores |
| Design system | `DESIGN.md` (capture Mintlify: fondo `#08090A`, acento mint `#18E299`, superficies `#0F0F12`, bordes `#1E1F21`, radii 4/6/12px, motion 0.2s `cubic-bezier(.4,0,.2,1)`) |
| Tipografía | Inter (body) + **Fraunces** (display, sustituto de arizonaFlare vía `googleFontsHref`) |
| Backend Wix | Wix Stores (catálogo) + checkout nativo de Wix + Wix Forms (contact/newsletter) |
| Flujo | Los comandos `step-N` reemplazan al conductor de la skill `wix-headless` (PLAN/BUILD); la skill se usa como **proveedor de recetas** (SETUP, SEED, guías astro, scripts) |
| SKILL_ROOT | `C:\Users\amoil\.agents\skills\wix-headless` · upstream: `C:\Users\amoil\.agents\skills\wix-manage` |
| Gestor de paquetes | **Solo npm** (`.npmrc`: `legacy-peer-deps=true` + `min-release-age=1`); crear con `scaffold.sh` (usa `npm create @wix/new`); instalar con `npm install` (ver AGENTS.md) |

## 2. Arquitectura de archivos

```
garden-store/
├── DESIGN.md                      # existe; step-1 añade YAML frontmatter (captura intacta = body)
├── AGENTS.md                      # flujo por comandos + npm-only (gestor de paquetes)
├── PLAN.md                        # este archivo
├── ROADMAP.md                      # backlog completo + estado (fuente de verdad del QUÉ sigue)
└── .opencode/commands/
    ├── step-0-scaffold-and-setup.md
    ├── step-1-create-hero-section.md      (header + navbar + hero + design system)
    ├── step-2-create-footer.md
    ├── step-3-seed-plant-catalog.md
    ├── step-4-create-home-page.md
    ├── step-5-create-shop-page.md
    ├── step-6-create-product-detail.md
    ├── step-7-create-cart-and-checkout.md
    ├── step-8-create-about-and-contact.md
    ├── step-9-seo-and-accessibility.md
    ├── step-10-build-and-release.md
    └── generate-next-steps.md             # genera los próximos step-N desde ROADMAP.md
```

## 3. Convención de cada comando

- Frontmatter mínimo: `description:` (visible en el menú `/` de opencode).
- Auto-terreno con inyección de shell: `!`ls .opencode/commands``, `!`ls src/pages …``
  — cada comando "ve" el estado real antes de actuar.
- Secciones fijas: **Objetivo · Contexto · Functionality · Pages/Sections · Design ·
  Wix wiring · Verificación · Al terminar**.
- Cada paso deja el sitio compilando (`npx @wix/cli@latest build` verde) y termina con
  la línea `> Siguiente: /step-<N+1>-…` (o `/generate-next-steps` si no existe aún).
- Al terminar: marcar el paso `done` en `ROADMAP.md`.

## 4. Lote inicial (step-0 … step-10)

| Cmd | Entrega | Detalle clave |
|---|---|---|
| step-0 | Proyecto Wix vivo | login CLI, `scaffold.sh` (flatten a CWD), `npm install --legacy-peer-deps`, apps Wix Stores + Wix Forms, `env pull`, verificar `wix.config.json` |
| step-1 | Design system + header + navbar + hero | frontmatter DESIGN.md (roles wix + Fraunces) → `emit-design-tokens.mjs` → pre-copy de CSS/utils → `compose.mjs` → customizar hero/nav |
| step-2 | `footer.astro` completo | columnas, tagline, newsletter, social, legal, responsive |
| step-3 | Catálogo sembrado | 5 productos con variantes/categorías + imágenes → `.wix/seeded.json` |
| step-4 | Home page | value props, categorías, featured products (SDK runtime), testimonios, CTA |
| step-5 | Shop + categorías | `/products`, `/category/[slug]`, ProductCard, CategoryRail, filtros |
| step-6 | Product detail | `/products/[slug]`, variantes, cantidad, add-to-cart |
| step-7 | Cart + checkout | `/cart`, `/thank-you`, CartBadge en nav, checkout nativo Wix |
| step-8 | About + Contact | `/about`, `/contact` con Wix Forms |
| step-9 | SEO + a11y + polish | meta/OG, sitemap, alt, contraste, keyboard, reduced-motion, responsive |
| step-10 | Build + release | `wix build` → `wix release` → URL pública + AGENTS.md final |

## 5. `generate-next-steps.md`

1. Lee `ROADMAP.md` (items `pending`), `!`ls .opencode/commands``, estado de `src/pages`.
2. `N = max(step-N) + 1`; toma los próximos K items pendientes en orden (`$ARGUMENTS`
   = foco/contador, default 3).
3. Escribe `step-<N+i>-<slug>.md` con la **plantilla fija embebida** en el generador.
4. Actualiza `ROADMAP.md` (→ `materialized`) y reapunta la línea `> Siguiente:` del
   último paso existente.
5. Nunca renumera ni pisa steps existentes.

## 6. Verificación

- Los 13 archivos existen con frontmatter válido (aparecen en `/`).
- `DESIGN.md` intacto hasta step-1 (solo gana frontmatter, sin perder la captura).
- Cadena `> Siguiente:` coherente entre pasos y con `ROADMAP.md`.
- Ejecución real: `/step-0-scaffold-and-setup` (requiere login de Wix en el browser).
