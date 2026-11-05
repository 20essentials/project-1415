---
description: Step 49 — FAQ app: preguntas de cuidado con categorías y búsqueda · Petals & Predators
---
# Step 49 — FAQ app: preguntas de cuidado con categorías y búsqueda

> **Siguiente:** `/step-50-blog-comments`

## Objetivo

Existe **`/faq`** con las preguntas frecuentes de cuidado de plantas carnívoras,
agrupadas por categoría (luz, riego, alimentación, envíos…), con búsqueda y un
anchor/link por pregunta (deep-linkable para SEO y para responder desde Smart Chat).

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
  El FAQ ataca las ~20 preguntas típicas de cuidado ("¿agua destilada obligatoria?",
  "¿cuánta luz necesita una Dionaea?") y refuerza SEO con preguntas indexables.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  skill `wix-manage` (apps + seeding).
- **Estado (inspeccionar antes de empezar):** `src/features/`, `src/shared/`,
  `src/app/`, `src/pages/`, `.wix/seeded.json`, patrón de instalación de apps de los
  steps 38/42/43/44 (`POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`,
  `appDefId` desde *Apps Created by Wix* o Search Market Listings — nunca adivinarlo;
  tras instalar, retry con backoff 1s/2s/4s por propagación).
- **ANTES DE INSTALAR:** con `SearchWixRESTDocumentation` ("FAQ questions categories")
  ubicar la API real del FAQ (`faq` / `categories` / `questions`) y con
  `SearchWixAPISpec` confirmar el método de escritura si existe (para el seed) y las
  capabilities de lectura. Si el único caminio de contenido es una App Collection del
  CMS, sembrar va Data Collections extension (patrón step 32) y leer via
  `@wix/data`/`items.queryDataItems`.

## Functionality

1. **Instalar Wix FAQ** vía apps-installer REST; registrar
   `appDefId`/`instanceId` en `.wix/seeded.json → faq`.
2. **Seed de contenido:** 3–4 categorías (Light & placement, Water & feeding, Rebels &
   beginners, Shipping & returns) con 4–6 preguntas reales cada una; copy en tono de
   marca (`petals-predators` voice). IDs → `.wix/seeded.json`.
3. **Feature `src/features/faq/`** (kebab-case, sin barrel, exports concretos):
   - `faq.ts` — data-access: `listFaqCategories()`, `listQuestions(categoryId)`,
     `searchFaq(query)` (o búsqueda client-side si la API no la soporta) con
     `auth.elevate` + try/catch → `[]`/`null` (página viva aunque la app no responda).
   - `faq-accordion.tsx` — isla React: categorías en <details>-style accesibles
     (botones `aria-expanded`), búsqueda con filtro inmediato, deep-link `#q-<slug>`
     que abre la pregunta al cargar ((savedInstanceState no aplicable; leer el hash en
     `astro:page-load` para respetar el ClientRouter).
4. **Latiguillo:** desde Smart Chat, cuando sea pertinente, el owner puede responder
   con el link a `/faq#q-…` (no requiere cambio de código; verificar que el anchor
   funciona dentro del router de Astro).

## Pages / Sections

- `src/pages/faq.astro` — hero corto, navegación de categorías, lista de acordeones
  con búsqueda; 404 no aplica (página estática) pero content vacío degrade a mensaje.
- Footer: link `/faq` (¿nav primaria si no rompe el límite de links? Decidir según
  layout actual; medir antes).

## Design

- Tokens: fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`,
  énfasis `accent`; radii 4/6/12; transiciones 0.2s `cubic-bezier(.4,0,.2,1)`;
  responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- Estilo de acordeón alineado con `product-catalog` filter groups / journal toc si ya
  existe patrón.

## Wix wiring

- Queries en runtime con `auth.elevate`; `.wix/seeded.json` solo slugs/IDs de apoyo
  (nunca importarlo en rutas `.astro`).
- Si la búsqueda del FAQ no existe server-side, filtrar en memoria tras traer todas
  las preguntas (volumen de un FAQ es chico, no hay paginación).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [ ] `/faq` 200 con categorías seeded y búsqueda filtra; `/faq#q-<slug>` abre pregunta; `/es/faq` + `/it/faq` localizados
- [ ] Tests: unit `tests/features/faq/faq.test.ts` (data-access + filtro búsqueda, estados vacíos); E2E `tests/e2e/faq.spec.ts`
- [ ] Verificaciones + hallazgos en `## Resultado` (fila 49 del roadmap corta)

## Al terminar

1. Doc hallazgos/tradeoffs/docs links en `## Resultado` de este archivo.
2. Marca paso 49 `✅ done` en `ROADMAP.md` con celda Notas = `step-49-faq-app.md`.
3. Siguiente: `/step-50-blog-comments`.

## Resultado

**App instalada y seeded.** Wix FAQ first-party (`appDefId` `14c92d28-031e-7910-c9a8-a670011e062d`, encontrado por Search Market Listings — no está en la tabla *Apps Created by Wix*; instalado vía `POST /apps-installer-service/v1/app-instance/install`, instancia `afb8c2cd-8e64-44c4-8b5d-6fd3a85a0569`). Seed vía REST real:

- `POST /faq/v2/categories` → 4 categorías: Light & placement `e69d8427-…`, Water & feeding `a06685a1-…`, Rebels & beginners `2f3debb1-…`, Shipping & returns `dd1aee9b-…` (sortOrder 10/20/30/40).
- `POST /faq/v2/question-entries` → 23 preguntas con `plainText` (brand voice) + `sortOrder`. Estado VISIBLE.

**Hallazgos / gotchas del API:**

- `UpdateQuestionEntry` exige un campo `status` ("VISIBLE" | "HIDDEN") que **no está en el esquema OpenAPI** (el sample flow sugería `PUBLISHED`, que rechaza con `INVALID_QUESTION_STATUS`). PATCH sin `status` falla.
- La app **crea categorías placeholder ('General' y 'Setting up FAQs', con preguntas de ayuda con respuestas vacías) unos segundos DESPUÉS del install**; el listado fresco post-install daba 0 categorías. Fueron borradas vía `DELETE /faq/v2/categories/{id}` (la cascada borra las preguntas; un conteo "29" posterior fue lectura con cache — hoy quedan 4 categorías + 23 preguntas).
- Wix genera `slug` recortado (primeras ~3 palabras de la pregunta): `does-my-venus`, `do-you-ship`, …; únicos en este seed. El anchor del front usa `q-<slug>` con fallback `q-<id>`.
- **Redactar el copy con foco**: al seedear, me deslizaron una palabra de otro idioma y una frase rara en la respuesta de "Can I grow a pitcher plant indoors?"; se corrigieron vía PATCH (leer `revision` primero, luego actualizar `plainText` + `status`). Las 23 respuestas quedaron revisadas.
- El `<details open>` como **prop controlado de React + toggle nativo de `<summary>` hace doble flip en el primer click** (quedaba cerrado). Solución: `<details>` sin `open` ni onClick (nativo), y el deep-link abre imperativamente `el.open = true` en `applyHash`.
- Deep-link same-document: de `/faq` a `/faq#q-…` con ClientRouter/hash-only no hay reload ni `astro:page-load` → necesario `window.addEventListener('hashchange')`.
- Tests E2E: la isla expone marker `data-faq-ready` (efecto de mount) y el spec espera `waitForFunction` antes de interactuar (el `fill` de Playwright corria antes de que la isla hidratara con el SSR dev frío ~5 s).
- Search server-side inexistente en el FAQ app → `searchFaq(query, questions)` filtra en memoria (normaliza acentos con NFD/\p{M}); el volumen (23) lo permite sin paginación.
- `buildFaqPage` filtra entries cuyo `categoryId` ya no existe (protección para categorías borradas en dashboard).
- Localizadas `/es/faq` + `/it/faq` llegan 200 y renderizan el contenido seeded (el contenido del app queda en EN: traducción vía `wix translation push` es interactiva/TTY, ver AGENTS).
- Smart Chat handoff: los owners responden con `/faq#q-<slug>`; los anchors funcionan en navegación completa, en hash-only (hashchange) y tras route swap (astro:page-load). Cada pregunta además tiene botón "Copy answer link".

**Tradeoffs:** island `client:load` para interactividad inmediata (search + acordeones) con SSR HTML del contenido (SEO indexable); búsqueda client-side in-memory sobre la data completa pasada como props (page payload ∝ FAQ total; aceptable a este volumen).

**Docs:** [Categories V2](https://dev.wix.com/docs/api-reference/business-management/faq-app/category-v2/introduction) · [Question Entries V2](https://dev.wix.com/docs/api-reference/business-management/faq-app/question-entry-v2/introduction) · [FAQ sample flows](https://dev.wix.com/docs/api-reference/business-management/faq-app/sample-flows) · [Bulk delete entries](https://dev.wix.com/docs/api-reference/business-management/faq-app/question-entry-v2/bulk-delete-question-entries).

**Verificaciones (comando → resultado):**

- `npx @wix/cli@latest build` → exige Node ≥ 24.18 (aquí corre v22.14, no disponible); **`npm run build` (wix build) → Complete**.
- `npm run check` (astro check) → 0 errores, 0 warnings (14 hints pre-existentes).
- `npm test` → 50 files / 345 tests passed (incl. 16 nuevos de `tests/features/faq/faq.test.ts`).
- `npm run test:e2e` → 51 passed (incl. 5 de `tests/e2e/faq.spec.ts`); un flake previo de `i18n.spec` (link `/products` sin localizar, SSR frío) quedó verde en suite completa final.
- `/faq` manual: hero + 4 categorías + 23 preguntas; búsqueda filtra; `/faq#q-is-distilled-water` abre y scrollea; overflow horizontal 0 en 360 y 390.
- **Screenshots (abrir y revisar):** `.tmp/faq-mobile-390-deeplink.png`, `.tmp/faq-mobile-390-search.png`, `.tmp/faq-desktop-1280-deeplink.png`, `.tmp/faq-desktop-1280-search.png`.
- Estado backend verificado por API: 4 categorías, 23 question-entries, sin placeholders restantes.

**Siguiente:** `/step-50-blog-comments`.
