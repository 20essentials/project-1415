---
description: Crea los commits pendientes con mensajes Conventional Commits bien escritos
---

Haz los commits pendientes del repo, agrupando el trabajo y escribiendo buenos mensajes. NO hagas push salvo que el usuario lo pida.

## Proceso (en orden)

1. `git status` + `git diff` (staged y unstaged) + `git log --oneline -10` para entender qué cambió y el estilo vigente.
2. Ignora archivos con contenido sensible (`.env`, keys, tokens). Si aparecen, ni los stagees: avisa de una vez.
3. Si hay trabajo ya staged, commítalo primero tal cual está.
4. Para lo demás: agrupa en **commits lógicos** por unidad de cambio (feature, bugfix, refactor…). Cada commit debe poder compilarse/funcionar por sí solo. Files sueltos que apuntan al mismo cambio van juntos; no hagas un commit gigante con todo.
5. Stagea los archivos de cada grupo y commitea uno por uno, sin atajos y sin mezclar pasos.

## Estilo de los mensajes (Conventional Commits)

Formato: `type(scope): descripción`

- `type` uno de: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `style`.
- `scope` (opcional) = el área tocada, kebab-case corto y en singular: `cart`, `events`, `donations`, `dining`, `blog`, `nav`, `analytics`. Sin scope si es global (`chore: update dependencies`).
- Descripción: **inglés**, lowercase, imperativo de positiva ("add", "avoid", "align", "fix"), sin punto final, ≤ 72 caracteres.
- Si el cambio toca varios scopes para una misma unidad (p. ej. feat + su test), un solo commit: `feat(cart): add quantity stepper to cart line items` — los tests van dentro del mismo commit, no separados.
- Preferir 1 commit cohesivo por unidad antes que 5 commits granulares del mismo cambio.

## Cuerpo del commit (opcional)

Solo cuando el commit no se explica en una línea: línea en blanco tras el subject, wrapped ~72 cols, explica el **por qué** (gotcha de API, decisión de diseño), no el qué. Nunca narres la acción ("esto cambia el archivo X").

## Reglas duras

- Nada de `git commit -i`, force-push, ni enmendar commits fallidos: si un hook rechaza, arregla y crea un commit nuevo.
- Antes de commitear revisa el diff efectivo que vas a stageear (`git diff --cached`): no commitees archivos ajenos al grupo ni touches accidentales (`package-lock.json` por `patch-package` solo entra si el grupo toca deps).
- NO commitear nunca: `.wix/`, `.tmp/`, `node_modules/`, nada en `.gitignore`.
- Al terminar, imprime la lista de hashes creados en una línea cada uno.
