---
description: Convierte un proyecto vanilla (HTML/CSS/JS) a Astro 2026 con todo el código dentro de hero.astro
---

Convierte el proyecto vanilla que está en la carpeta `$ARGUMENTS` (si no se pasa ruta, busca dentro de `js-to-astro/` y `preview/` por un `index.html`, `style.css` y `script.js`) a un componente Astro moderno. Sigue fielmente el contrato visual y de comportamiento del código original.

## Estructura de salida

- Todo el código queda dentro de `src/components/hero.astro`:
  - el marcado HTML tal cual (elementos con los mismos id/class que el original),
  - los estilos en `<style is:global>` (los originales aplican a `body`/`html`, por eso `is:global`),
  - el JS completo dentro de un `<script>` con los imports al inicio.
- Si `src/pages/index.astro` no renderiza `<Hero />`, ajústalo (y elimina componentes inexistentes que rompan el build).

## Instalación

- Usa siempre `pnpm`. Instala las dependencias que hagan falta:
  ```
  pnpm add three simplex-noise
  ```
  (y cualquier otra que el `script.js` original use vía CDN, como `three@r185` para contrapartes modernas de libs viejas).

## Reglas de código (no negociables)

- **Nada de `var`**: solo `const` / `let`.
- **Imports dentro del `<script>`** y **siempre destructurados**: `import { Scene, Group, MeshBasicMaterial, ... } from 'three'`. NUNCA `import * as THREE from 'three'`.
- **Sin comentarios** en el código generado.
- **Sin código muerto**: elimina variables y cálculos que no se usen. En bucles de render, calcula solo lo que alimenta el frame (p. ej. no dejes `overallAvg`/`lowerAvg`/`upperMaxFr` si no se consumen).
- **Fuentes de Google**: no `<link>` en el marcado; usa `@import url('https://fonts.googleapis.com/...');` como PRIMERA regla del `<style is:global>`.
- **Assets de `/assets/*`**: usa el helper del proyecto `baseUrl('/assets/archivo')` de `@/utils/functions` (o `import.meta.env.BASE_URL + 'assets/...'` si el util no existe), nunca una ruta hardcodeada (respeta el `base` de `astro.config.mjs`).

## Modernizar el JS (vanilla → Astro 2026)

El stack suele ser Three.js antiguo (r8x, CDN) + CDN de más libs. Migra conservando el comportamiento:

- **Three.js r84 → r185**:
  - `mesh.geometry.vertices` (Geometry vieja) ya NO existe: usa `const positions = mesh.geometry.attributes.position` con `positions.getX/Y/Z(i)`, `positions.setX/Y/Z(i, v)` y `positions.needsUpdate = true` (reemplaza a `verticesNeedUpdate`/`normalsNeedUpdate`).
  - `computeVertexNormals()` sigue existiendo; `computeFaceNormals()` no — suprímelo.
  - Cambios de material: `THREE.MeshLambertMaterial` → `MeshLambertMaterial`; para wireframe que salga BIEN BRILLANTE usa `MeshBasicMaterial` (`color`, `wireframe: true`), porque tres moderno aplica espacio de color sRGB y oscurece la iluminación. Si conservas luces, pon `spotLight.decay = 0` para recuperar el comportamiento legacy de brillo; con `MeshBasicMaterial` las luces sobran (elimínalas).
  - `color`, `side` (`DoubleSide`), `PlaneGeometry`, `IcosahedronGeometry`, clases de luz siguen con la misma API (importadas como nombres).
- **simplex-noise**: v2 (`new SimplexNoise()` global) → v4: `import { createNoise2D, createNoise3D } from 'simplex-noise'` y usa `noise2D(...)` / `noise3D(...)` en lugar de `noise.noise2D(...)`.
- **Audio**: `AudioContext` nativo; soporta `window.AudioContext ?? (window as any).webkitAudioContext`.
  - Autoplay silencioso: `<audio id="audio" controls muted>` y `.play()` en montaje. OJO: si el elemento va con `muted`, el `AnalyserNode` recibe silencio; para que el gráfico reaccione, analiza una copia decodificada del mismo archivo: `fetch(url) → context.decodeAudioData(buffer) → createBufferSource() → analyser → createGain()` con `gain.gain.value = 0` → `destination`; `source.start()`.
  - Resume el contexto en la primera interacción (`document.addEventListener('pointerdown', () => context.resume(), { once: true })`).
- **Canción/audio por defecto**: si la petición lo pide, precarga la pista desde `public/assets/` con `baseUrl()` y que el gráfico se muestre desde el primer frame esperando el gesto del usuario.
- **Nombres y parámetros**: conserva los nombres de funciones del original (`vizInit`, `play`, `render`, `makeRoughBall`, `makeRoughGround`, helpers `modulate`/`fractionate`/`avg`/`max`) y los parámetros de geometría idénticos al original (segmentos de `PlaneGeometry`, detalle de `IcosahedronGeometry`, posiciones, colores) salvo que el usuario pida explícitamente cambiarlos.

## Verificación

- Corre `pnpm build` y asegúrate de que termina sin errores (revisa también que `index.html` generado contenga el `<script>` con el bundle y `music.mp3`/assets copiados en `dist/`).
- Si hay `pnpm astro check` disponible (requiere `@astrojs/check`), úsalo; si no está instalado, no lo instales automáticamente.
- Reporta en una línea qué dependencias añadiste, qué API modernizaste (con referencias `file:línea`) y el resultado del build.