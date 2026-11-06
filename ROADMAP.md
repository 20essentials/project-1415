# Roadmap — Petals & Predators

Fuente de verdad del **QUÉ** sigue. Los comandos `.opencode/commands/step-N-*.md` son
la fuente de verdad del **CÓMO** ejecutar cada paso.

## Resumen rápido

| Paso | Estado | Notas |
| :-- | :------ | :------ |
| 0 | ✅ done | Scaffold + Wix setup (login, proyecto, apps, env) |
| 1 | ✅ done | Design system + header + navbar + hero |
| 2 | ✅ done | Footer completo |
| 3 | ✅ done | Seed del catálogo (5 plantas, variantes, categorías, imágenes) |
| 4 | ✅ done | Home landing scroll-world |
| 5 | ✅ done | Shop + páginas de categoría |
| 6 | ✅ done | Product detail (variantes + add-to-cart) |
| 7 | ✅ done | Cart + checkout nativo Wix + badge en nav |
| 8 | ✅ done | About + Contact (Wix Forms) |
| 9 | ✅ done | SEO + accesibilidad + polish |
| 10 | ✅ done | Member login + account (Wix Members Area) |
| 11 | ✅ done | Plant care journal (CMS) |
| 12 | ✅ done | Multilingual support (en, es, it) + Wix Translation |
| 13 | ✅ done | SEO main pages + robots/sitemap |
| 14 | ✅ done | SEO item pages con `@wix/seo` |
| 15 | ✅ done | Lookbook estacional |
| 16 | ✅ done | Reseñas de producto |
| 17 | ✅ done | Gift cards landing |
| 18 | ✅ done | Newsletter signup |
| 19 | ✅ done | Site search |
| 20 | ✅ done | Workshops (Bookings) |
| 21 | ✅ done | Analytics + consent |
| 22 | ✅ done | Performance audit |
| 23 | ✅ done | Build + release (sitio en vivo) |
| 24 | ✅ done | Historial de órdenes (miembros) |
| 25 | ✅ done | Filtros y ordenación del catálogo |
| 26 | ✅ done | Cupones/promo en el carrito |
| 27 | ✅ done | Escribir reseña de producto |
| 28 | ✅ done | Favoritos (wishlist) |
| 29 | ✅ done | Perfil de miembro editable |
| 30 | ✅ done | Gift Cards: app oficial + compra real |
| 31 | ✅ done | Performance: métricas post-release + vídeo |
| 32 | ✅ done | Schemas CMS como código (Data Collections extension) |
| 33 | ✅ done | Restock alerts: event extension + dashboard page |
| 34 | ✅ done | CI/CD + env tipado |
| 35 | ✅ done | Analytics: eventos faltantes + plataformas externas + consentimiento granular |
| 36 | ✅ done | Workshops pagados: checkout online (Bookings) |
| 37 | ✅ done | Plant Parent Club: membresía con Pricing Plans + contenido gated |
| 38 | ✅ done | Wix Blog: app + feature blog (feed, categorías, post) |
| 39 | ✅ done | Blog: seed de 4 artículos reales (Draft Posts API) |
| 40 | ✅ done | Blog: pulido (teaser home, analytics, E2E) |
| 41 | ✅ done | Blog: traducción de los 12 posts a es/it (language-aware) |
| 42 | ✅ done | Wix Events: Open Day (RSVP) + tour pagado en `/events` |
| 43 | ✅ done | Wix Donations: campaña con goal en `/donate` |
| 44 | ✅ done | Wix Restaurants: menú + cena Jungle Tasting en `/dining` |
| 45 | ✅ done | Motion React Bits sutil en home, catálogo, PDP y lookbook |
| 46 | ✅ done | Smart Chat: gate de instalación + API backend |
| 47 | ✅ done | Smart Chat: widget flotante + vlist |
| 48 | ✅ done | Smart Chat: contacto, handoff y hardening |
| 49 | ✅ done | FAQ app: `/faq` con categorías + búsqueda de cuidado |
| 50 | ✅ done | Blog comments: leer + postear en el Journal |
| 51 | ✅ done | Talleres: waitlist CMS (la API nativa es solo EVENT) |

**Total:** 52/52 steps completados (0–51).
Los items ⚪ parket viven en su sección aparte: no se materializan ni ejecutan por iniciativa del agente — solo cuando el propietario lo pida explícitamente.

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
| 46 | Smart Chat: gate de instalación + API backend | ✅ done | `step-46-smart-chat-backend.md` |
| 47 | Smart Chat: widget flotante + vlist | ✅ done | `step-47-smart-chat-widget.md` |
| 48 | Smart Chat: contacto, handoff y hardening | ✅ done | `step-48-smart-chat-hardening.md` |
| 49 | FAQ app: `/faq` con categorías + búsqueda de cuidado | ✅ done | `step-49-faq-app.md` |
| 50 | Blog comments: leer + postear en el Journal | ✅ done | `step-50-blog-comments.md` |
| 51 | Talleres: lista de espera CMS (la API nativa es solo para sesiones EVENT) | ✅ done | `step-51-workshops-waitlist.md` |

## Premium / parket (solo cuando el propietario pida)

Nada de esta sección se materializa o ejecuta por iniciativa propia — `parket` no
es `pending` y `/generate-next-steps` los ignora. Cada uno se implementa solo con
go-ahead explícito del propietario (ahí se materializa su step con `/generate-next-steps`,
haciendo el status `pending` primero si hace falta).

| Paso | Status | Notas |
| :--- | :------ | :------ |
| Dominio propio + Wix Pages domain + AI discovery | ⚪ parket | Requiere coste: dominio + plan premium |
| Loyalty: puntos y recompensas | ⚪ parket | Instalar Wix Loyalty Program + `/rewards` member-only |
| Forum app ("growers' community") | ⚪ parket | Verificar factibilidad headless antes de materializar (members ya activo) |
| Dashboard pages adicionales (app extensions) | ⚪ parket | El propietario decidió no crear más dashboard pages |
| Marketing email (Automations: bienvenida / abandono de carrito) | ⚪ parket | Config de email flows en dashboard, no es UI headless |

**Dominio propio** (detalle para su step): conectar dominio comprado (DNS/HTTPS,
dominio primario, redirect desde wix-site-host.com) y añadirlo como allowed redirect
domain; conectar el Wix Pages domain para checkout/bookings hosted con marca. Verificar
`/_wix/pages.json`, `/sitemap.xml`, `/llms.txt` autogenerado y `/_api/mcp`. Prerrequisito
para `trackEvent()` en producción. **Docs:** [About Wix Hosted Pages](https://dev.wix.com/docs/go-headless/business-solutions/wix-hosted-pages/about-wix-hosted-pages#about-wix-hosted-pages) · [Redirects API](https://dev.wix.com/docs/api-reference/business-management/headless/redirects)

**Loyalty** (detalle para su step): instalar **Wix Loyalty Program** via Apps Installer,
activar el programa por API (rules de earned en dashboard si la API no las cubre);
`/rewards` member-only con balance/tier, catálogo de recompensas y canje a cupón
aplicable en el carrito; link en `/account`. **Docs:** [Loyalty Program API](https://dev.wix.com/docs/api-reference/crm/loyalty-program)

---

> Las guías de Wix, hallazgos, tradeoffs y verificaciones de cada paso quedan en la sección `## Resultado` del `.opencode/commands/step-N-*.md`; las filas de este archivo solo referencian el archivo (nota en una línea, sin explicación larga).

---

**Uso:** cuando no exista el siguiente `step-N` en `.opencode/commands/`, ejecutar
`/generate-next-steps` — materializa los próximos items `pending` (default 3) con la
plantilla fija y actualiza este archivo.
