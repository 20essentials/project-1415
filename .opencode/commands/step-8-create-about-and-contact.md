---
description: Step 8 — About + Contact (Wix Forms) · Petals & Predators
---
# Step 8 — About + Contact (Wix Forms)

> **Siguiente:** `/step-9-seo-and-accessibility`

## Objetivo

Páginas `/about` y `/contact` (activando los dos últimos links del nav), con
formulario de contacto real en Wix Forms y las secciones ancla que promete el footer.

## Contexto

- **Marca:** Petals & Predators — sitio en inglés.
- **Guía forms:** `C:\Users\amoil\.agents\skills\wix-headless\references\forms\INSTRUCTIONS.md`
  (scopes seed/components/pages; page wiring en `references\astro\forms\CONTACT_FORM.md`)
  · **Receta de form:** `C:\Users\amoil\.agents\skills\wix-manage\references\forms\create-form.md`.
- **App Wix Forms** ya se instaló en step-0 — no la reinstales.
- **Comandos:** !`ls .opencode/commands` · **Páginas hoy:** !`ls src/pages 2>/dev/null`

## Functionality

### `/about`

1. Hero corto (headline Fraunces + lede) sobre la marca: greenhouse boutique,
   especialidad en plantas carnívoras + flores con carácter, envío vivo y garantía.
2. Bloque "Our story" (2-3 párrafos, inglés, tono cálido y honesto).
3. Bloque "How we grow" — 3 value cards (hand-pollinated / peat-based mixes /
   shipped in ventilated boxes).
4. Imagen editorial (generada con `generate-images.mjs` si hay créditos; si no,
   bloque tokenizado `paper-warm` + ❀ — no dejes hueco).
5. CTA → `/products`.

### `/contact`

1. **Seed del form** (receta wix-manage `create-form.md`, una llamada):
   `purpose: "contact"` → nombre **"Contact Form"**, campos
   First name (`CONTACTS_FIRST_NAME`), Email (`CONTACTS_EMAIL`),
   Message (`CONTACTS_MESSAGE` o textarea equivalente). El `formId` resultante se
   **agrega** al `.wix/seeded.json` existente bajo `forms: { formIds: [...] }`
   (no reescribas el resto del archivo).
2. **Página** siguiendo `forms/INSTRUCTIONS.md` + `CONTACT_FORM.md` § Page wiring:
   island ContactForm con submission → CRM (Wix Forms), estados success/error,
   validación accesible (`aria-invalid`, errores junto al campo).
3. **Panel de contacto:** email `hello@petalsandpredators.com`, horario de
   greenhouse, link a Instagram.
4. **Anclas que promete el footer** (step-2): secciones con `id="shipping"`
   (Shipping & Returns: envío en 48h, guarantee de llegada viva, returns 30 días)
   y `id="care"` (Plant Care 101: luz, agua, sustrato — 3-4 tips).

## Design

- Forms: inputs `bg paper-warm` `border rule` `radius 4px`, labels Inter 14px/500,
  focus ring `accent`, error `error` token. Botón submit `bg accent text paper`.
- About: prosa en `container prose`, headings Fraunces, value cards `radius 6px`.
- Responsive: 2 columnas (form + info) → stack <768px.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Nav About/Contact resuelven; footer `#shipping` y `#care` llegan a su ancla
- [ ] Submit del form crea una submission visible en el dashboard de Wix Forms
- [ ] `.wix/seeded.json` conserva `stores` y ahora incluye `forms`

## Al terminar

1. Marca el paso 8 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-9-seo-and-accessibility`
