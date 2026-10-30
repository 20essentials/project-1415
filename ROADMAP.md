# Roadmap — Petals & Predators

Fuente de verdad del **QUÉ** sigue. Los comandos `.opencode/commands/step-N-*.md` son
la fuente de verdad del **CÓMO** ejecutar cada paso.

## Resumen rápido

| Paso | Estado | Notas |
| :-- | :------ | :------ |
| 1 – 34 | ✅ done | Completados y verificados |
| 35 | ✅ done | Analytics: eventos faltantes + plataformas externas + consentimiento granular |
| 36 | ✅ done | Workshops pagados: checkout online (Bookings) |
| 37 | ✅ done | Plant Parent Club: membresía con Pricing Plans + contenido gated |
| 38 – 40 | ✅ done | Blog con Wix Blog: app + feature headless + 12 posts (el Journal sigue en CMS) |
| 41 | ✅ done | Blog: 12 posts traducidos a es/it (language-aware) |
| 42 | ✅ done | Wix Events: Open Day (RSVP) + tour pagado en `/events` |
| 43 | ✅ done | Wix Donations: campaña con goal en `/donate` |
| 44 | ✅ done | Wix Restaurants: menú + cena Jungle Tasting en `/dining` |

| step-x | ⚪ pending | Dominio propio + Wix Pages domain + AI discovery (requiere coste) |
**Total:** 44/44 pasos completados · 2 pendientes (dominio propio; loyalty diferido a pedido explícito del propietario)

---

Estados: `pending` → `materialized` (ya existe su step-N file) → `✅ done` (ejecutado y verificado).

**Arquitectura (desde step-24 en adelante):** todo código nuevo sigue Screaming Architecture — `src/features/<capacidad>/` (sin barrels: cada feature expone archivos concretos), `src/shared/` para infra cross-cutting y `src/app/` para el chrome. Ver reglas en `AGENTS.md`. Los steps 0–23 preceden la migración; sus rutas en los `.md` son historial y no se reescriben.



| # | Paso | Status | Archivo / Notas |
|---|------|--------|-----------------|
| 0 | Scaffold + Wix setup (login, proyecto, apps, env) | ✅ done | `step-0-scaffold-and-setup.md` |
| 1 | Design system + header + navbar + hero | ✅ done | `step-1-create-hero-section.md` |
| 2 | Footer completo | ✅ done | `step-2-create-footer.md` |
| 3 | Seed del catálogo (5 plantas, variantes, categorías, imágenes) | ✅ done | `step-3-seed-plant-catalog.md` |
| 4 | Home landing scroll-world con los 6 clips de `public/videos/` | ✅ done | `step-4-create-home-page.md` |
| 5 | Shop + páginas de categoría | ✅ done | `step-5-create-shop-page.md` |
| 6 | Product detail (variantes + add-to-cart) | ✅ done | `step-6-create-product-detail.md` |
| 7 | Cart + checkout nativo Wix + badge en nav | ✅ done | `step-7-create-cart-and-checkout.md` |
| 8 | About + Contact (Wix Forms) | ✅ done | `step-8-create-about-and-contact.md` |
| 9 | SEO + accesibilidad + polish | ✅ done | `step-9-seo-and-accessibility.md` |
| 10 | Member login + account (Wix Members Area) | ✅ done | `step-10-member-login-and-account.md` |
| 11 | Plant care journal (CMS) | ✅ done | `step-11-plant-care-journal.md` |
| 12 | Multilingual support (en, es, it) + Wix Translation | ✅ done | `step-12-multilingual-support.md` |
| 13 | SEO main pages + robots/sitemap (dashboard Wix) | ✅ done | `step-13-seo-main-pages.md` |
| 14 | SEO item pages con `@wix/seo` | ✅ done | `step-14-seo-item-pages.md` |
| 15 | Lookbook estacional | ✅ done | `step-15-seasonal-lookbook.md` |
| 16 | Reseñas de producto | ✅ done | `step-16-product-reviews.md` |
| 17 | Gift cards landing | ✅ done | `step-17-gift-cards-landing.md` |
| 18 | Newsletter signup | ✅ done | `step-18-newsletter-signup.md` |
| 19 | Site search | ✅ done | `step-19-site-search.md` |
| 20 | Workshops (Bookings) | ✅ done | `step-20-workshops-bookings.md` |
| 21 | Analytics + consent | ✅ done | `step-21-analytics-and-consent.md` |
| 22 | Performance audit | ✅ done | `step-22-performance-audit.md` |
| 23 | Build + release (sitio en vivo) | ✅ done | `step-23-build-and-release.md` |
| 24 | Historial de órdenes (miembros) | ✅ done | `step-24-member-order-history.md` |
| 25 | Filtros y ordenación del catálogo | ✅ done | `step-25-catalog-filters-and-sort.md` |
| 26 | Cupones/promo en el carrito | ✅ done | `step-26-cart-coupons.md` |
| 27 | Escribir reseña de producto | ✅ done | `step-27-write-product-review.md` |
| 28 | Favoritos (wishlist) | ✅ done | `step-28-wishlist.md` |
| 29 | Perfil de miembro editable | ✅ done | `step-29-member-profile.md` |
| 30 | Gift Cards: app oficial + compra real | ✅ done | `step-30-gift-cards-official-app.md` |
| 31 | Performance: métricas post-release + vídeo | ✅ done | `step-31-performance-post-release.md` |
| 32 | Schemas CMS como código (Data Collections extension) | ✅ done | `step-32-schemas-cms-as-code-data-collections-extension.md` |
| 33 | Restock alerts: event extension + dashboard page | ✅ done | `step-33-restock-alerts-event-extension-dashboard-page.md` |
| 34 | CI/CD + env tipado | ✅ done | `step-34-ci-cd-env-tipado.md` |
| 35 | Analytics: eventos faltantes + plataformas externas + consentimiento granular | ✅ done | `step-35-analytics-eventos-faltantes-plataformas-externas-consentimiento-granular.md` |
| 36 | Workshops pagados: checkout online (Bookings) | ✅ done | `step-36-workshops-pagados-checkout-online-bookings.md` |
| 37 | Plant Parent Club: membresía con Pricing Plans + contenido gated | ✅ done | `step-37-plant-parent-club-membresia-pricing-plans.md` |
| 38 | Wix Blog: app + feature blog (feed, categorías, post) | ✅ done | `step-38-blog-app-feature-feed-post.md` |
| 39 | Blog: seed de 4 artículos reales (Draft Posts API) | ✅ done | `step-39-blog-contenido-draft-posts.md` |
| 40 | Blog: pulido (teaser home, analytics, E2E) | ✅ done | `step-40-blog-pulido-analytics-e2e.md` |
| 41 | Blog: traducción de los 12 posts a es + it vía Blog API + queries language-aware | ✅ done | `step-41-blog-traduccion-posts-es-it.md` |
| 42 | Wix Events: "Open Day" RSVP gratuito + tour guiado pagado (`/events`) | ✅ done | `step-42-events-open-day.md` |
| 43 | Wix Donations: campaña "nuevo local" con goal (`/donate`) | ✅ done | `step-43-donations-campaign.md` |
| 44 | Wix Restaurants: cena selvática "Jungle Tasting" con Experiences (`/dining`) | ✅ done | `step-44-restaurant-jungle-tasting.md` |
| 45 | Motion React Bits sutil (shared/motion: 7 primitivas + card hover) en home, catálogo, PDP y lookbook | ✅ done | `step-45-motion-react-bits.md` |

## Aun no porque requiere comprar un plan de wix

| Paso | Status | Notas |
| :--- | :------ | :------ |
| Loyalty: puntos y recompensas | ⚪ pending | **Diferido:** solo a pedido explícito del propietario; no materializar por iniciativa propia |

Detalle para el step cuando se materialice: instalar **Wix Loyalty Program**, activar el programa por API (reglas de earned en el dashboard si la API no las cubre); `/rewards` member-only con balance/tier, catálogo de recompensas y canje a cupón aplicable en el carrito; link en `/account`.

**Docs:** [Loyalty Program API](https://dev.wix.com/docs/api-reference/crm/loyalty-program)

## Future

| Paso | Status | Notas |
| :--- | :------ | :------ |
| Dominio propio + Wix Pages domain + AI discovery | ⚪ pending | Requiere coste: dominio + plan premium |

Detalle para el step cuando se materialice:

**Costo:** compra/renovación de dominio + plan premium. Conectar dominio propio (DNS/HTTPS, dominio primario, redirect desde wix-site-host.com) y añadirlo como allowed redirect domain; conectar/verificar el Wix Pages domain para que checkout y bookings hosted mantengan la marca. Verificar `/_wix/pages.json` y `/sitemap.xml`; comprobar `/llms.txt` autogenerado y `/_api/mcp` (requieren dominio propio e indexación). **Prerrequisito del step 35:** `trackEvent()` solo entrega eventos en sitio publicado con dominio propio.

**Docs:** [About Wix Hosted Pages](https://dev.wix.com/docs/go-headless/business-solutions/wix-hosted-pages/about-wix-hosted-pages#about-wix-hosted-pages) · [Redirects API](https://dev.wix.com/docs/api-reference/business-management/headless/redirects) · [Track analytics events](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/track-analytics-events#track-analytics-events) · [About SEO support](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/feature-guides/seo/about-seo-support#about-seo-support)

---

> Las guías de Wix, hallazgos, tradeoffs y verificaciones de cada paso quedan en la sección `## Resultado` del `.opencode/commands/step-N-*.md`; las filas de este archivo solo referencian el archivo (nota en una línea, sin explicación larga).

---

**Uso:** cuando no exista el siguiente `step-N` en `.opencode/commands/`, ejecutar
`/generate-next-steps` — materializa los próximos items `pending` (default 3) con la
plantilla fija y actualiza este archivo.
