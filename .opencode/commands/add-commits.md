---
description: Initialize project  git commits
---
project-{NUM} donde NUM es el nombre de la carpeta del actual proyecto por lo general el nombre de la carpeta siempre sera un numero por ejemplo 1411

Nota: git adco{number} son comandos que ya existen asi que solo ejecutalos, no los crees

CADA PASO DEBE EJECUTARSE DE UNO EN UNO, MANUALMENTE, SIN ALTERAR EL ORDEN Y SIN COMBINAR PASOS.
NO TOMAR ATAJOS — CADA `git adco{N}` CORRESPONDE A UN CAMBIO ESPECIFICO Y DEBE COMMITEARSE POR SEPARADO.

1. Obtén el nombre del proyecto del directorio actual
2. Si no existe `.git`, ejecuta `git init`
3. hero.astro → `git adco` (v0.0.1)
4. layout.astro: cambia `<title>Project</title>` a `<title>Project {NUM}</title>` → `git adco2`
5. styles.css → `git adco3`
6. astro.config.mjs: reemplaza ambos (repito AMBOS) `project-239` (esto:  ...
    : 'https://20essentials.github.io/project-239/',
  base: import.meta.env.DEV ? undefined : '/project-239/') por `project-{NUM}.` → `git adco4`
7. README.md: reemplaza solo el preview `project-{NUM}` → `git adco5`
8. README.md: reemplaza el link izquierdo con `project-{PREV}` → `git adco6`
9. README.md: reemplaza el link derecho con `project-{NEXT}` → `git adco7`
10. layout.astro: elimina `<style></style>` y el script comentado → `git adco8`
11. Si el .gitignore de la carpeta raiz no tiene .opencode/* agregalo  → `git adco9`
