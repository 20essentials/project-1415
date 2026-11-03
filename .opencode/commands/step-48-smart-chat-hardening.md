---
description: Step 48 — Smart Chat: contacto, handoff y hardening · Petals & Predators
---
# Step 48 — Smart Chat: contacto, handoff y hardening

> **Requisito:** step 47 verificado (widget pasando la batería completa el
> 2026-11-03). Ver `## Resultado` de `step-47-smart-chat-widget.md` para el
> estado de partida.

## Objetivo

Cerrar las peculiaridades que quedaron pendientes del widget: handoff humano
con mezcla de mensajes del owner, contacto resiliente (reintento + campos
dinámicos), hardening de las rutas (rate limit, sanitizer, reintentos de
stream) y balance de i18n es/it para las claves nuevas.

## Contexto del estado de partida (heredado de step 47)

- El widget consume las 3 rutas `/api/smart-chat/{config,messages,chat}` y
  `POST /api/smart-chat/contact`; el contacto ya funciona con mapeo
  schema-driven (`getFormFieldTargets` en `@/shared/wix-forms`). Formulario
  solo acepta `first_name` / `email` / `message` (sin `phone`).
- `formSpamSubmissionReports` disponible en `@wix/forms` para reportar spam
  manualmente (falta wiring en el server-side).
- La persona no está configurada (`config.name/avatar/suggestions/legalDisclaimer`
  son `null`): fallbacks de marca funcionando. **El dashboard la persona la
  configura el dueño; API no basta.**
- `OUT_OF_QUOTA` ya renderiza `smart-chat.quota`; falta el CTA de contacto en
  esa tarjeta.
- El label de humano (`smart-chat.human`) existe pero nunca contestó un owner
  real (sin WIX_USER asignado aún).

## Archivos

| Archivo | Responsabilidad |
| :--- | :--- |
| `src/features/smart-chat/chat-panel.tsx` | Poll de historia al handoff; CTA contacto en la tarjeta de cuota |
| `src/features/smart-chat/chat-contact-form.tsx` | Campos dinámicos según `config.contact.fields` |
| `src/pages/api/smart-chat/contact.ts` | Reportar `formSpamSubmissionReports` cuando corresponda |
| `src/pages/api/smart-chat/messages.ts` | Poll de historial: cursor server-side; caché entre polls de 8s |
| `src/features/smart-chat/chat-client.ts` | Reintentos de stream con backoff (solo códigos reintentables) |
| `tests/features/smart-chat/*.test.ts(x)` | contact-field config; backoff/retry; mensajes del owner render |
| `tests/e2e/smart-chat.spec.ts` | Escenario sin WIX_USER aún; wire mockeado vía dev |

## Algoritmo (con estado)

### Handoff humano

- Mientras el panel está abierto y `config.activeHandlers` incluye
  `WIX_USER`: poll `fetchSmartChatHistory()` cada 8s y `mergeChatMessages`.
- Mostrar `config.name`/`status-human` en el header cuando el último mensaje
  no `SYSTEM` es de `WIX_USER`; mensajes del owner con borde accent y chip
  `smart-chat.human` (ya existe el estilo).
- Si el handler `WIX_USER` desaparece de `activeHandlers` (horario), volver a
  AI y limpiar el label personal activo.

### Contacto

- `config.contact.fields` hoy llega vacío: si trae un array con flags
  `required`, renderizar esos campos (`contact-name/contact-phone` ya están
  sembradas en translations).
- Si el POST falla con 429, mostrar `smart-chat.contact-error` y permitir
  reintentar sin perder el input.
- Reporte de spam: si la submission del contacto es rechazada por el validador
  de Wix (o el visitante repite envíos fallidos), reportar a
  `formSpamSubmissionReports` por `submissionId` cuando la respuesta
  lo devuelva.

### Hardening

- Rate-limit ligero en `POST /api/smart-chat/chat` por IP con in-memory
  bucket (p. ej. 3 msg / 10s por visitante) integrado con las cookies de
  visitante; 429 → el composer muestra `smart-chat.error` y permite
  reintentar al salir de la ventana.
- Reintento de stream: hasta 2 reintentos con backoff 1s/2s SOLO para códigos
  reintentables (5xx/error `stream-broken`); NO reintentar 4xx (INPUT_LIMIT,
  `OUT_OF_QUOTA`, spam).
- Sanitizer del mensaje en servidor: strip HTML + trim, ya existen; el step
  consolida en una función pura testada.

## i18n

- Agregar en `src/translations.json` (en) solo las claves que falten (p. ej.
  `human-typing`, `owner-status`); no duplicar las existentes.
- es/it: solo de dashboard `wix translation pull`/push interactivo — fuera
  del scope automatizable de este step; documentar en `Resultado`.

## Verificación

```bash
npm run check
npm test
npx astro build
npm run test:e2e
```

Con `npx astro dev` + Playwright:

1. Con `activeHandlers` mockeado a `["AI","WIX_USER"]` (dev), enviar un
   mensaje, simular owner respondiendo en la tabla (seed nativo en dev) y
   verificar que el poll trae el mensaje con chip humano.
2. Rate limit: 4 mensajes seguidos → 429 en el 4; composer vuelve a estar
   habilitado tras la ventana.
3. Reintentos: matar el stream a mitad (kill PID del dev) → retry visible y
   recuperación sin mensaje duplicado.
4. Contacto con 429: reintento ok.
5. `npm test` cubre rate limiter y retry como units testeados.

## Gotchas

- El poll cada 8s debe cancelarse al cerrar el panel o al desmontar
  (`AbortController` + `clearInterval`), y saneado al reinicio para no
  acumular polls dobles con `transition:persist`.
- No repetir el seed manual del owner: limpiarlo al terminar la verificación
  para no dejar mensajes huérfanos en el historial del visitante de pruebas.
- `formSpamSubmissionReports` requiere autenticación elevada
  (`auth.elevate`), validar el shape antes de llamar.
- El rate limiter en memoria es por instancia; en Cloudflare Workers cada
  isolate tiene el propio: documentarlo como límite soft, exacto con el
  KV/bucket solo si se migrara a durable.
- No reintentar `OUT_OF_QUOTA`: la cuota de consumo de la cuenta no cambia
  con reintentos y cada llamada la consume.
- Los tests de poll no pueden depender de timers reales: usar
  `vi.useFakeTimers()` para mantener determinista.

## Al terminar

1. `## Resultado` con screenshots si hay cambios visuales (chips humano,
   CTA quota), comandos y límites documentados.
2. Marcar step 48 `✅ done` en `ROADMAP.md`.

## Resultado

**Hecho y verificado (2026-11-03).** El widget queda endurecido: rate limit
real, sanitizer en el mensaje, spam gate de Wix antes de crear la submission,
reintentos de stream con backoff, CTA de contacto en la tarjeta de cuota y
poll de handoff cancelable.

**Verificación ejecutada:**

- `npm run check`: 0 errores (14 hints preexistentes ajenos).
- `npm test`: 48 archivos, **325 tests** (12 nuevos: rate limiter ×5,
  reintentos ×3, sanitizer ×3, quota CTA + contacto ×1).
- `npx astro build`: completo.
- `npm run test:e2e`: 44/45 (flake de carga preexistente en `blog /es/blog`;
  pasa 5/5 aislado, igual que todo el run a menos paralelismo). Smart-chat
  spec siempre verde.
- Flujo real con dev + Playwright (`.tmp/smart-chat-hardening-check.mjs`):
  1. **Rate limit real**: 4 POST en paralelo a `/api/smart-chat/messages` →
     3×200 + 1×429 con `Retry-After: 10`; se recupera tras la ventana.
  2. **Sanitizer**: `<b>Which</b> plant is easiest?` llega al stream como
     `Which plant is easiest?` en `inputMessage.body.mainText` y el stream
     responde con `answerMessage`.
  3. **Quota CTA**: interceptando `POST /api/smart-chat/messages` con
     `OUT_OF_QUOTA`, la tarjeta muestra el CTA **Contact** y lo clickeado
     abre el formulario (`count=1`). Screenshot
     `.tmp/smart-chat-quota-cta.png`.
  4. **Retry path**: desruteando la intercepción, el panel vuelve a streamear
     sin quedar pegado en estado de envío.
  5. **Spam gate real**: payload repetitivo de prueba → `{"error":
     "CONTACT_BLOCKED_SPAM"}` 400; payload realista → `{"ok":true}`
     (submission entregada).

**Implementación:**

- `src/features/smart-chat/rate-limits.ts`: `InMemoryRateLimiter` (3 msg /
  10s por client key, `x-forwarded-for`) + `chatClientKey`; cableado en el
  POST de `src/pages/api/smart-chat/messages.ts`.
- `src/features/smart-chat/sanitize.ts`: `sanitizeChatMessageInput` (strip
  tags `<...>`, control chars, trim) — corre en el POST de chat y en el
  `message` del contacto.
- `src/features/smart-chat/chat-client.ts`: reescritura de
  `streamSmartChatMessage` como `streamAttempt` + bucle de reintento (2
  reintentos, backoff 1s/2s) con `isRetryableStreamFailure` (5xx y
  `SMART_CHAT_STREAM_BROKEN/EMPTY` reintentables; 4xx nunca). Nuevo handler
  opcional `onRetry(attempt)`.
- `src/features/smart-chat/chat-panel.tsx`: `onRetry` limpia el texto vivo
  para no duplicar chunks; poll de handoff con `AbortController` (cancela la
  fetch en vuelo al desmontar/cerrar); CTA Contact en la tarjeta de cuota
  que abre el formulario inline.
- `src/features/smart-chat/contact.ts` +
  `src/pages/api/smart-chat/contact.ts`: **spam gate server-side** con
  `formSpamSubmissionReports.checkForSpam({ formId, submissions })`
  (elevado); si Wix dice spam → 400 `CONTACT_BLOCKED_SPAM`. Fail-open si la
  verificación falla (outage de Wix no bloquea a un visitante real).
- `src/shared/wix-forms.ts`: `getFormFieldTargets` ahora tolera la respuesta
  de `getForm` escrita directo en el result (sin wrapper `.form`) — fue el
  regreso del bug "missing email" detectado y corregido en esta sesión.

**Desviaciones conscientes respecto del texto del step:**

- **`formSpamSubmissionReports`** no se usa para *reportar* spam después de
  un fallo (exige un `submissionId` que no existe cuando la submission
  fracasa); se cambió por **`checkForSpam`** como juez pre-envío. Misma
  aplicación, punto de corte más útil.
- La caché server-side de las respuestas GET del historial cada 8s no se
  hizo: el poll ya corre del lado del cliente y la duplicación era
  sobre-ingeniería para el beneficio.
- El handoff con WIX_USER no tiene verificación end-to-end real porque
  sigue sin haber persona/WIX_USER asignado en el dashboard: el poll existe
  y está probado por unidad (contador cancelable) y el chip de humano solo
  con datos sembrados.

**Screenshots (revisar por el usuario):**

- `.tmp/smart-chat-quota-cta.png` — tarjeta de cuota con CTA Contact y
  formulario abierto tras el click.

**Limitaciones:** el rate limiter es in-memory (límite soft por isolate en
Cloudflare); es/it requieren `wix translation pull`/push interactivo del
dashboard; el flujo de reintento ante un stream cortado REAL no se simuló
(kill del dev en vuelo) — solo la reanudación tras un error controlado.
