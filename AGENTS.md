- No usamos python, solo nodejs.
- Nos inspiraremos en la web de: https://www.mintlify.com/
- Un punto de referencia es la documentation de Wix Managed Headless: https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration

# GENERAL
- Todo file adentro de src/* debe estar escrito en kebab-case.

## Arquitectura: Screaming Architecture (obligatoria para todo código nuevo)

Las carpetas describen **qué hace el negocio**, no qué tecnología usa. Al abrir `src/features/` debe leerse el negocio: `cart/`, `workshops/`, `gift-cards/`… no `components/`, `utils/`, `hooks/`.

```
src/
  app/          chrome de la app: layout.astro, header, footer, logo, language-selector
  shared/       infra cross-cutting (usada por 2+ features): i18n, wix-image, ricos, seo,
                analytics, wix-forms, discounts, site, og-image
  features/     UNA CARPETA POR CAPACIDAD DE NEGOCIO; aquí vive el 90% del código
    home/ product-catalog/ cart/ journal/ lookbook/ workshops/ gift-cards/
    reviews/ account/ newsletter/ contact/ site-search/
  pages/        SOLO rutas delgadas (requisito de Astro). Componen features; no tienen lógica de negocio.
  styles/ assets/ translations.json   infra sin mover (tooling @wix/astro + tokens de CSS)
```

Reglas de dependencia (las que hacen que "grite"):

1. Una feature expone **archivos concretos, no barrels**: no hay `index.ts` de feature. El resto del código importa la ruta exacta (`@/features/<feature>/<archivo>`), nunca un `@/features/<feature>` a secas.
2. Una feature **nunca importa de otra feature**. Si dos features necesitan lo mismo → sube a `src/shared/`.
3. `src/app/` (chrome) puede componer features (`header` usa `cart`, `site-search`). Features no importan de `app`.
4. **Cero archivos nuevos en `src/components/`, `src/utils/`, `src/data/`** (deprecados; no crear ni revivir esas carpetas).
5. Una feature incluye sus componentes, su data-access al SDK de Wix, sus tipos y su copy. Nada de "utils" genéricos.
6. Nombres en kebab-case, en inglés, en singular o plural según el dominio (`gift-cards`, `workshops`).
7. **Exports nombrados, nunca barrels ni default.** Preferir `export function` / `export const` / `export interface` e `import { X }`. Prohibido `export *` y `export default` en `.ts`/`.tsx`. Excepción única: los componentes `.astro`, que Astro exporta por default (se importan como default: `import Card from '@/features/…/card.astro'`).

Tests espejan la estructura: `tests/features/<feature>/*.test.ts(x)` y `tests/shared/*.test.ts`. Los E2E siguen planos en `tests/e2e/*.spec.ts` (son por ruta, no por feature).

`translations.json` **no se mueve** (lo consume `@wix/astro` con `translations: true`). El copy de cada feature se namespacea por feature en las claves (`workshops.*`, `gift-cards.*`, `reviews.*`…).


## Typescript
- No debes usar any, a menos que no tengas de otra. Trata de crear los tipos usando las docs de Wix:  https://dev.wix.com/docs/api-reference y https://dev.wix.com/docs/sdk y

## Gestor de paquetes (solo npm)

- **Solo npm.** No usar pnpm: no hay `pnpm-lock.yaml` ni `pnpm-workspace.yaml`; el único lockfile es `package-lock.json` y `node_modules` se instala flat (sin store `.pnpm`).
- `.npmrc` (raíz) fija dos defaults: `legacy-peer-deps=true` (evita los conflictos de peer-deps de la plantilla `@wix/cli`) y `min-release-age=1` (cooldown de 1 día a versiones recién publicadas; requiere **npm ≥ 11.10.0**).
- Instalar dependencias: `npm install` (ya no hace falta pasar `--legacy-peer-deps` a mano; lo aplica `.npmrc`).
- Crear el proyecto: mismo inicializador `@wix/new` (con npm: `npm create @wix/new@latest headless`).

## Build en Windows y parches de dependencias

- `@wix/astro@2.75.2` emite `export * from '<ruta>'` sin escapar; en Windows la ruta lleva backslashes y `astro build` falla con `Rollup failed to resolve import "C:Users..."`. El fix vive en `patches/@wix+astro+2.75.2.patch`.
- El parche se aplica solo: `package.json` tiene `"postinstall": "patch-package"` (devDep `patch-package`). **No** editar `node_modules/@wix/astro` a mano.
- Si se sube la versión de `@wix/astro`, regenerar el parche (`npx patch-package @wix/astro`) y renombrarlo a la versión nueva.

## Testing

- Typecheck: `npm run check` (`astro check`, devDep `@astrojs/check`). Necesario para ver errores de `.astro`/TS que `wix build` no reporta (el build solo compila). Correr antes de dar un paso por terminado.
- Stack: Vitest + `@testing-library/react` (jsdom). Correr con `npm test` (alias `npm run test:unit`); watch: `npm run test:watch`.
- Tests espejan la arquitectura: `tests/features/<feature>/*.test.ts(x)` y `tests/shared/*.test.ts`. `tests/setup.ts` registra `@testing-library/jest-dom` y limpia el DOM tras cada test.
- `vitest.config.ts` aliasa los módulos virtuales que no resuelven en Node: `wix:astro:i18n`, `astro:env/client`, `@wix/essentials` (mocks en `tests/mocks/`). Al testear código que los importe, extender los alias.
- Componentes React que llaman al SDK de Wix (p. ej. `cart-badge.tsx`) se testean mockeando el módulo (`vi.mock('@wix/ecom', ...)`).

E2E con Playwright (`@playwright/test`, Chromium ya instalado):
- Correr con `npm run test:e2e`; UI: `npm run test:e2e:ui`.
- `playwright.config.ts` levanta `astro dev` en `:4321` (webServer con `reuseExistingServer`). Los tests viven en `tests/e2e/*.spec.ts` (vitest ignora `*.spec.ts`, no pisarlos con `*.test.*`).
- El login usa los endpoints integrados de `@wix/astro` (`/api/auth/login`, `/api/auth/logout`): no crear `src/pages/login.ts` propio — `getContextualAuth()` fuera del contexto Wix tira 500 "Wix context is not available". Si el flujo necesita redirigir no autenticado, apuntar a `localize('/api/auth/login?returnToUrl=…')`.

## Apps de Wix (instalación vía API)

- **Sí se pueden instalar apps de Wix en el sitio vía REST** (Apps Installer API), sin pasar por el dashboard. Receta: https://dev.wix.com/docs/api-reference/business-management/app-installation/skills/install-wix-apps
- Endpoint: `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`
  Body: `{ "tenant": { "tenantType": "SITE", "id": "<SITE_ID>" }, "appInstance": { "appDefId": "<APP_DEF_ID>" } }` (con auth de sitio; sirve por MCP `ExecuteWixAPI` o por curl).
- **Nunca adivinar el `appDefId`.** Apps hechas por Wix → tabla *Apps Created by Wix* (https://dev.wix.com/docs/api-reference/articles/work-with-wix-apis/platform/about-apps-created-by-wix). Terceros → Search Market Listings: `POST https://www.wixapis.com/devcenter/app-market-listing/v1/market-listings/search` con `{ "searchTerm": "<nombre>" }` (el `appId` que devuelve es el `appDefId`).
- No chequear de antemano si la app ya está instalada (gasta un call): instalar directo y manejar el error. Tras instalar, una llamada dependiente puede fallar por propagación → reintentar con backoff (1s, 2s, 4s).
- Site Petals & Predators = `c6608ff9-497b-4734-8fe9-74132892d04c`. Estado de apps/seed en `.wix/seeded.json`.
- Ya instaladas vía API: Wix Reviews (ver `ROADMAP.md` step-16) y **Wix Gift Cards** (`appDefId` `d80111c5-a0f4-47a8-b63a-65b54d774a27`, instancia `457bf786-625b-4ca7-93a4-3fdd5878d1e2`, producto "eGift Card" `34e53e4e-a329-4aef-b4b2-6f4350f944e2` con 5 preset variants).

## Reglas de trabajo (lecciones aprendidas — no repetir)

Estas reglas existen porque ya cometí cada error. No son estilo, son calidad.

### Verificación honesta (nunca decir "verificado" sin verificar)

- Un build verde (`npx astro build`) **no** valida lint, clases canónicas de Tailwind, ni el HTML renderizado. Es solo compilación.
- "Verificar" exige ejecutar la comprobación concreta de lo que se afirma: si digo que no quedan clases no canónicas, tengo que correr el chequeo que las detecta (diagnósticos del language server de Tailwind) o revisar el CSS compilado, no mi memoria.
- Antes de reportar, declarar **qué** se verificó y **cómo** (comando + resultado). Si algo no se pudo verificar, decirlo explícitamente en vez de presentarlo como hecho.
- No afirmar hechos de los que no estoy seguro (p. ej. "esta clase no tiene equivalente canónico") sin comprobarlos. Un dato inventado presentado como certeza es peor que admitir la duda.

### Tailwind: usar siempre la sintaxis canónica

- Las clases con valores arbitrarios (`h-[2px]`, `gap-[5px]`, `z-[2]`, `opacity-[0.55]`, `aspect-[4/5]`, `max-w-[18rem]`, `duration-[600ms]`, `scale-[1.04]`) deben reescribirse a su forma canónica cuando exista (`h-0.5`, `gap-1.25`, `z-2`, `opacity-55`, `aspect-4/5`, `max-w-72`, `duration-600`, `scale-104`).
- La escala de spacing de Tailwind v4 es `--spacing: 0.25rem`: `N × 0.25rem`. Fracciones como `1.25` = 5px son válidas. **Por eso `gap-[5px]` sí es canónico (`gap-1.25`).** Verificar contra esa regla antes de descartar un reemplazo.
- El editor marca esto como `tailwindcss(suggestCanonicalClasses)`. Tratarlo como error, no como sugerencia opcional.
- Push de tokens del `@theme`: usar los utilitarios derivados (`bg-accent`, `text-paper`, `rounded-sm`) en vez de `bg-[var(--color-accent)]`, `text-[var(--color-paper)]`, `rounded-[var(--radius-sm)]`.
- En archivos CSS no-entry que usan `@apply`, incluir `@reference "./global.css"` para que los tokens y `@utility` sean visibles.

### Astro: preferir JSX declarativo sobre markup repetido

- El markup repetido se genera con un array en el **frontmatter** + `.map()` en el template, no copiando y pegando elementos.
- Por defecto, mantener los datos en el frontmatter del propio componente. **No** crear módulos externos salvo que los datos se compartan realmente entre varios archivos; abstraer de más es sobre-ingeniería. Si se comparten, van a `src/shared/` (2+ features) o al `data-access` de la propia feature.
- Mantener los marcadores de plantilla (`<!-- nav:links -->`, `<!-- nav:actions -->`, `<!-- home:* -->`) aunque se refactorice: el pipeline de pasos los usa.

### Comentarios: solo si aportan (nada de relleno)

- Regla práctica: si el comentario se puede borrar sin perder información, se borra.
- Prohibido el comentario que repite lo que el código ya dice (`// setea el estado`, `// loop sobre items`) o que narra la acción del agente.
- Sin bloques-parrado ni cabeceras de scaffold/skeleton (`// ── Composer skeleton: …`). Un comentario = máximo una línea.
- Un comentario solo se justifica si explica un **por qué** no evidente: gotcha de API, workaround, decisión de diseño, id mágico. Nada más.
- Conservar únicamente los comentarios operativos que el tooling/pipeline necesita (marcadores `<!-- nav:links -->`, `<!-- nav:actions -->`, `<!-- home:* -->`).

### Diagnóstico de herramientas (no forzar soluciones)

- Si `Edit` falla con "Could not find oldString" en un bloque multilínea pero encuentra una sola línea, sospechar diferencias de fin de línea (CRLF vs LF). Diagnosticar la causa antes de recurrir a reescribir archivos enteros.
- Ante un error de herramienta, entender por qué falla; no aplicar el primer workaround que "funcione".

### Archivos temporales (siempre dentro del workspace)

- Todo output temporal (logs de servidores, respuestas curl, dumps, patches) se escribe en `./.tmp/` de este proyecto (ya en `.gitignore`). Setup ref: `/setup-opencode-temp`.
- **Nunca escribir en `/tmp`, `C:\Temp` ni `AppData\Local\Temp`**: el shell no está autorizado ahí y cada escritura dispara el prompt de permisos y ataja al usuario la sesión. Redirecciones tipo `npm run dev > /tmp/x.log` o `curl ... > /tmp/x.json` están prohibidas; usar `./.tmp/x.log`.

### Alcance (no asumir más de lo pedido)

- No ampliar el alcance por inferencia (p. ej. "todo src" → convertir hojas CSS enteras, borrar scaffold). Si el alcance es ambiguo o implica cambios destructivos, preguntar antes de ejecutar.
- Cambios que pueden romper el build o alterar el diseño (conversión masiva de CSS, borrado de archivos) se confirman primero.

### Tests: assertear solo lo que controla la app (nunca output inyectado por Wix)

- **No assertear valores que Wix inyecta en SSR**: `<title>`, meta tags de SEO, etc. El home no tiene `<title>` en el repo — Wix pone `Home | Petals & Predators` desde la config SEO del sitio. Assertear eso testea la config del sitio, no el código: es frágil y falla por causas ajenas a la app.
- Assertear lo que **sí** es de la app: `html[lang]`, links localizados (`/es/products`), texto que renderizan los componentes propios, códigos HTTP, estados de navegación.
- Si el contenido viene de una app de Wix (Reviews, Gift Cards, Stores), assertear que la página/componente se **renderiza** con datos sembrados y conocidos (p. ej. el nombre del producto), no chrome que Wix genera por su cuenta.
- Regla práctica: antes de commitear un E2E, preguntarse si el assert depende **solo** de lo que este repo controla. Si falla por config del sitio (SEO, idioma no publicado) y no por el código, es ruido: no escribirlo.

## Instalación de comandos y skills (siempre local)

- Todo comando o skill se instala **solo** dentro de `.opencode/` de este proyecto. Nunca en rutas globales (`~/.config/opencode/`, `~/.claude/`, `~/.agents/`) ni en otros proyectos.
- Comandos → `.opencode/commands/<nombre>.md`. Skills → `.opencode/skills/<nombre>/SKILL.md` (la carpeta del skill debe llevar el mismo `name` que su frontmatter).
- Al instalar desde un repo externo: clonar en un temporal, copiar **solo** la carpeta del skill (no el repo entero) con `SKILL.md` + sus `references/`, y verificar que el frontmatter tenga `name` y `description`.
- Recordar al usuario reiniciar opencode después de instalar: la config y los skills se cargan al arrancar.

## Flujo de trabajo por comandos

- El sitio se construye por pasos: cada `.opencode/commands/step-N-*.md` es la **fuente de verdad** de qué hacer a continuación. Ejecutar en orden (`/step-0-scaffold-and-setup`, `/step-1-create-hero-section`, …).
- `ROADMAP.md` (raíz) lleva el estado del backlog: `pending` → `materialized` → `✅ done`. Cada paso se marca `✅ done` al terminar.
- Cuando no exista el siguiente `step-N`, ejecutar `/generate-next-steps`: materializa los próximos items `pending` del roadmap con la plantilla fija.
- **Marca:** Petals & Predators — e-commerce en inglés (plantas carnívoras + flores). Design system en `DESIGN.md` (frontmatter = tokens canónicos; body = captura de referencia).
- **Recetas Wix:** skill `wix-headless` (`C:\Users\amoil\.agents\skills\wix-headless`) y skill `wix-manage` (apps + seeding).
- **Traducciones:** `wix translation push` requiere terminal interactivo (TTY) y `wix translation pull` requiere contenido ya publicado en el dashboard de Wix Multilingual; ninguno corre en un shell no interactivo.