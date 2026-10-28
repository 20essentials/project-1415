---
description: Step 39 — Blog: seed de 4 artículos reales vía Draft Posts API · Petals & Predators
---
# Step 39 — Blog: seed de 4 artículos reales vía Draft Posts API

> **Siguiente:** `/step-40-blog-pulido-analytics-e2e`

## Objetivo

El blog arranca con contenido visible: **4 artículos reales en inglés** escritos para la marca, creados con la API de Draft Posts de Wix Blog (create → publish) y organizados en 2 categorías. `src/shared/ricos.ts` renderiza los nodos que el contenido blog real trae (imágenes, embeds) y `/blog/[slug]` muestra related posts reales.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores. Tono: preciso y curioso, sin misticismo; el comprador final es un hobbista con pocas plantas y muchas dudas.
- **Design system:** `DESIGN.md` + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** la feature del step 38 (`src/features/blog/blog.ts`, `src/pages/blog/*`), `src/shared/ricos.ts` (renderer actual y su lista de nodos soportados), `.wix/seeded.json` (bloque `blog` con appDefId/instancia del step 38).
- **Decisión del propietario:** 4 artículos en inglés; las traducciones es/it quedan para después. Contenido de blog = datos de negocio: no PII; los drafts se crean y publican vía REST con token de sitio (`npx @wix/cli@latest token --site "$SITE_ID"`).
- **Docs (obligatorio leer completos antes de la primera llamada):** [About the Draft Posts API](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/introduction) (límite 400KB por draft) · [Create draft post](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/create-draft-post) · [Publish draft post](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/publish-draft-post) · [About the Categories API](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/introduction) · [Get post](https://dev.wix.com/docs/api-reference/business-solutions/blog/posts-stats/get-post) (shape del `content` Ricos del post publicado)
- **Gotcha:** no adivinar el shape del body de create/publish — confirmar todos los campos (title, excerpt, coverImage, content, hashtags, seoData, language, autores) en el artículo del método y con `SearchWixAPISpec` antes de la primera llamada. Un 400 por campo mal nombrado no da info; leer primero.

## Functionality

1. **Categorías del blog** — crear 2 vía API (método exacto de **Create category** confirmado en docs y en `node_modules/@wix/blog` antes de escribir): **"Plant care"** (slug `plant-care`) y **"Stories"** (slug `stories`). Verificar en el dashboard que quedaron con `language: en`.
2. **Copys de los 4 posts (en inglés final)** — cada uno con título, excerpt (2 frases), 3–5 hashtags, portada (`wix:image://v1/...` — reutilizar imágenes existentes del sitio en media de Wix o subir nuevas con la Media API/UploadImageToWixSite) y body Ricos JSON (H2/H3 ≥ 2, párrafos cortos, 1 lista UL, 1 blockquote con tip de cuidado, 1 divider, ≥ 1 imagen inline como entity IMAGE):
   - **"How Flytraps Actually Catch Their Prey"** — *Stories*. El mecanismo de trigger hairs, la regla de los dos toques con su "memoria", el cierre, la digestión, qué NO hacer (las manos, moscas de fruta muertas) y qué sí.
   - **"Feeding Your Venus Flytrap Without Killing It"** — *Plant care*. Regla del tamaño de la presa (⅓ de la trampa), vivas vs secas, al aire libre vs indoor, no alimentar durante dormancy.
   - **"Winter Dormancy for Sarracenia and Flytraps, Done Right"** — *Plant care*. Señales del frío, temperaturas de 3–10 °C, regar algo menos, técnicas indoor (el método de la nevera como último recurso).
   - **"A Beginner's Guide to Terrarium Humidity"** — *Stories*. Terrario abierto vs cerrado, airflow, moho, qué especies conviven bien (Heliamphora, algunas Drosera) y cuáles nunca (flytraps).
   - Copy: frases cortas, encabezados informativos, sin florituras; entonación de la marca (curiosa, directa).
3. **Crear cada draft → verificarlo → publicarlo**: create con los campos del método; publicar con Publish draft post; capturar en `.wix/seeded.json` el bloque `blog.posts[]` (`{ id, slug, title, categoryId }`).
4. **`src/shared/ricos.ts`** — extender el renderer SOLO con los nodos que el contenido real trae (inspeccionar el JSON con Get post antes; no adivinar enum): mínimo `IMAGE` (resolviendo el `image.src` con `resolveWixImageUrl`), `VIDEO`, `EMBED` si acaso hay iframe externo seguro; mantener escape HTML + fallback `<p>` + `console.warn` para desconocidos. Test unit por nodo nuevo y por el mapping de imágenes.
5. **Related posts** — el detalle `/blog/[slug]` los renderiza con las categorías reales (el otro post de su categoría, ≤3); si no hay, la sección no se muestra.
6. **i18n:** nada de chrome nuevo (el contenido es data, no copy) — los `blog.*` del step 38 ya cubren el feed. Asegurar que el runtime de `listBlogPosts` **no** filtre por `language` (trae lo que haya: cuando existan traducciones es/it, se decide luego como paso aparte).

## Pages / Sections

- Sin rutas nuevas: el contenido alimenta `/blog`, `/blog/<slug>` y `/blog/category/<slug>` del step 38.

## Design

- Sin cambios de layout (tipografía del body ya dada por el step 38); revisar márgenes de imágenes y quotes del body para quedar en línea con el estilo `journal-body`.

## Wix wiring

- Drafts/publicaciones vía REST Blog con token del sitio; portadas referencian media del sitio (`wix:image://`) y se resuelven por `resolveWixImageUrl` en el mapping del blog/ricos.
- `.wix/seeded.json` guarda solo IDs de apoyo (posts/categories).

## Verificación

- [ ] 4 drafts creados y **publicados** (PUBLISHED en el dashboard, categorías asignadas)
- [ ] `.wix/seeded.json` con `blog.posts[]` completo (ids + slugs reales)
- [ ] `wix dev`: `/blog` muestra el destacado + grid con los 4 posts
- [ ] `wix dev`: `/blog/<slug>` renderiza meta + body completo con headings, UL, quote, divider e imagen
- [ ] `wix dev`: `/blog/category/plant-care` y `/blog/category/stories` → 200 con sus posts correspondientes
- [ ] Related posts aparece entre posts de la misma categoría
- [ ] `npx @wix/cli@latest build` verde · `npm run check` 0 errores · `npm test` verde (tests de nodos nuevos incluidos)

## Al terminar

1. Marca el paso 39 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-40-blog-pulido-analytics-e2e`.

## Resultado

**Docs:** [How to Create Blog Posts](https://dev.wix.com/docs/api-reference/business-solutions/blog/skills/how-to-create-blog-posts) · [Create draft post](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/create-draft-post) · [Create category](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/create-category) · **Seed vía MCP `ExecuteWixAPI`** (Node 22 sin CLI): categorías **"Plant care"** (`plant-care` `a2472276…2728`) y **"Stories"** (`stories` `fb5e4af0…2b0b`, ambas `language: en`) + 4 posts publicados con **Bulk Create Draft Posts** (`POST /blog/v3/bulk/draft-posts/create`, shape FLAT sin envelope `draftPost`, `publish: true` → live en la misma respuesta): "How Flytraps Actually Catch Their Prey" (Stories, `c3923e17…`), "Feeding Your Venus Flytrap Without Killing It" (Plant care, `6dcca5f0…`), "Winter Dormancy for Sarracenia and Flytraps, Done Right" (Plant care, `f12ae052…`), "A Beginner's Guide to Terrarium Humidity" (Stories, `5f74916d…`); autor = member pre-existente `60058239-f2bd-408b-89a2-6d464dff6e8a`; cada body Ricos con H2≥2, UL, blockquote tip, divider e imagen inline (portadas e inline = media existente del sitio `600582_*`; **hallazgo:** el SDK `@wix/sdk media.getImageUrl` no acepta ids desnudos — `src/shared/wix-image.ts` ahora construye `https://static.wixstatic.com/media/<id>` para ids que no son URL/URI; el renderer `renderRicos` suma el nodo `IMAGE` → `<figure><img …></figure>` con alt/dims/`null`-id→`""` + `console.warn` de desconocidos). **Desviación del step:** `getBlogPostBySlug` migrado de `hasSome('slug')` (los docs lo listaban, pero el runtime 400 "Field 'blogSeo.slug' is using non allowed operator '$hasSome'") → **`eq('slug')`**; el feed (`listBlogPosts`) sigue sin filtrar por `language` · `.wix/seeded.json` con `blog.categories` + `blog.posts[]` (12 posts con ids + slugs reales; **expansión a pedido del propietario:** los 4 del step + 8 más creados con el mismo Bulk Create — Watering, Light, Nepenthes pitchers, Repotting (Plant care); Cape Sundew, Pitcher anatomy, Placement, Flower stalks (Stories) — 6 posts por categoría; producción muestra 12 sin re-release porque el feed consulta por request) · **Cero chrome/copy nuevo:** el contenido es data · **Verificado:** `npm run check` 0 errores · `npm test` 176/176 (4 nuevos IMAGE en `tests/shared/ricos.test.ts` + 1 bare-id en `tests/shared/wix-image.test.ts`) · `npx astro build` verde · `npm run test:e2e` 23/23 (7 fails flaky via dev-server HMR durante recompilación; 0 con server limpio) · curl en `astro dev`: `/blog` 200 con featured+grid de 4, `/blog/how-flytraps…` 200 con h2/h3/UL/blockquote/hr/`<figure>` (alt + dims) y related de su categoría, `/blog/category/plant-care` y `/stories` 200 con sus 2 posts cada uno
