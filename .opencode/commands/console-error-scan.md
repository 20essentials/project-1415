---
description: Scan de errores de consola (devtools) en todas las páginas del sitio con Playwright, y fix con programación defensiva
---
# console-error-scan

Replica el scan del 2026-10-29: visita **todas** las páginas del sitio `wix dev`,
abre DevTools "sintéticos" (console/`pageerror`/request failures con Playwright),
clasifica los errores y **corrige los reales** con programación defensiva. Regla
base que motiva este scan: un error que llega al cliente debe tener un
comportamiento por defecto (mensaje visible, retry, fallback), nunca quedar
explotando en la consola.

**`$ARGUMENTS`** (opcional): `--build` para correr contra `npx astro preview`
en vez de `wix dev`; path/ruta concreta para scannear solo esa página.

## Entradas

- **Rutas seed:** !`glob src/pages/**/*.astro` (construir la lista: rutas
  estáticas + `/fake-slug` por cada `[slug].astro` para chequear los 404)
- **Scripts del scan:** !`ls .tmp/console-scan.mjs .tmp/console-scan-report.json .tmp/console-scan-problems.json 2>/dev/null || echo "(no existen, se regeneran)"`

## Procedimiento

### 1. Levantar el servidor (si no corre)

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/ --max-time 5
# 000 → levantar en bg (log OBLIGATORIO a ./.tmp, nunca a /tmp):
(npm run dev > ./.tmp/dev-server.log 2>&1 &) && sleep 45
```

Nota: en `wix dev` Astro suele quedar IPv6-only (`[::1]:4321`); Node/Playwright
resuelven `localhost` sin problema.

### 2. Escribir y correr el scanner

Escribir el script en `.tmp/console-scan.mjs` (flujo: semillas de `src/pages` +
craw depth 1 siguiendo links `href` mismos-sitio para descubrir slugs reales;
máx. 60 páginas; captar en cada página: `console.error/warning`, `pageerror`,
`requestfailed`, `response.status >= 400` — ignorando ruido third-party
`wixstatic|parastorage|wix.com|wixapps.net|analytics`) y correr:

```bash
node .tmp/console-scan.mjs   # produce .tmp/console-scan-problems.json + report.json
```

Semillas mínimas: todas las rutas estáticas de `src/pages` `/es` `/it` +
`/<recurso>/fake-slug` por cada `[slug].astro`.

### 3. Clasificar (no todo lo que aparece es un bug)

| Señal | Interpretación |
|---|---|
| `404` correspondiente a la **propia navegación** en un `fake-slug` | ✅ correcto (404 esperado), no es error de la app |
| `404 edge.wixapis.com/...` o fallos del SDK Wix llamados **desde el browser** | 🐛 real: la llamada fallida queda en consola; mover server-side o no lanzar |
| `console.error/pageerror` de código propio (incl. `console.error` en catch client-side) | 🐛: el componente ya mostró su fallback → quitar el `console.error` client-side; server-side se conserva (observabilidad sin ruido) |
| `ERR_CONNECTION_REFUSED` aislado durante el burst paralelo del scan | ⚠️ transitorio: re-chequear la página sola (goto x3) antes de tratarlo como bug |

### 4. Fix con programación defensiva (patrones ya probados en este repo)

- **Módulo `auth.elevate` en un client island** (p. ej. `queryAvailableTickets`):
  los elevated solo corren server-side. Crear `src/pages/api/<recurso>-<dato>.ts`
  que llama al módulo y devuelve **200 siempre**: `{ data }` o `{ error: 'FAILED' }`
  (flag, no 500) para que el cliente pinte su estado de error/retry sin que el
  navegador loguee "Failed to load resource". Ref: `src/pages/api/event-tiers.ts`.
- **`currentCart.getCurrentCart()` → 404 sin carrito**: capturar el 404 server-side:
  `src/pages/api/cart-current.ts` devuelve 200 con `cart: null`; badge y
  CartView hacen `fetch` del route y tratan `null`/falla como carrito vacío/count 0.
- **Fallback en UI**: cada estado de error debe tener su render por defecto
  (`role="alert"` + retry, `role="status"`, mensaje `labels.*`), no solo el catch.
- Tests afectados: pasar de `vi.mock('@wix/...')` a `vi.stubGlobal('fetch', …)`.

### 5. Verificación (obligatoria, declarar resultados concretos)

```bash
node .tmp/console-scan.mjs                  # 2ª pasada → 0 problemas salvo 404s esperados
npx vitest run tests/features/<feature>     # tests unitarios de lo tocado
npm run check                               # astro check → 0 errores
npm run test:e2e                            # suite completa si el fix toca flujos
```

Flujo crítico de carrito (badge persiste, server-side comparte identidad del
visitante): agregar item en un PDP → badge `1` → reload `/` → badge sigue `1` →
consola limpia.

## Reglas

- Todo output temporal en `./.tmp/` (gitignore), nunca en `/tmp`.
- No assumir que un build verde basta: solo cuenta lo que el primer scan
  declaró y la segunda pasada confirma.
- Si un "error" es configuración del sitio (SEO, contenido del dashboard Wix),
  no es de este repo: reportar en el resumen, no "arreglarlo" en código.
- Los 404 de slugs inexistentes son correctos; no crear rutas para que no den 404.
