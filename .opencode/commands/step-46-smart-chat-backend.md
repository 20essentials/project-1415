---
description: Step 46 — Smart Chat: gate de instalación + API backend · Petals & Predators
---
# Step 46 — Smart Chat: gate de instalación + API backend

> **Siguiente:** step-47-smart-chat-widget.md (se crea solo si este gate pasa)

## Objetivo

Instalar la app **Wix Smart Chat** en el sitio headless, verificar que sus APIs
responden con la identidad correcta y construir la capa server-side del chat:
settings públicos, historial paginado, stream NDJSON y contacto vía Wix Forms.
**No se toca UI en este paso.** Si el gate falla, se detiene y se reporta.

## Contexto

- **Riesgo principal:** la doc oficial dice que Wix AI Site-Chat “is currently
  available only in the Wix Editor”. El backend puede funcionar si la app se
  instala, pero no está garantizado. Decisión del propietario: si falla, pausar
  y avisar; no cambiar a otro backend de AI.
- **App:** “Wix Smart Chat” (reemplaza a “Wix AI Site-Chat” desde marzo 2026).
  `appDefId = 31ceda3c-e2c8-4e83-816d-ba293597730c`.
- **Site ID:** `c6608ff9-497b-4734-8fe9-74132892d04c`.
- **Identidades:**
  - `widgetSettingsV2.getWidgetSettings` / `updateWidgetSettings`: app identity
    (`auth.elevate`).
  - `conversations.getConversation` / `messages.listMessages`: site visitor o
    site member. Con app identity falla `400 "Invalid identity" code:"NoMetaSiteId"`.
  - `messages.createMessageStream`: visitor/member, vía contextual auth.
- **SDK:** `@wix/ai-site-chat@1.0.66` (solo namespaces). Auto SDKs:
  `_messages@1.0.50`, `_widget-settings-v-2@1.0.14`, `_conversations@1.0.22`,
  `_widget-settings@1.0.19`, `_assistant-training@1.0.17`.
- **UI virtual:** `vlist@3.3.1` se instala ahora para fijar versión, pero se usa
  en step-47.
- **Endpoints:** la doc de métodos usa `/wix-assistant-widget/...`; algunos
  ejemplos curl usan `/innovation/widget/...`. Implementar URL primaria +
  fallback ante 404/405, logueando una sola vez.

## Gate de instalación (bloqueante)

1. Instalar con Apps Installer API:
   `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install`
   ```json
   {
     "tenant": { "tenantType": "SITE", "id": "c6608ff9-497b-4734-8fe9-74132892d04c" },
     "appInstance": { "appDefId": "31ceda3c-e2c8-4e83-816d-ba293597730c" }
   }
   ```
   No chequear primero si ya está instalada: instalar y manejar el error.
2. Si la instalación falla o el error dice que la app no está disponible para
   este tipo de sitio: **detener**, documentar el error y no crear la UI.
3. Tras instalar, esperar propagación con backoff (1s, 2s, 4s) y verificar:
   - `getWidgetSettings` responde `widgetSettings`, `activeHandlers`,
     `nameHandlers`.
   - `listMessages` responde `messages` + `pagingMetadata`.
   - Un `createMessageStream` de prueba produce `inputMessage` y
     `answerMessage` (o `answerChunk`).
4. Guardar en `.wix/seeded.json`:
   ```json
   {
     "smart-chat": {
       "appDefId": "31ceda3c-e2c8-4e83-816d-ba293597730c",
       "appInstanceId": "<id>",
       "settingsVersion": "<revision o updatedDate>",
       "note": "Installed in step 46 via Apps Installer API. Never import this file from .astro routes."
     }
   }
   ```

## Dependencias

```bash
npm install @wix/ai-site-chat@1.0.66 vlist@3.3.1
```

`react` ya está en devDependencies (peer de vlist). No agregar `framer-motion`.

## Contratos de API

### `GET /api/smart-chat/config`

Devuelve solo datos públicos, sin IDs internos:

```ts
interface PublicSmartChatConfig {
  enabled: boolean;
  name: string | null;
  avatarUrl: string | null;
  introduction: string | null;
  legalDisclaimer: string | null;
  suggestions: { enabled: boolean; questions: string[] } | null;
  appearance: 'DESKTOP_AND_MOBILE' | 'DESKTOP' | 'MOBILE';
  autoOpen: boolean;
  pages: string[] | null;
  activeHandlers: ('AI' | 'WIX_USER')[];
  contact: {
    enabled: boolean;
    introMessage: string | null;
    successMessage: string | null;
  } | null;
  whatsapp: {
    phone: string;
    infoText: string | null;
    prefilledMessage: string | null;
  } | null;
  offline: {
    hideWidget: boolean;
    allowChat: boolean;
    showContactForm: boolean;
    introduction: string | null;
  };
}
```

- Cache server-side 5 min; respuesta `Cache-Control: private, max-age=60`.
- `name` = `nameHandlers` o fallback al brand del sitio.
- `avatarUrl` = `resolveWixImageUrl(aiBehavior.avatar)` o `defaultAvatar`.
- `activeHandlers` = `activeHandlers` resuelto por el servidor; si viene vacío,
  devolver `[]` y tratar como offline.
- Si settings lanza `NOT_FOUND`, devolver `enabled: false` y log limpio; no
  romper el layout.

### `GET /api/smart-chat/messages?cursor=<cursor>`

- Llama `messages.listMessages({ cursorPaging: { limit: 100, cursor } })`.
- Identidad visitor/member (SDK ambient o contextual auth). Nunca app identity.
- Devuelve:
  ```json
  { "messages": [], "nextCursor": null }
  ```
- `messageType` y `sender` se pasan tal cual; el cliente decide el render.
- `Cache-Control: no-store`.

### `POST /api/smart-chat/messages`

Body:
```json
{ "message": "texto del visitante" }
```

- Validar texto no vacío y máximo 4096 caracteres.
- Llamar `messages.createMessageStream` con:
  ```json
  {
    "message": {
      "messageType": "QUESTION",
      "body": { "mainText": "texto del visitante" }
    }
  }
  ```
- Pasar el body upstream tal cual (NDJSON), con:
  - `Accept: application/x-ndjson`
  - `Content-Type: application/json`
  - `Cache-Control: no-store`
  - `X-Accel-Buffering: no`
- Timeout 45s y abort al cerrar/navegar (`request.signal`).
- Si upstream responde error, devolver JSON `{ error }` con status mapeado.
- URL primaria + fallback `/innovation/widget/v1/messages/stream` en 404/405.
- No loguear el texto del mensaje.

### `POST /api/smart-chat/contact`

Body:
```json
{ "name": "", "email": "", "phone": "", "message": "" }
```

- Reutilizar `src/shared/wix-forms.ts` (`getFormIdByName`, `submitForm`,
  `CONTACT_FORM_NAME`).
- Validar email y message; máximo 4096.
- No inyectar PII en la conversación de AI.
- Devolver `{ ok: true }` o error de validación.

## Archivos

| Archivo | Responsabilidad |
| :--- | :--- |
| `src/features/smart-chat/chat.ts` | Tipos/DTOs públicos, mapeo de `Message` y settings |
| `src/features/smart-chat/chat-settings.ts` | `getWidgetSettings` elevado, cache 5 min, config pública |
| `src/features/smart-chat/availability.ts` | Recomputar `activeHandlers` por schedule/timezone (función pura) |
| `src/features/smart-chat/ndjson.ts` | Parser tolerante NDJSON/SSE (chunks, `data:`, `[DONE]`) |
| `src/features/smart-chat/stream.ts` | Fetch contextual, URL primaria/fallback, abort/timeout |
| `src/features/smart-chat/contact.ts` | Mapeo de campos y submission a Wix Forms |
| `src/pages/api/smart-chat/config.ts` | Config pública + cache headers |
| `src/pages/api/smart-chat/messages.ts` | `GET` historial / `POST` stream |
| `src/pages/api/smart-chat/contact.ts` | `POST` contacto |
| `tests/features/smart-chat/availability.test.ts` | Schedule y timezone |
| `tests/features/smart-chat/ndjson.test.ts` | Chunks partidos, múltiples frames, `[DONE]`, basura |
| `tests/features/smart-chat/chat-settings.test.ts` | Mapeo settings → config, fallbacks |
| `tests/features/smart-chat/stream.test.ts` | URL primaria/fallback, error mapping |

## Gotchas

- `widgetSettings` no tiene create: solo get/update/delete. Si la entidad no
  existe tras instalar, reintentar con backoff antes de asumir fallo.
- `getWidgetSettings` es app identity. `listMessages`/`getConversation` son
  visitor/member. Mezclar identidades produce `NoMetaSiteId`.
- `CreateMessageStreamResponse` en el SDK es union de objetos, no stream. Usar
  `fetch` crudo para el passthrough.
- `nameHandlers` puede ser `null`; `activeHandlers` puede venir vacío.
- `visitorOptionsFields` no tiene forma documentada: no renderizar todavía.
- `pagesWithChat` máximo 1000 páginas, 256 chars por path.
- `offlineBehavior` tiene combinaciones válidas: `hideWidget: true` oculta todo;
  `hideWidget: false, allowChat: false, showContactForm: true` = solo contacto;
  `allowChat: true` habilita composer.
- No usar `any`; si el SDK no expone un tipo, declarar interface local y validar.
- No agregar comentarios de relleno; solo gotchas reales.

## Verificación

```bash
npm run check
npm test
npx astro build
```

Con `npx astro dev` (o `wix dev`):

```bash
curl -s http://localhost:4321/api/smart-chat/config
curl -s "http://localhost:4321/api/smart-chat/messages"
curl -N -X POST http://localhost:4321/api/smart-chat/messages \
  -H "Content-Type: application/json" \
  -d '{"message":"Do you ship to Spain?"}'
```

- `/config` devuelve `name`, `introduction`, `activeHandlers` y `avatarUrl`.
- `/messages` devuelve historial y `nextCursor`.
- El POST devuelve frames NDJSON con `inputMessage` y `answerMessage`.
- El gate solo se considera pasado con settings + historial + un stream real.

## Al terminar

1. Escribir `## Resultado` con: app instance ID, settings snapshot, comandos
   ejecutados, resultado del stream y limitaciones encontradas.
2. Marcar step 46 como `✅ done` en `ROADMAP.md`.
3. Recién entonces crear/ejecutar `step-47-smart-chat-widget.md`.

## Resultado

**Gate: pasado.** La app se instaló y las tres APIs respondieron con la identidad
correcta en una sesión real de visitante (Playwright, Chromium).

- **Instalación:** `POST /apps-installer-service/v1/app-instance/install` OK.
  - `appInstanceId`: `0a4cbd2c-5061-4c1e-b7a3-40b981176381`
  - app de dependencia: `1a711f05-2040-47df-a9f0-4f9cddb4c3c6`
  - Guardado en `.wix/seeded.json` bajo `smart-chat`.
- **Settings** (`GET /wix-assistant-widget/v2/settings`, revisión `1`):
  - `activeHandlers: ["AI"]`, `activeHours.mode: ALWAYS_WITH_AI`,
    `timeZone: Europe/Rome`.
  - `autoOpen: false`, `appearance: DESKTOP_AND_MOBILE`, `pagesWithChat: []`.
  - `offlineBehavior`: `hideWidget: false`, `showContactForm: true`,
    `allowChat: false`.
  - `wixUserBehavior`: `neverShowContactForm: true`, `allowChat: true`.
  - `nameHandlers` no viene en la respuesta (o es `null`): el mapper usa
    `wixUserBehavior.name` y deja `name: null` si no hay persona configurada.
- **Archivos creados:** `chat.ts`, `chat-settings.ts`, `availability.ts`,
  `ndjson.ts`, `stream.ts`, `contact.ts`, las tres rutas
  `src/pages/api/smart-chat/*`, y tests `chat`, `chat-settings`, `availability`,
  `ndjson`, `stream`, `contact`.
- **Dependencias:** `@wix/ai-site-chat@1.0.66` y `vlist@3.3.1` en `package.json`.
- **Verificación ejecutada:**
  - `npm run check`: 0 errores.
  - `npm test`: 42 archivos, 300 tests, todos pasan.
  - `npx astro build`: completo.
  - Gate real con `npx astro dev` + Playwright:
    - `GET /api/smart-chat/config`: 200 con `activeHandlers: ["AI"]` y
      `contact.enabled: true`.
    - `GET /api/smart-chat/messages`: 200, `{ messages: [], nextCursor: null }`
      en una sesión nueva.
    - `POST /api/smart-chat/messages`: 200 NDJSON con `inputMessage`, 27
      `answerChunk` y `answerMessage`; respuesta de producto real
      (`Cape Sundew`, `Carnivorous Starter Kit`).
    - En la misma sesión, `GET /api/smart-chat/messages` devolvió 2 mensajes
      (`USER` + `ASSISTANT`) con IDs y sin cursor extra.

**Hallazgos que step-47 debe respetar:**

- El stream pasa por `fetch` crudo y usa la forma REST: `id` / `createdDate`,
  no `_id` / `_createdDate`. `toChatMessage` acepta ambas formas.
- `inputMessage.sender` llega como `UNKNOWN`; `toChatMessage` lo normaliza a
  `USER` para `QUESTION` / `USER_QUESTION` / `USER_ANSWER`.
- El historial depende de las cookies del visitante. Un contexto nuevo de
  Playwright devuelve historial vacío; hay que reutilizar la misma sesión.
- El fallback `/innovation/widget/v1/...` no se ejercitó en vivo porque la URL
  primaria respondió 200; está cubierto por test unitario.
- `/api/smart-chat/contact` reutiliza el formulario `Contact Form` existente; no
  se envió un contacto real para no generar PII de prueba.

**Limitaciones / pendientes:**

- La persona no está configurada: `name`, `introduction`, `suggestions` y
  `legalDisclaimer` vuelven `null`. La UI de step-47 debe tener fallback de
  marca y no asumir copy.
- `visitorOptionsFields`, tarjetas de producto y file upload quedan fuera de v1.
- `npm install` reportó warnings de engine (Node 22.14) y vulnerabilidades
  transitivas; no bloquearon build ni tests.
