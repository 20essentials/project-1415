---
description: Soluciona el error "Option 'baseUrl' is deprecated" de TypeScript 7 migrando los alias a paths relativos
---

Soluciona el error de TypeScript:

```
Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
```

Target: `$ARGUMENTS` (si no se pasa ruta, usa `tsconfig.json` en la raíz del proyecto, o todos los `tsconfig*.json` que contengan `baseUrl`, excluyendo `node_modules`).

## Pasos

1. Localiza el/los `tsconfig.json` afectados y lee su `compilerOptions`.
2. Elimina la clave `baseUrl` del objeto. NO añadas `ignoreDeprecations` (solo silencia el error; la opción dejará de funcionar en TS 7).
3. Reescribe cada entrada de `paths` para que sea una ruta **relativa al archivo tsconfig** y empiece por `./` o `../`:
   - `"src/*"` → `"./src/*"`
   - `"@/*": ["src/*", "src/utils/*"]` → `"@/*": ["./src/*", "./src/utils/*"]`
4. Si algún valor de `paths` ya usaba `"baseUrl": "src"` como ancla (p. ej. `"@/*": ["src/*"]` con `baseUrl: "src"`), recuerda que el valor heredaba el prefijo de `baseUrl`: réplica ese prefijo dentro de cada valor antes de quitar `baseUrl`.
5. Revisa si el proyecto usa otro resolvedor aparte de TypeScript (Vite, Jest, Vitest, Next, Metro, tsconfig-paths) y aplica la misma migración ahí:
   - `vite.config.*`: quita `resolve.alias` redundante para `@/*` si dependía solo de `tsconfig` (Vite lee `paths` del tsconfig en Astro 5), o cambia la clave a `fileURLToPath(new URL('./src', import.meta.url))`.
   - `astro.config.mjs`: comprueba `vite.resolve.alias` y `tsconfigPath` / alias manual.
   - Jest (`moduleNameMapper`) / Vitest (`resolve.alias`): apunta a `<rootDir>/src/$1`.
   - `jsconfig.json`: mismo criterio, aunque no tenga `baseUrl`.
6. Comprueba que no quede ninguna referencia: busca `baseUrl` en configs, scripts y documentación del proyecto.

## Reglas

- No añadas `ignoreDeprecations` salvo que el usuario lo pida explícitamente como solución temporal.
- No cambies los valores de alias (`@/*`, `~/*`, etc.) ni los nombres de carpetas.
- Preserva el resto del `compilerOptions` y el `extends` tal cual, y respeta la indentación y el estilo de comillas del archivo existente.
- Si tras quitar `baseUrl` un import deja de resolver, el error está en un valor de `paths` mal migrado: corrige la ruta, no readakedirs `baseUrl`.

## Verificación

- Ejecuta `pnpm build` (o `npm run build`) y confirma que termina sin errores.
- Si existe script de typecheck (`pnpm astro check`, `pnpm tsc --noEmit`, `pnpm typecheck`), ejecútalo y confirma que no aparecen errores de resolución de módulos.
- Si hay tests, ejecútalos para verificar que los alias siguen resolviendo en el runner.
- Reporta en una línea qué archivos cambiaste y el resultado del build/typecheck.
