---
description: Step 41 — Blog: traducción de los 12 posts a es + it (Blog API) · Petals & Predators
---
# Step 41 — Blog: traducción de los 12 posts a es + it (Blog API)

> **Nota:** este paso fue una **customización directa del propietario** (sin step file
> en su momento — este archivo se escribe retroactivamente, solo por documentación).
> El trabajo ya está **✅ done** y released: no hay nada que ejecutar.

## Objetivo

Los 12 posts del blog existen traducidos a **es + it** (36 publicados en total) y el
feature `blog` es **language-aware**: cada locale sirve su propio lote de posts y
categorías.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- Estado previo: 12 posts en (step 39) + la app Blog ya instalada (step 38).

## Docs

- [Translate a draft post](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/translate-draft)
- [Query draft posts](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/query-draft-posts)
- [Update draft post](https://dev.wix.com/docs/api-reference/business-solutions/blog/draft-posts/update-draft-post)
- [Create category](https://dev.wix.com/docs/api-reference/business-solutions/blog/category/create-category)

## Lo que se hizo (registro histórico)

1. **Traducción vía MCP `ExecuteWixAPI`** (Node 22 sin CLI): por cada post
   `POST /blog/v3/multilingual/draft/{postId}` (devuelve `{ draftPost }`, **NO**
   `{ draft}`) → walk-replace de los text nodes del `richContent` con los textos
   traducidos (es/it escritos a mano, `.tmp/it-posts.json` validado) → publicación con
   `PATCH /blog/v3/draft-posts/{draftId}` `{ draftPost, action: "UPDATE_PUBLISH" }`.
   12 es (piloto "Regar las trampas" + batch de 11) + 12 it publicados.
2. **Draft huérfanos** del primer batch fallido recuperados con
   `POST /blog/v3/draft-posts/query` `filter: { language: { $eq: "it" } }` +
   `fieldsets: ["RICH_CONTENT"]` (ojo: `createdDate` NO sortable → 400; usar
   `editedDate` o nada).
3. **Hallazgo clave:** Wix auto-enlaza los posts traducidos a las categorías EN;
   corregido con `PATCH /blog/v3/draft-posts/{publishedPostId}` (mismo id compartido,
   modelo hasUnpublishedChanges) `{ draftPost: { categoryIds: [...] },
   action: "UPDATE_PUBLISH" }` — 22/22 patches OK.
4. **Categorías por idioma** vía clone de categoría con `language` (es: `cuidados`,
   `historias`; it: `cura-delle-piante`, `storie`; no existe duplicate-category
   endpoint: crear con title localizado + slug localizado).
5. **Slug lookup:** en el posts-query REST el `slug` es campo plano (`p.slug`), NO
   `p.url[].slug`.
6. **Feature language-aware (`src/features/blog/blog.ts`):** parámetro
   `language: string = PRIMARY_LOCALE` (importado de `@/shared/i18n`, sin usar
   `currentLanguage()` en la feature para no acoplarla al runtime de i18n) en
   `listBlogPosts`, `getBlogPostBySlug`, `listBlogCategories`, `getBlogCategoryBySlug`,
   `relatedPosts` y `categoryLabelsById` + `.eq('language', language)` en las 4 queries;
   los 5 call-sites de páginas pasan `currentLanguage()` explícito.
7. **`.wix/seeded.json`:** `blog.categoriesByLanguage` (plant-care/stories → ids es/it)
   + `blog.postTranslations.es|it[]` (12 c/u con `postId` en, `id`, `slug`, `title`,
   `categoryId` del idioma).

## Verificación (ya hecha)

- [x] `npm run check` 0 errores (141 files) · `npm test` 178/178 (2 nuevos de language)
- [x] `npx astro build` verde · `npm run test:e2e` 28/28 (teaser home ahora
      order-agnostic: assert `From the blog` + CTA + link `/blog/*`)
- [x] `wix release` publicado en https://petals-d960960gm-0609.wix-site-host.com
- [x] Smoke producción: `/es/blog` 200 con "Regar las trampas" + su slug, categoría
      `/es/blog/category/cuidados`; `/it/blog` 200 con "Annaffiare le trappole"

## Al terminar

Nada más que hacer: fila 41 del roadmap ya está `✅ done`. Siguiente:
`/step-42-events-open-day`.
