---
description: Renombra todos los archivos y carpetas de src/ (o la ruta indicada) a kebab-case y actualiza todas las referencias
agent: build
---

# Kebab-case files

Renombra TODOS los archivos (y carpetas) de `src/` a
kebab-case y deja el proyecto compilando.

## Alcance

- Ruta objetivo: la que pase el usuario en `$ARGUMENTS`
  (p. ej. `src/utils`); si no, `src/` completa.
- Recorre recursivamente archivos y carpetas de todo tipo
  (`.astro`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.svg`,
  etc.), incluidos los que ya parecen kebab-case: tambien se
  normalizan mayusculas (ej. `Guias-75-percent.astro` ->
  `guias-75-percent.astro`).

## Regla de nombre (semantica de lodash.kebabcase)

1. Divide por limites de camelCase (`FooBar` -> `Foo Bar`).
2. Divide por el limite digito/letra (`Foo2` -> `Foo-2`).
3. Reemplaza `_`, espacios y guiones multiples por `-`.
4. Convierte todo a minusculas.
5. Quita guiones duplicados y guiones al inicio/final.

Ejemplos:
- `MyComponent.astro` -> `my-component.astro`
- `helperFunc.ts` -> `helper-func.ts`
- `guias-75-percent.astro` -> `guias-75-percent.astro`

## Excepciones (nombre fijo obligatorio)

NO renombres estos archivos: el codigo del proyecto debe vivir
en ellos por contrato (ver AGENTS.md):
- `src/components/Main.astro`
- `src/components/app.tsx` (si existe)

Si el usuario lo pide explicitamente, renombralos, pero advierte
que AGENTS.md queda inconsistente y actualiza AGENTS.md tambien.

## Pasos

1. Lista el arbol completo antes de tocar nada:
   `find src -type f` y `find src -type d` (o el alcance
   indicado). Lee los archivos antes de renombrarlos.
2. Calcula el nombre kebab-case de cada archivo/carpeta;
   si ya coincide, sigue de largo.
3. Renombra con `git mv` para conservar historial:
   - En filesystems case-insensitive (Windows/macOS), un cambio
     SOLO de mayusculas requiere dos pasos:
     `git mv Viejo tmp` y `git mv tmp viejo`.
   - Si no hay repo git, o `git mv` falla, usa `mv`.
   - Renombra primero las carpetas mas profundas y luego las
     que quedan encima (hijos antes que padres).
4. Actualiza TODAS las referencias en TODO el repo (no solo en
   `src/`): imports relativos, alias `@/...`, `import()`s y
   cualquier string que apunte a una ruta. Revisa tambien
   `astro.config.mjs` y `tsconfig.json` (alias). Vuelve a leer
   cada archivo antes de editarlo (AGENTS.md: nunca escribas a
   ciegas sobre nombres antiguos).
5. Verifica que no quede ningun nombre con CamelCase, `_` o
   espacios dentro del alcance (glob + grep) y reporta.
6. Corre `npm run build` y confirma que termina en
   `[build] Complete!`. Si falla, corrige las referencias
   rotas y repite.
7. Reporta la lista de renombrados (antes -> despues) y los
   archivos editados.

## Prohibido

- No cambies contenido, logica, assets, nombres de variables,
  clases CSS ni textos.
- No borres archivos: solo renombrar.
- No toques `node_modules/`, `.git/`, `dist/`, `preview/` ni
  `public/`.
- No uses `switch`, no `transition: all`, no `rgba` en CSS.
- No dejes comentarios nuevos dentro de `<script>` de Astro.