---
description: Step 18 — Newsletter signup · Petals & Predators
---
# Step 18 — Newsletter signup

> **Siguiente:** `/step-19-site-search`

## Objetivo

Añadir formulario de newsletter usando Wix Forms (crear formulario "Newsletter" si no existe, o reutilizarlo) en el footer, con validación accesible, estados (success/error) y confirmación clara. Quedará funcional y compilando.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` + `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` · upstream `C:\Users\amoil\.agents\skills\wix-manage` (referencia: `references/forms/create-form.md`).
- **Estado (inspeccionar antes de empezar):** `src/components/footer.astro`, `src/utils/forms.ts` (o `src/utils/wix-forms.ts`), `src/i18n/translations.json`, `.wix/seeded.json` (para ver forms existentes), `ROADMAP.md`.

## Functionality

1. **Asegurar formulario Wix Forms "Newsletter"**
   - Revisar `.wix/seeded.json` y estado: si no existe, crear formulario "Newsletter" con campo email (obligatorio) siguiendo receta `wix-manage/references/forms/create-form.md`. Guardar formId/slug si necesario.
2. **Crear util para envío a Wix Forms**
   - Crear/editar `src/utils/wix-forms.ts` (o añadir en `src/utils/forms.ts`) con función para enviar submission a endpoint correspondiente de Wix Forms (usar `@wix/forms` o endpoint REST según receta). No importar `.wix/seeded.json` en cliente.
3. **Integrar en footer**
   - Editar `src/components/footer.astro`: añadir bloque newsletter con input email + botón submit, labels accesibles (`for`/`aria-*`), mensajes de error/success. Respetar layout footer existente.
4. **Manejar estados cliente-side**
   - Añadir pequeño script inline o módulo TS ligero para validación (email válido) y envío sin recarga, con `fetch` al endpoint Astro/API interno si aplica, o directo a Wix Forms según patrón del proyecto. Mantener accesible (`aria-live`).
5. **Traducciones**
   - Añadir claves `footer.newsletter.*`, `forms.email.*`, `forms.success.*`, `forms.error.*` en `src/translations.json` (en/es/it) si faltan.

## Pages / Sections

- `src/components/footer.astro` — Bloque newsletter integrado coherente con resto del footer.
- `src/utils/wix-forms.ts` — Helper para envío de formularios Wix Forms.

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`, superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280; `prefers-reduced-motion` respetado.
- Inputs accesibles: focus visible, contraste adecuado.

## Wix wiring

- Usar Wix Forms: crear formulario "Newsletter" vía receta `wix-manage` (si no existe) y enviar submissions con `@wix/forms` o endpoint REST autorizado. No exponer secretos.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] Footer muestra bloque newsletter con campo email + botón
- [ ] Validación funciona (email vacío/inválido)
- [ ] Envío exitoso muestra mensaje de confirmación accesible
- [ ] Envío con error muestra mensaje de error accesible
- [ ] No hay regresiones en footer/layout

## Al terminar

1. Marca el paso 18 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-19-site-search` (o `/generate-next-steps`).
