---
description: Genera los próximos comandos step-N desde ROADMAP.md
---
# generate-next-steps

Materializa los siguientes pasos del proyecto **Petals & Predators** a partir de
`ROADMAP.md`, usando la plantilla fija de abajo. No toca steps existentes.

## Entradas

- **Roadmap:** leer `ROADMAP.md` (columna Status: `pending` = candidatos).
- **Pasos existentes:** !`ls .opencode/commands`
- **Páginas actuales:** !`ls src/pages 2>/dev/null || echo "(ninguna)"`

**`$ARGUMENTS`** (opcional): número de pasos a generar (default **3**) o una palabra
clave que filtre los items del roadmap (p.ej. `/generate-next-steps journal`).

## Procedimiento

1. Leer `ROADMAP.md` → listar los items `pending` **en orden de fila**.
2. Calcular `N` = (mayor número de `step-N` existente) + 1.
3. Seleccionar K items: si `$ARGUMENTS` es un número → ese K; si es una palabra
   clave → los pending que coincidan (máx. K=3); si no → los primeros 3 pending.
   **Nunca saltarse items** (salvo filtro explícito por palabra clave).
4. Para cada item, crear `.opencode/commands/step-<N+i>-<slug>.md` con la
   **PLANTILLA** de abajo, expandiendo la descripción del roadmap en secciones
   concretas y ejecutables (nada de "mejorar X" vago — listar qué archivos,
   qué rutas, qué behavior).
5. Actualizar `ROADMAP.md`: cada item generado → Status `materialized` + nombre
   de su archivo en Notas.
6. Reapuntar la línea `> Siguiente:` del **último step existente** al primer
   archivo nuevo (edición puntual, solo esa línea).
7. Resumir: archivos creados + el comando a ejecutar a continuación.

## Reglas

- Nunca renumera ni sobrescribe un `step-N` existente.
- El sitio debe quedar compilando tras cada paso: toda verificación incluye
  `npx @wix/cli@latest build` en verde.
- Si un item del roadmap es ambiguo, amplía con sentido común dentro del tono de
  la marca; solo pregunta si hay un bloqueo real (p.ej. credito/API ausente).
- Mantener la convención exacta: frontmatter `description`, secciones, contexto
  de marca, y la línea final `> Siguiente:`.
- **Screaming Architecture (obligatoria):** todo código nuevo vive en
  `src/features/<capacidad>/` (con `index.ts` como API pública), `src/shared/`
  para infra cross-cutting o `src/app/` para el chrome. Prohibido crear archivos
  en `src/components/`, `src/utils/` o `src/data/` (deprecados). Al redactar un
  step, listar archivos dentro de `src/features/<feature>/`, no en carpetas por
  tecnología; y los tests en `tests/features/<feature>/`. Reglas completas en `AGENTS.md`.

---

## PLANTILLA (forma fija de cada step generado)

```markdown
---
description: Step <N> — <Título corto> · Petals & Predators
---
# Step <N> — <Título corto>

> **Siguiente:** `/step-<N+1>-<slug-del-siguiente>` (si aún no existe → `/generate-next-steps`)

## Objetivo

<1-2 líneas: qué queda entregado al terminar este paso.>

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/features/`, `src/shared/`,
  `src/app/`, `src/pages/`, `.opencode/commands/`, `ROADMAP.md`.

## Functionality

<lista numerada, concreta: archivos a crear/editar y behavior exacto>

## Pages / Sections

- `src/pages/<ruta>` — <qué renderiza>

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.

## Wix wiring

- Queries `@wix/<pack>` en runtime; `.wix/seeded.json` solo para slugs/IDs de
  apoyo (nunca importarlo en rutas `.astro`).

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] <checks funcionales específicos del paso>

## Al terminar

1. Marca el paso <N> como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-<N+1>-<slug>` (o `/generate-next-steps`).
```
