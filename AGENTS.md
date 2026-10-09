- Nos inspiraremos en la web de: https://www.mintlify.com/
- Un punto de referencia es la documentation de Wix Managed Headless: https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration


## Typescript
- No debes usar any, a menos que no tengas de otra. Trata de crear los tipos usando las docs de Wix:  https://dev.wix.com/docs/api-reference y https://dev.wix.com/docs/sdk y

## Gestor de paquetes al crear el proyecto

- Crear el proyecto se puede con pnpm: `pnpm create @wix/new@latest headless --skip-install`
- Instalar dependencias requiere npm: `pnpm install` falla con la plantilla de `@wix/cli` (conflictos de peer-deps). Usar siempre: `npm install --legacy-peer-deps`

## Reglas de trabajo (lecciones aprendidas — no repetir)

Estas reglas existen porque ya cometí cada error. No son estilo, son calidad.

### Verificación honesta (nunca decir "verificado" sin verificar)

- Un build verde (`pnpm astro build`) **no** valida lint, clases canónicas de Tailwind, ni el HTML renderizado. Es solo compilación.
- "Verificar" exige ejecutar la comprobación concreta de lo que se afirma: si digo que no quedan clases no canónicas, tengo que correr el chequeo que las detecta (diagnósticos del language server de Tailwind) o revisar el CSS compilado, no mi memoria.
- Antes de reportar, declarar **qué** se verificó y **cómo** (comando + resultado). Si algo no se pudo verificar, decirlo explícitamente en vez de presentarlo como hecho.
- No afirmar hechos de los que no estoy seguro (p. ej. "esta clase no tiene equivalente canónico") sin comprobarlos. Un dato inventado presentado como certeza es peor que admitir la duda.

### Tailwind: usar siempre la sintaxis canónica

- Las clases con valores arbitrarios (`h-[2px]`, `gap-[5px]`, `z-[2]`, `opacity-[0.55]`, `aspect-[4/5]`, `max-w-[18rem]`, `duration-[600ms]`, `scale-[1.04]`) deben reescribirse a su forma canónica cuando exista (`h-0.5`, `gap-1.25`, `z-2`, `opacity-55`, `aspect-4/5`, `max-w-72`, `duration-600`, `scale-104`).
- La escala de spacing de Tailwind v4 es `--spacing: 0.25rem`: `N × 0.25rem`. Fracciones como `1.25` = 5px son válidas. **Por eso `gap-[5px]` sí es canónico (`gap-1.25`).** Verificar contra esa regla antes de descartar un reemplazo.
- El editor marca esto como `tailwindcss(suggestCanonicalClasses)`. Tratarlo como error, no como sugerencia opcional.
- Push de tokens del `@theme`: usar los utilitarios derivados (`bg-accent`, `text-paper`, `rounded-sm`) en vez de `bg-[var(--color-accent)]`, `text-[var(--color-paper)]`, `rounded-[var(--radius-sm)]`.
- En archivos CSS no-entry que usan `@apply`, incluir `@reference "./global.css"` para que los tokens y `@utility` sean visibles.

### Astro: preferir JSX declarativo sobre markup repetido

- El markup repetido se genera con un array en el **frontmatter** + `.map()` en el template, no copiando y pegando elementos.
- Por defecto, mantener los datos en el frontmatter del propio componente. **No** crear módulos externos (`src/utils/*.ts`) salvo que los datos se compartan realmente entre varios archivos; abstraer de más es sobre-ingeniería.
- Mantener los marcadores de plantilla (`<!-- nav:links -->`, `<!-- nav:actions -->`, `<!-- home:* -->`) aunque se refactorice: el pipeline de pasos los usa.

### Comentarios: solo si aportan (nada de relleno)

- Regla práctica: si el comentario se puede borrar sin perder información, se borra.
- Prohibido el comentario que repite lo que el código ya dice (`// setea el estado`, `// loop sobre items`) o que narra la acción del agente.
- Sin bloques-parrado ni cabeceras de scaffold/skeleton (`// ── Composer skeleton: …`). Un comentario = máximo una línea.
- Un comentario solo se justifica si explica un **por qué** no evidente: gotcha de API, workaround, decisión de diseño, id mágico. Nada más.
- Conservar únicamente los comentarios operativos que el tooling/pipeline necesita (marcadores `<!-- nav:links -->`, `<!-- nav:actions -->`, `<!-- home:* -->`).

### Diagnóstico de herramientas (no forzar soluciones)

- Si `Edit` falla con "Could not find oldString" en un bloque multilínea pero encuentra una sola línea, sospechar diferencias de fin de línea (CRLF vs LF). Diagnosticar la causa antes de recurrir a reescribir archivos enteros.
- Ante un error de herramienta, entender por qué falla; no aplicar el primer workaround que "funcione".

### Alcance (no asumir más de lo pedido)

- No ampliar el alcance por inferencia (p. ej. "todo src" → convertir hojas CSS enteras, borrar scaffold). Si el alcance es ambiguo o implica cambios destructivos, preguntar antes de ejecutar.
- Cambios que pueden romper el build o alterar el diseño (conversión masiva de CSS, borrado de archivos) se confirman primero.

## Instalación de comandos y skills (siempre local)

- Todo comando o skill se instala **solo** dentro de `.opencode/` de este proyecto. Nunca en rutas globales (`~/.config/opencode/`, `~/.claude/`, `~/.agents/`) ni en otros proyectos.
- Comandos → `.opencode/commands/<nombre>.md`. Skills → `.opencode/skills/<nombre>/SKILL.md` (la carpeta del skill debe llevar el mismo `name` que su frontmatter).
- Al instalar desde un repo externo: clonar en un temporal, copiar **solo** la carpeta del skill (no el repo entero) con `SKILL.md` + sus `references/`, y verificar que el frontmatter tenga `name` y `description`.
- Recordar al usuario reiniciar opencode después de instalar: la config y los skills se cargan al arrancar.

## Flujo de trabajo por comandos

- El sitio se construye por pasos: cada `.opencode/commands/step-N-*.md` es la **fuente de verdad** de qué hacer a continuación. Ejecutar en orden (`/step-0-scaffold-and-setup`, `/step-1-create-hero-section`, …).
- `ROADMAP.md` (raíz) lleva el estado del backlog: `pending` → `materialized` → `done`. Cada paso se marca `done` al terminar.
- Cuando no exista el siguiente `step-N`, ejecutar `/generate-next-steps`: materializa los próximos items `pending` del roadmap con la plantilla fija.
- **Marca:** Petals & Predators — e-commerce en inglés (plantas carnívoras + flores). Design system en `DESIGN.md` (frontmatter = tokens canónicos; body = captura de referencia).
- **Recetas Wix:** skill `wix-headless` (`C:\Users\amoil\.agents\skills\wix-headless`) y skill `wix-manage` (apps + seeding).