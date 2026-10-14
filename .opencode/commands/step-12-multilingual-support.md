---
description: Step 12 — Multilingual support (en, es, it) · Petals & Predators
---
# Step 12 — Multilingual support (en, es, it)

> **Siguiente:** `/step-13-seo-main-pages`

## Objetivo

Sitio multi-idioma con Wix Multilingual: las cadenas de UI y marketing se editan desde el
dashboard de Wix (Translation Manager → Headless) y se leen en runtime con
`i18n.getTranslationFunction()`; Wix enruta los locales (`/`, `/es`, `/it`) sin duplicar
carpetas en `src/pages`.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés.
- **Docs (fuente de verdad):** [Add multilingual support](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/add-multilingual-support).
- **SDK:** `@wix/essentials` (ya instalado, expone `i18n`) y el módulo virtual
  `wix:astro:i18n` (`getRelativeLocaleUrl`) que provee `@wix/astro` con `translations: true`.
- **Estado:** `astro.config.mjs` (`wix({ robots: { enable: false } })`); nav y copy en
  `src/data/site.ts`; shell en `src/components/{header,footer,navigation,scroll-world,faq}.astro`;
  layout en `src/layouts/layout.astro` (`<html lang="en">` + `hreflang` fijo).

## Functionality

1. **App Wix Multilingual:** instalarla en el sitio y habilitar `es` e `it` (dashboard →
   Website Content → Multilingual → Manage Languages), con inglés como idioma principal.
2. **Config:** en `astro.config.mjs` añadir `essentials: true` y `translations: true` a la
   llamada `wix({...})`, conservando `robots: { enable: false }`. **No** activar el i18n de
   Astro ni crear carpetas `src/pages/es`, `src/pages/it`: el middleware de Wix quita el
   segmento de locale antes del routing y `@wix/astro-pages` registra cada carpeta como
   página — mantener `src/pages` plano.
3. **`src/translations.json`** — claves agrupadas con el texto fuente en inglés:
   `nav.*` (Home, All plants, Journal, About, Contact, …), `header.*` (Log in, Account,
   Cart, Skip to content), `footer.*` (headings, links, newsletter, legal),
   `home.*` (hero + section headings + CTA labels), `paseo.*` (eyebrow/title/subtitle/
   claims por stop), `faq.*` (preguntas y respuestas de `site.faqs`), `common.*`
   (Add to cart, Continue to checkout, View all, …).
4. **`src/utils/i18n.ts`** — `useTranslation()` → `{ t }` envolviendo
   `i18n.getTranslationFunction()` de `@wix/essentials`; `currentLanguage()` →
   `i18n.getLanguage()`; `localize(path)` → `getRelativeLocaleUrl(path)` de `wix:astro:i18n`.
   Tipar `t` con la firma de `i18next` (nada de `any`).
5. **Shell traducido:**
   - `src/data/site.ts`: sustituir los textos visibles por claves (`label: 'nav.home'`,
     …) conservando `href`/estructura; `faqs` pasan a `{ q: 'faq.q1', a: 'faq.a1' }`.
   - `header.astro` (desktop + menú móvil) y `navigation.astro`: renderizar
     `t(item.label)` y `t('header.login' | 'header.account')`.
   - `footer.astro`: renderizar headings y enlaces vía `t()`.
   - `scroll-world.astro` y `faq.astro`: renderizar `t()` sobre `paseo.*` y `faq.*`.
   - Los enlaces internos (`/products`, `/journal`, `/about`, `/contact`) pasan por
     `localize()` para conservar el prefijo de locale actual.
6. **Layout:** `<html lang={currentLanguage()}>` dinámico y un `<link rel="alternate"
   hreflang>` por idioma habilitado (`en`, `es`, `it`, `x-default`) sobre la URL actual;
   `og:locale` acorde al idioma.
7. **Sync de traducciones:** `npm run wix translation push` (sube las claves) → añadir
   es/it en el Translation Manager (pestaña **Headless**) → `npm run wix translation pull`
   (escribe `.wix/multilingual`, que está gitignored → **re-ejecutar en cada clon limpio y
   en CI antes de compilar**, si no `astro build`/`dev` fallan al arrancar).
8. **Páginas gestionadas por Wix** (login de miembros, checkout): al crear la redirect
   session (`@wix/redirects`) pasar `preferences.additionalQueryParameters.lang` = idioma
   actual (`en`/`es`/`it`) para que login y checkout hablen el idioma del visitante.
9. **Sitemap:** añadir las variantes de locale de las páginas principales (`/es`, `/it` y
   sus rutas estáticas) además de las de `en`.

## Pages / Sections

- `src/translations.json` — claves y texto fuente (en).
- `src/utils/i18n.ts` — helpers de traducción y locale.
- `src/components/{header,footer,navigation,scroll-world,faq}.astro` — copy vía `t()`.
- `src/layouts/layout.astro` — `lang` + `hreflang` por locale.
- `src/data/site.ts` — textos visibles → claves.

## Design

- Sin cambios visuales: mismo design system (`DESIGN.md`; tokens `paper`, `ink`,
  `paper-warm`, `rule`, `accent`). El texto traducido mantiene tipografía
  (`--font-display`/`--font-sans`) y no altera el layout.
- Verificar que es/it (cadenas más largas) no rompen el nav, los badges ni el footer en
  375/768/1024/1280.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; `prefers-reduced-motion` respetado.

## Wix wiring

- `i18n.getTranslationFunction()` y `i18n.getLanguage()` de `@wix/essentials` en SSR
  (contexto de request). La localización de rutas la hace el middleware de Wix;
  `getRelativeLocaleUrl` de `wix:astro:i18n` para enlaces internos. Redirect sessions con
  `preferences.additionalQueryParameters.lang`. `.wix/multilingual` no se importa en rutas
  `.astro`; `.wix/seeded.json` solo para IDs de apoyo.

## Verificación

- [x] `npx @wix/cli@latest build` en verde (tras `npm run wix translation pull`)
- [x] `npm run wix translation push` sube las claves y aparecen en el Translation Manager (Headless)
- [x] Con es/it habilitados, `/` sirve en, `/es` sirve es y `/it` sirve it (nav, footer y hero traducidos)
- [x] `<html lang>` y los `hreflang` cambian por locale; los enlaces internos conservan el prefijo
- [x] Login y checkout se abren en el idioma activo (`lang` en la redirect session)
- [x] AGENTS.md documenta que `npm run wix translation pull` es requisito previo al build

## Al terminar

1. Marca el paso 12 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-13-seo-main-pages`.
