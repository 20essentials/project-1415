# Roadmap — Petals & Predators

Fuente de verdad del **QUÉ** sigue. Los comandos `.opencode/commands/step-N-*.md` son
la fuente de verdad del **CÓMO** ejecutar cada paso.

Estados: `pending` → `materialized` (ya existe su step-N file) → `done` (ejecutado y verificado).

| # | Paso | Status | Archivo / Notas |
|---|------|--------|-----------------|
| 0 | Scaffold + Wix setup (login, proyecto, apps, env) | done | `step-0-scaffold-and-setup.md` |
| 1 | Design system + header + navbar + hero | done | `step-1-create-hero-section.md` |
| 2 | Footer completo | done | `step-2-create-footer.md` |
| 3 | Seed del catálogo (5 plantas, variantes, categorías, imágenes) | done | `step-3-seed-plant-catalog.md` |
| 4 | Home landing scroll-world con los 6 clips de `public/videos/` | done | `step-4-create-home-page.md` (+ receta en `.opencode/references/higgsfield-landing-prompts.md`) |
| 5 | Shop + páginas de categoría | done | `step-5-create-shop-page.md` |
| 6 | Product detail (variantes + add-to-cart) | done | `step-6-create-product-detail.md` |
| 7 | Cart + checkout nativo Wix + badge en nav | done | `step-7-create-cart-and-checkout.md` |
| 8 | About + Contact (Wix Forms) | done | `step-8-create-about-and-contact.md` |
| 9 | SEO + accesibilidad + polish | done | `step-9-seo-and-accessibility.md` |
| 10 | Member login + account (Wix Members Area) | materialized | `step-10-member-login-and-account.md` · app Wix Members Area + `@wix/members`; nav "Log in"/"Account" + `/account` (perfil + logout) |
| 11 | Plant care journal (CMS) | pending | Colección Wix CMS `care-guides` (title, slug, intro, body, plantTag) + rutas `/journal` y `/journal/[slug]` + link "Journal" en el nav + featured guide en home |
| 12 | Lookbook estacional | pending | Landing `/lookbook` con grid editorial (CMS items + fotos), CTA desde home y nav |
| 13 | Reseñas de producto | pending | Ratings/reviews de Wix Stores en PDP + sección "What growers say" en home |
| 14 | Gift cards landing | pending | Activar el pack `gift-cards` (hoy en `disabledPacks`): `/gift-cards` + nav link + mount en home |
| 15 | Newsletter signup | pending | Formulario Wix Forms "Newsletter" en footer (receta wix-manage `references/forms/create-form.md`) + confirmación |
| 16 | Site search | pending | Overlay de búsqueda de productos (`queryProducts` search) en nav, atclado a `/` |
| 17 | Workshops (Bookings) | pending | Pack bookings: app + servicios (Care 101, Repotting 101) + `/services` + nav link |
| 18 | Analytics + consent | pending | Wix Analytics, eventos de compra, banner de consent si aplica |
| 19 | i18n (español) | pending | Versión `/es/*` con el mismo design system |
| 20 | Performance audit | pending | Lighthouse, formatos de imagen, carga de fuentes, bundle |
| 21 | Build + release (sitio en vivo) | materialized | `step-21-build-and-release.md` |
| 22 | Historial de órdenes (miembros) | pending | Feature a futuro. No hay API member-scoped de órdenes de tienda en headless (solo Pricing Plans); requeriría `orders.searchOrders()` con auth elevada (`ECOM.READ_ORDERS`) — riesgo de seguridad, evaluar antes. |

---

**Uso:** cuando no exista el siguiente `step-N` en `.opencode/commands/`, ejecutar
`/generate-next-steps` — materializa los próximos items `pending` (default 3) con la
plantilla fija y actualiza este archivo.
