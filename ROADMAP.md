# Roadmap — Petals & Predators

Fuente de verdad del **QUÉ** sigue. Los comandos `.opencode/commands/step-N-*.md` son
la fuente de verdad del **CÓMO** ejecutar cada paso.

Estados: `pending` → `materialized` (ya existe su step-N file) → `✅ done` (ejecutado y verificado).

| # | Paso | Status | Archivo / Notas |
|---|------|--------|-----------------|
| 0 | Scaffold + Wix setup (login, proyecto, apps, env) | ✅ done | `step-0-scaffold-and-setup.md` |
| 1 | Design system + header + navbar + hero | ✅ done | `step-1-create-hero-section.md` |
| 2 | Footer completo | ✅ done | `step-2-create-footer.md` |
| 3 | Seed del catálogo (5 plantas, variantes, categorías, imágenes) | ✅ done | `step-3-seed-plant-catalog.md` |
| 4 | Home landing scroll-world con los 6 clips de `public/videos/` | ✅ done | `step-4-create-home-page.md` (+ receta en `.opencode/references/higgsfield-landing-prompts.md`) |
| 5 | Shop + páginas de categoría | ✅ done | `step-5-create-shop-page.md` |
| 6 | Product detail (variantes + add-to-cart) | ✅ done | `step-6-create-product-detail.md` |
| 7 | Cart + checkout nativo Wix + badge en nav | ✅ done | `step-7-create-cart-and-checkout.md` |
| 8 | About + Contact (Wix Forms) | ✅ done | `step-8-create-about-and-contact.md` |
| 9 | SEO + accesibilidad + polish | ✅ done | `step-9-seo-and-accessibility.md` |
| 10 | Member login + account (Wix Members Area) | ✅ done | `step-10-member-login-and-account.md` · app Wix Members Area + `@wix/members`; nav "Log in"/"Account" + `/account` (perfil + logout) |
| 11 | Plant care journal (CMS) | ✅ done | `step-11-plant-care-journal.md` · Colección Wix CMS `care-guides` (title, slug, intro, body, plantTag, coverImage) + 4 guías seeded + rutas `/journal` y `/journal/[slug]` (404 si no existe) + link "Journal" en el nav + featured guide en home + sitemap |
| 12 | Multilingual support (en, es, it) + Wix Translation | ✅ done | `step-12-multilingual-support.md` · Integración i18n con Wix Managed Headless. URLs `/`, `/es/*`, `/it/*` servidas por el middleware de Wix Multilingual (mantener `src/pages` plano — no crear carpetas por locale); idioma actual con `i18n.getLanguage()`. 108 claves planas en `src/translations.json` + seeds `es`/`it` en `.wix/multilingual/translations/`; selector de idioma (dropdown) en header (desktop) y menú móvil; nav recortado a 5 links (`site.navPrimary`) para evitar el wrapping; hreflang/canonical/`og:locale` + sitemap por locale; `lang` en login/logout. Textos editables desde dashboard de Wix (Translation) vía `npm run wix translation push` / `npm run wix translation pull` — **push requiere terminal interactivo (TTY)**; mientras tanto los textos ya viajan en el bundle. Ver: [Add multilingual support](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/add-multilingual-support#add-multilingual-support) |
| 13 | SEO main pages + robots/sitemap (dashboard Wix) | ✅ done | `step-13-seo-main-pages.md` · `<head>` sin `title`/`description`/`canonical`/OG/Twitter/`hreflang` (manda el dashboard; Wix inyecta los tags con `wix-seo-tag`); `meta robots` solo si `noindex`; `robots.txt` y `sitemap.xml` servidos por Wix (borrados `robots.txt.ts`/`sitemap.xml.ts` y `robots: { enable: false }`). Publicado en `petals-d960960gm-0609.wix-site-host.com`. **Pendiente manual (no hay API para main pages headless):** SEO & GEO → SEO Settings → Main Pages (defaults + por página) y Robots.txt Editor. **Tradeoff aceptado:** se retiró el `hreflang` (Wix no lo reemplaza en el patrón); el sitemap index de Wix no incluye `/journal/[slug]` (CMS) ni `/lookbook` |
| 14 | SEO item pages con `@wix/seo` | ✅ done | `step-14-seo-item-pages.md` · `<slot name="seo-tags">` + `wixMetadata` desde `WIX_APPS` (`checkoutAndOrders`, no `stores`) en `/products/[slug]` y `/category/[slug]` + `<SEO.Tags>` con `loadSEOTagsServiceConfig` (`pageUrl` desde `x-wix-forwarded-url` con fallback a `Astro.url.href`; fetch de producto en paralelo); journal (CMS, sin tipo Wix) auto-renderiza title/description/`og:image` + `Article` JSON-LD vía `<slot name="head">`. Publicado. **Gotcha:** `@wix/seo` trae `@wix/headless-seo` que importa `@wix/services-manager` como *peer* de `@wix/services-manager-react`; con `legacy-peer-deps=true` no se instala solo → añadido `@wix/services-manager` a deps. **Tradeoff aceptado:** Wix sigue inyectando además un `<title>` genérico por path (`Products`/`Category`/`Journal`) en el item page; el primer `<title>` (el de `SEO.Tags`/nuestro) gana en el navegador (sin off-switch desde código). **Follow-up (descripción):** el patrón por defecto de Wix para `STORES_PRODUCT`/`STORES_CATEGORY` no trae `<meta name="description">` y `{{product.description}}` resuelve vacío → se emite la description en el `<slot name="head">` (`toMetaDescription` en `src/utils/seo.ts`): product usa su `plainDescription`/rich, category cae a `category.meta-description` (los productos/categorías no tienen description en Wix). Publicado y verificado |
| 15 | Lookbook estacional | materialized | `step-15-seasonal-lookbook.md` · Landing `/lookbook` con grid editorial (CMS items + fotos), CTA desde home y nav |
| 16 | Reseñas de producto | materialized | `step-16-product-reviews.md` · Ratings/reviews de Wix Stores en PDP + sección "What growers say" en home |
| 17 | Gift cards landing | pending | Activar el pack `gift-cards` (hoy en `disabledPacks`): `/gift-cards` + nav link + mount en home |
| 18 | Newsletter signup | pending | Formulario Wix Forms "Newsletter" en footer (receta wix-manage `references/forms/create-form.md`) + confirmación |
| 19 | Site search | pending | Overlay de búsqueda de productos (`queryProducts` search) en nav, atclado a `/` |
| 20 | Workshops (Bookings) | pending | Pack bookings: app + servicios (Care 101, Repotting 101) + `/services` + nav link |
| 21 | Analytics + consent | pending | Wix Analytics, eventos de compra, banner de consent si aplica |
| 22 | Performance audit | pending | Lighthouse, formatos de imagen, carga de fuentes, bundle |
| 23 | Build + release (sitio en vivo) | materialized | `step-23-build-and-release.md` |
| 24 | Historial de órdenes (miembros) | pending | Feature a futuro. No hay API member-scoped de órdenes de tienda en headless (solo Pricing Plans); requeriría `orders.searchOrders()` con auth elevada (`ECOM.READ_ORDERS`) — riesgo de seguridad, evaluar antes. |

---

## Wix Managed Headless — capacidades, guías y fuente de verdad

Esta sección captura lo que **puede hacer y debemos hacer** con Wix Managed Headless (Astro). Usarla como referencia al crear/mantener pasos.

- [About the Astro integration (Wix Managed Headless)](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration#about-the-astro-integration) — Visión general de integración, capacidades y arquitectura.
- [Astro templates for Wix Managed Headless](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/get-started/astro-templates#astro-templates-for-wix-managed-headless) — Plantillas de referencia para inspirarnos en estructura/código.
- [About the Wix CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/about-the-wix-cli#about-the-wix-cli) — Comandos CLI, flujo de desarrollo.
- [Build and deploy with the CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/build-and-deploy-with-the-cli#build-and-deploy-a-headless-project-with-the-wix-cli) — `wix build`, `wix deploy`, preview y release.
- [Write unit tests for a Wix CLI project](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/write-unit-tests#write-unit-tests-for-a-wix-cli-project) — Cómo testear en proyectos Wix CLI.
- [Environment variables in the CLI (overview)](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/environment-variables/about-environment-variables-in-the-cli#about-environment-variables-in-the-cli) — Variables de entorno, seguridad y contexto.
- [Manage environment variables in the CLI](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/development/environment-variables/manage-environment-variables#manage-environment-variables-in-the-cli) — CRUD de env vars via CLI.
- [Track analytics events](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/track-analytics-events#track-analytics-events) — Integración con Wix Analytics + eventos custom.
- [SEO support — about](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/about-seo-support#about-seo-support) — **Importante:** la inyección automática cubre **solo páginas principales**. Probar SEO **únicamente en el sitio publicado** (no en `wix dev` local).
- [Manage SEO for main pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/manage-seo-for-main-pages#manage-seo-for-main-pages) — Configuración SEO para páginas principales.
- [Add SEO support to item pages](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/add-seo-support-to-item-pages#add-seo-support-to-item-pages) — SEO para páginas dinámicas (PDPs, journal posts, etc.).
- [Add apps with the REST API](https://dev.wix.com/docs/go-headless/project-management/add-apps-with-the-rest-api#add-apps-with-the-rest-api) — Instalar apps desde código/REST cuando corresponda.
- [Featured business solutions for Wix Headless](https://dev.wix.com/docs/go-headless/business-solutions/featured-business-solutions#featured-business-solutions-for-wix-headless) — Soluciones de negocio disponibles (Stores, Bookings, CMS, Blog, Events, Forms, etc.).
- [About Wix Hosted Pages](https://dev.wix.com/docs/go-headless/business-solutions/wix-hosted-pages/about-wix-hosted-pages#about-wix-hosted-pages) — Páginas alojadas por Wix (checkout, membresía, etc.) y cuándo usarlas.
- [Redirect to Wix Hosted Pages using the JS SDK](https://dev.wix.com/docs/go-headless/business-solutions/wix-hosted-pages/redirect-using-the-js-sdk#redirect-to-wix-hosted-pages-using-the-js-sdk) — Redirecciones a hosted pages vía SDK.
- [Add multilingual support (i18n)](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/add-multilingual-support#add-multilingual-support) — Configurar múltiples idiomas. Comandos clave: `npm run wix translation push` / `npm run wix translation pull`. Habilita edición desde Wix Translation dashboard.

---

**Uso:** cuando no exista el siguiente `step-N` en `.opencode/commands/`, ejecutar
`/generate-next-steps` — materializa los próximos items `pending` (default 3) con la
plantilla fija y actualiza este archivo.
