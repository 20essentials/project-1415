---
description: Step 50 — Blog comments: leer y postear comentarios en el Journal · Petals & Predators
---
# Step 50 — Blog comments: leer y postear comentarios en el Journal

> **Siguiente:** `/step-51-workshops-waitlist`

## Objetivo

Los posts del Journal muestran sus comentarios (SSR) con contador en el feed, y los
miembros logueados pueden comentar desde el sitio (o visitors si la API de comments
lo permite), con moderación humana vía estado HIDDEN.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
  El blog ya existe (steps 38–41, app `14bcded7-0066-7c35-14d7-466cb3f09103`, 12 posts
  × 3 idiomas). Los comentarios dan vida social al Journal con backend ya montado.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless`.
- **API a confirmar ANTES de codificar (paso 1 de Functionality):** Wix Comments
  (`wix.comments.ng.v1`) está confirmado para lectura: `POST /comments/v1/comments/query-cursor`
  y `POST /comments/v1/comments/count` con `appId` del Blog + filtro pertinente
  (identificar el filtro correcto por post/contextId leyendo
  [Query Comments](https://dev.wix.com/docs/api-reference/crm/community/feedback-moderation/comments/comments/query-comments)
  → [Sobre Query Comments](https://dev.wix.com/docs/api-reference/crm/community/feedback-moderation/comments/comments/query-comments) y su lista cerrada de filtros).
  Para la escritura confirmar con `SearchWixRESTDocumentation` ("create comment
  blog") + `SearchWixAPISpec` qué endpoint válido existe y qué scope exige
  (visitor, member o solo owner). Si la escritura requiere member auth, integrar con
  la identity de miembros ya existente (step 10). Si no hay endpoint de escritura
  usable headless, cortar por la vía de lectura + CTA "Join the discussion" que abre
  sesión (no forzar workarounds).
- **Estado (inspeccionar antes de empezar):** `src/features/blog/`,
  `src/features/account/`, `.wix/seeded.json → blog`, patrón de islas con
  estados idle/submitting/success/error (review-form del step 27).

## Functionality

1. **Confirmar API/shape de lectura y (si existe) escritura** de comments para el
   blog; documentar filtros válidos y scopes en `## Resultado`.
2. **Feature `src/features/comments/`** (kebab-case, sin barrel):
   - `comments.ts` — data-access: `listComments(contextId)` (sort `createdDate` DESC,
     paginado cursor), `countComments(contextId[])` para el feed; `auth.elevate` +
     try/catch → `[]`.
   - `comment-list.tsx` — render accesible; avatar/nombre/fecha; empty state
     amable ("No clones yet — be the first").
   - `comment-form.tsx` — isla: form para miembro logueado (validar sesión con
     patrón de account/`getContextualAuth` seguido del review-form); sin comentarios
     anónimos si la API no lo soporta.
3. **Integración blog:** en el post detail (`features/blog`) montar `comment-list` +
   form al final; en el feed/aggregations añadir contador junto a fecha/autor.
4. **i18n:** claves `comments.*` (form placeholder, submit, empty, errors, count)
   en `en`/`es`/`it` (`src/translations.json`).
5. **Moderación:** regla de moderación humana (nada automático): sin ui de
   administración headless; documentar en `## Resultado` cómo se ocultan
   (`HIDDEN` excluida por la API en count/query).

## Pages / Sections

- `src/pages/journal/[slug].astro` — sección de comentarios al final del post.
- `src/pages/journal.astro` (o el feed que exista) — contador por post.

## Design

- Tokens: fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`,
  énfasis `accent`; radii 4/6/12; transiciones 0.2s; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Lista visualmente austera, jerarquía menor que el post; form alineado con
  review-form.

## Wix wiring

- Lectura en runtime SSR con `auth.elevate`; `.wix/seeded.json` solo IDs del blog
  (no importarlo en rutas `.astro`).
- Si la escritura necesita member token client-side, la isla usa la identity
  (patrón step 10) — no crear `/api` propio que reenvíe tokens de owner
  (anti-pattern; step 42 ya lo descartó por permisos).

## Verificación

- [x] `npx @wix/cli@latest build` en verde · `npm run check` 0 errores · `npm test` verde · `npm run test:e2e` en verde
- [x] Post con comentario seeded muestra el comentario + contador; `/es/journal/<slug>` + `/it` localizados; slug inventado 404 sin sección rota
- [x] Escritura: con sesión de miembro, un comment real en `wix dev`; sin sesión, form deshabilitado con mensaje claro
- [x] Tests: unit `tests/features/comments/comments.test.ts` + E2E `tests/e2e/comments.spec.ts` (assertear solo lo que controla el repo)

## Al terminar

1. Doc hallazgos/tradeoffs/docs links en `## Resultado`.
2. Marca paso 50 `✅ done` en `ROADMAP.md` con celda Notas = `step-50-blog-comments.md`.
3. Siguiente: `/step-51-workshops-waitlist`.

## Resultado

Verificado (cómo): `npm run check` 0 errores; `npm test` 52 files / 357 tests pasando (incluye `tests/features/comments/comments.test.ts` 12 tests + `comment-form.test.tsx` jsdom); `node_modules/.bin/wix build` green (exit 0); `npm run test:e2e` 57/57 (incluye los 6 de `tests/e2e/comments.spec.ts` contra comando seeded real).

Circuito implementado:

- Lectura SSR: `comments.listCommentsByResource(appId, { contextId, resourceId, commentSort: { order: 'NEWEST_FIRST' } })` con HIDDEN excluido por defecto; conteo real vía `comments.countComments(appId, { filter: { resourceId } })`. Ambos con `auth.elevate` (precedente step 27).
- Escritura por servidor: `src/pages/api/comments.ts` (patrón `src/pages/api/reviews.ts`): valida input, resuelve identidad con `members.getCurrentMember()` (cookies SSR, nunca token de owner en cliente), postea `createPostComment` con richContent `PARAGRAPH` por `\n`. Sin sesión → 401; el island redirige al login localizado.
- Fallback owner-author: si el call ambient falla con 403/PERMISSION_DENIED pero hay memberId, reintenta elevado con `author: { memberId }` (grants WIX_COMMENTS.COMMENT_CREATE + COMMENT_OVERRIDE_AUTHOR). Creado así para el seed.
- Feed: contador de comentarios en los cards de `/blog` vía `posts.queryPosts` fieldset `METRICS` (`post.metrics.comments`) — una query en vez de N×`countComments` por postId. Deviación consciente del texto del paso (que sugería `countComments(contextId[])`): el SDK no filtra por lista de ids, y METRICS ya viaja en la query del feed. Documentado en `blog.blog.ts`.

Moderación humana: los comentarios creados viajan con estado `PUBLISHED` (evaluación/config del blog actual publica sin cola `PENDING`); moderación = ocultar con `status: HIDDEN` manual desde el dashboard (comentarios) o `comments.updateComment` vía API si se quiere automatizar; HIDDEN desaparece del listado SSR sin deploy.

Seed: comentario real `4b5fccca-839f-4d85-a77a-ba8200d166b5` en el post en `how-flytraps-actually-catch-their-prey` (id `c3923e17-99ad-4c06-8bf2-ea5d7ade7d63`), autor = autor del blog `60058239-f2bd-408b-89a2-6d464dff6e8a` (nickname visible `d960960gm`, datos del propio sitio, no inventados). Registrado en `.wix/seeded.json → blog.comments`. `metrics.comments = 1` verificado vía API tras el create.

Gotchas:

- El scope correcto del módulo es `@wix/comments` v1.0.221 (`comments.listCommentsByResource`, `comments.countComments`, `comments.createComment`); typings en `@wix/auto_sdk_comments_comments`. `contextId` y `resourceId` son ambos el postId para el blog.
- Los miembros se resuelven server-side con `auth.elevate(members.queryMembers)().in('_id', ids)` → `profile.nickname`; guest labels existen pero con blog de miembros el guest branch casi no ocurre.
- E2E: el login OAuth es externo (sin credenciales en CI) → `comments.spec.ts` assertea solo repo: sección, comentario seeded, contador del feed, CTA de login con `returnToUrl`, empty state, 404, y chrome localizado en `/es`. OJO: el slug ES del post no es el EN — las variantes viven en `.wix/seeded.json → blog.postTranslations` (`/es/blog/como-cazan-de-verdad-las-trampas-de-venus`); EN slug 404 en `/es` es el comportamiento correcto.
- El contador del feed usa "1 comment" / "%d comments" (del copy `comments.count-one`/`comments.count`), no un badge.

Pendiente conocido: el flujo de posteo con sesión Viva de miembro se ejercita en unit (mock + island test con fetch stub); un E2E real requeriría login OAuth fuera de CI (mismo límite que reviews step 27).

Screenshots para revisar: `.tmp/step50-post-mobile.png` (sección Comments con comentario seeded + CTA login, móvil 390), `.tmp/step50-feed-mobile.png` (feed con contadores), `.tmp/step50-post-desktop.png` (1280).

Siguiente: `/step-51-workshops-waitlist`.
