---
description: Step 47 — Smart Chat: widget flotante + vlist · Petals & Predators
---
# Step 47 — Smart Chat: widget flotante + vlist

> **Requisito:** step 46 verificado (gate real pasado el 2026-11-02). Si el gate
> no hubiera pasado, este archivo no existiría.

## Objetivo

Construir el widget flotante de chat que consume las rutas de step 46: launcher,
panel accesible, historial virtualizado con `vlist`, streaming NDJSON en vivo,
sugerencias, avatares, estado AI/humano/offline, formulario de contacto y CTA de
WhatsApp. Debe verse como parte de Petals & Predators, no como un iframe ajeno.

## Contexto del gate (obligatorio)

- El stream real devuelve la forma **REST**: `inputMessage` / `answerMessage`
  usan `id` y `createdDate`, no `_id` / `_createdDate`. `toChatMessage` ya acepta
  ambas.
- `inputMessage.sender` llega `UNKNOWN`; `toChatMessage` lo normaliza a `USER`
  para `QUESTION` / `USER_QUESTION` / `USER_ANSWER`.
- El historial depende de cookies del visitante. No abrir un contexto nuevo y
  esperar ver los mensajes de otra sesión.
- La persona aún no está configurada: `name`, `introduction`, `suggestions` y
  `legalDisclaimer` pueden venir `null`. La UI debe tener fallback de marca.
- `getWidgetSettings` ya resuelve `activeHandlers` por horario en el servidor
  (`resolveActiveHandlers`). El cliente solo consume `config.activeHandlers`.

## Archivos

| Archivo | Responsabilidad |
| :--- | :--- |
| `src/features/smart-chat/smart-chat.tsx` | Root React: config, launcher, open/close, auto-open, path/appearance, estado global |
| `src/features/smart-chat/chat-panel.tsx` | Panel: header, mensajes, composer, estados offline/error/contacto |
| `src/features/smart-chat/chat-messages.tsx` | `useVList` + template DOM seguro, reverse, estimatedHeight, load earlier |
| `src/features/smart-chat/chat-message-view.ts` | Constructor DOM de cada mensaje (texto seguro, markdown mínimo, product cards) |
| `src/features/smart-chat/chat-markdown.ts` | Partir texto en segmentos seguros (`**bold**`, links http/https); sin HTML |
| `src/features/smart-chat/chat-client.ts` | Fetch config/history/stream/contact, merge/dedupe, abort, cache |
| `src/features/smart-chat/chat-contact-form.tsx` | Formulario inline name/email/phone/message + estados |
| `src/app/layout.astro` | Montar `<SmartChat client:idle transition:persist="smart-chat" />` solo si `!noindex` |
| `src/translations.json` | Claves `smart-chat.*` en en/es/it |
| `tests/features/smart-chat/chat-markdown.test.ts` | Markdown seguro y links |
| `tests/features/smart-chat/chat-client.test.ts` | Merge/dedupe, streaming parser, errores |
| `tests/features/smart-chat/smart-chat.test.tsx` | Launcher fallback, abrir panel, sugerencias, envío mockeado |
| `tests/e2e/smart-chat.spec.ts` | Flujo real desktop + móvil y screenshots |

## UX y layout

### Launcher

- `<a href={localize('/contact')}>` como fallback sin JS. Si el chat está
  disponible, `onClick` abre el panel y no navega.
- Círculo de 56px, `bg-accent`, icono inline SVG (burbuja + destello), sin
  dependencia de iconos. `aria-label` desde `smart-chat.open`.
- Posición `fixed right-5 bottom-5` (móvil `right-4 bottom-4`), `z-60`.
- Hover: `scale-105`; active: `scale-98`; focus visible con anillo accent.
- Si `config.appearance` es `DESKTOP` ocultar bajo 768px; si `MOBILE` ocultar
  desde 768px. Usar `data-appearance` + media query, no JS resize.
- Ocultar mientras el consent banner esté visible:
  `body:has([data-pp-consent]:not([hidden])) .pp-chat-root { visibility: hidden; }`.
- No mostrar en `noindex`, ni fuera de `config.pages` cuando la lista no está
  vacía.

### Panel

- Móvil: hoja casi pantalla completa, `inset-3`, `rounded-2xl`, por encima del
  launcher. Desktop: `w-100` (400px), `max-h-170` (680px), `right-5 bottom-20`.
- `bg-paper-warm`, borde `border-rule`, `rounded-2xl`, sombra suave; sin
  gradientes de fondo.
- Header 64px: avatar 36px (`config.avatarUrl` o fallback de marca), nombre
  (`config.name` o “Petals & Predators”), estado AI/humano/offline, botón cerrar
  44x44.
- Mensajes: `vlist` ocupa el espacio flexible; composer fijo abajo.
- Composer: textarea autosize máximo 4 líneas, botón enviar 44x44, contador
  solo cerca del límite, `Enter` envía, `Shift+Enter` salto de línea.
- Footer legal: `config.legalDisclaimer` si existe; si no, texto corto
  `smart-chat.disclaimer`.
- Estados: cargando historial (skeleton de 3 burbujas), vacío (intro +
  sugerencias + CTA contacto), error (mensaje + reintentar), offline (intro +
  contacto + WhatsApp), streaming (burbuja en vivo con cursor), límite de
  cuota (`OUT_OF_QUOTA`).
- Escape cierra; foco vuelve al launcher. No es modal: no atrapar el foco, pero
  al abrir enfocar el composer.

### Mensajes

- Burbuja usuario: alineada a la derecha, `bg-ink text-paper`, radio 16px con
  esquina inferior derecha 4px.
- Burbuja asistente: izquierda, `bg-paper` con borde `rule`, avatar opcional
  solo en el primer mensaje consecutivo.
- Humano (`WIX_USER` / sender del owner): borde accent y etiqueta
  `smart-chat.human`.
- `SYSTEM` / `OFFLINE` / `OUT_OF_QUOTA`: tarjeta centrada, sin avatar.
- Product cards: leer `additionalData` con `type === 'products'`, `title`,
  `url`, `img`, `price`. Renderizar card horizontal con imagen 56px,
  `resolveWixImageUrl`, link localizado. Máximo 3 cards por mensaje.
- Markdown mínimo: `**bold**`, links `http(s)://`, saltos de línea. Construir
  nodos con `document.createTextNode` / `document.createElement`; nunca
  `innerHTML` con contenido del modelo.
- Timestamps solo en el grupo, formato `Intl.DateTimeFormat` con locale actual.

### Sugerencias

- Chips encima del composer cuando `config.suggestions.enabled` y hay 0
  mensajes; máximo 5.
- Click envía la pregunta como mensaje del visitante.
- `displayWhenMinimized`: si es true, mostrar 2 chips junto al launcher en
  desktop; en móvil no.

## vlist (v3)

La versión instalada es `vlist@3.3.1` y su API es `useVList`, no el componente
`<VList>` de versiones anteriores.

```tsx
const { containerRef, instanceRef } = useVList(
  {
    items,
    reverse: true,
    item: {
      estimatedHeight: 72,
      gap: 12,
      template: (item) => createMessageElement(item, locale),
    },
  },
  [],
);
```

- Guardar mensajes en orden cronológico ascendente y pasar `[...messages].reverse()`;
  con `reverse: true` el índice 0 queda abajo y `scrollToIndex(0)` lleva al
  último mensaje.
- Usar `estimatedHeight` (Mode B): vlist mide con `ResizeObserver` y ajusta el
  scroll sin saltos. No usar `autosize()` ni caché manual de alturas.
- La burbuja en vivo del stream **no** entra en vlist: se renderiza entre la
  lista y el composer. Al llegar `answerMessage`, medir/append y limpiar la
  burbuja viva.
- `range:change`: si `range.end >= total - 3` y hay `nextCursor`, cargar
  anteriores una sola vez; `prependItems` o actualizar `items` preservando
  `instanceRef.current.getScrollPosition()`.
- Deduplicar por `_id`; ordenar por `_createdDate` ascendente; ignorar IDs
  temporales `temp-*` al reconciliar.
- `template` devuelve `HTMLElement`: crear nodos seguros, no strings HTML.
- El contenedor debe tener altura definida (`min-h-0 flex-1`) y
  `overscroll-contain`.

## Cliente

`chat-client.ts` expone funciones nombradas, sin barrel:

```ts
fetchSmartChatConfig(): Promise<PublicSmartChatConfig>;
fetchSmartChatHistory(cursor?: string | null): Promise<SmartChatMessagesResponse>;
streamSmartChatMessage(text: string, handlers: {
  onChunk: (chunk: string) => void;
  onAnswer: (message: ChatMessage) => void;
  onInput: (message: ChatMessage) => void;
}, signal?: AbortSignal): Promise<void>;
submitSmartChatContact(input: SmartChatContactInput): Promise<void>;
mergeChatMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[];
```

- `fetch` con `credentials: 'same-origin'` y `cache: 'no-store'`.
- Config en `sessionStorage` con TTL 5 min; si falla, usar `enabled: false`.
- Stream: `response.body.getReader()`, `TextDecoder`, `NdjsonParser`.
  - `inputMessage` → reconciliar la burbuja optimista por texto/tiempo si no
    hay ID; si hay ID, reemplazar `temp-*`.
  - `answerChunk` → append al texto vivo.
  - `answerMessage` → `toChatMessage`, append, limpiar vivo.
  - Error HTTP: leer JSON `{ error }`; mostrar `smart-chat.error` y permitir
    reintentar el último texto.
  - Abortar con `AbortController` al cerrar el panel o navegar.
  - Un solo envío en vuelo; deshabilitar composer mientras streamea.
- Nunca loguear el texto del mensaje ni PII; solo errores con códigos.

## Estado y navegación

- `SmartChat` monta con `client:idle` y `transition:persist="smart-chat"` en
  `layout.astro`, después de `<ConsentBanner />`, solo si `!noindex`.
- Escuchar `astro:page-load` para reevaluar `config.pages` y cerrar el panel si
  la ruta nueva no admite chat. No recrear el estado al navegar dentro del mismo
  layout.
- Auto-open: solo si `config.autoOpen`, hay consentimiento guardado
  (`getConsentState()`), no se auto-abrió antes en la sesión
  (`sessionStorage 'pp_chat_auto_opened_v1'`) y no hay banner visible.
- Handoff humano: si `activeHandlers` incluye `WIX_USER`, poll
  `fetchSmartChatHistory()` cada 8s mientras el panel está abierto; merge por
  `_id`. Mostrar estado “Ana está aquí” y borde accent en sus mensajes.
- Si `activeHandlers` está vacío:
  - `offline.allowChat === true`: composer activo pero mostrar intro offline.
  - `offline.allowChat === false`: composer deshabilitado; mostrar contacto si
    `offline.showContactForm` y `config.contact.enabled`.
- Si `offline.hideWidget`, el servidor ya devuelve `enabled: false`; el root no
  renderiza nada.

## Contacto y WhatsApp

- Formulario inline (no modal) con campos según `config.contact.fields` y
  required flags. Submit a `POST /api/smart-chat/contact`; estados
  idle/submitting/success/error; `aria-live`.
- Mostrar el formulario:
  - en estado offline cuando `offline.showContactForm`;
  - al pulsar “Contact us” en el header/footer;
  - una sola vez por conversación si el usuario lo abre.
- WhatsApp: si `config.whatsapp`, link `https://wa.me/<digits>?text=<encoded>` con
  `target="_blank" rel="noopener noreferrer"`.
- No inyectar PII en el historial de AI.

## i18n

Agregar a `src/translations.json` (claves planas, `smart-chat.*`), en en/es/it:

`open`, `close`, `title`, `status-ai`, `status-human`, `status-offline`,
`placeholder`, `send`, `typing`, `empty`, `suggestions-label`, `load-earlier`,
`error`, `retry`, `disclaimer`, `contact-cta`, `contact-title`, `contact-name`,
`contact-email`, `contact-phone`, `contact-message`, `contact-submit`,
`contact-sending`, `contact-success`, `contact-error`, `whatsapp`, `human`,
`quota`, `offline-intro`.

No hardcodear copy visible; el fallback de marca sí puede ser
“Petals & Predators”.

## Analytics

- `trackEvent('CustomEvent', { category: 'SmartChat', action: 'Open' })`
- `... action: 'MessageSent'` (sin texto)
- `... action: 'ContactSubmit'`
- Respetar `trackEvent` (ya exige consentimiento). No enviar PII.

## Verificación

```bash
npm run check
npm test
npx astro build
npm run test:e2e
```

Con `npx astro dev`:

1. Desktop 1440x900 y móvil 390x844 / 360x640.
2. Launcher visible, no tapa el consent banner, abre panel, foco en composer.
3. Enviar “Which plant is easiest?” y ver texto streameado real; el historial
   persiste al cerrar/abrir en la misma sesión.
4. Sugerencias envían; “Load earlier” aparece solo si hay cursor.
5. Offline: simular `activeHandlers: []` (o cerrar horario) y verificar composer
   deshabilitado + contacto; enviar un contacto real controlado.
6. Navegar con `ClientRouter` a `/cart` (noindex): el widget desaparece; volver
   al home y reaparece.
7. Screenshots en `.tmp/smart-chat-desktop.png`, `.tmp/smart-chat-mobile.png`,
   `.tmp/smart-chat-offline.png`; pedir al usuario que los revise.

## Gotchas

- `vlist@3` no exporta `<VList>`: usar `useVList` + `containerRef`.
- `reverse: true` invierte el orden visual; confirmar con el ejemplo oficial de
  mensajería antes de fijar la lógica de “Load earlier”.
- `template` recibe el item y devuelve un `HTMLElement`; no React.
- `transition:persist` conserva el DOM, pero hay que reevaluar la ruta en
  `astro:page-load`.
- No usar `dangerouslySetInnerHTML` ni `innerHTML` con texto del modelo.
- El stream real tarda varios segundos: no mostrar error por timeout de UI;
  el timeout de 45s vive en el servidor.
- Los IDs del stream son REST (`id`); el historial SDK usa `_id`. El merge debe
  aceptar ambos.
- `config.name` puede ser `null`: fallback a marca.
- El panel no debe bloquear el scroll de la página en desktop; en móvil sí
  (`overscroll-contain`).
- No agregar `framer-motion`; usar CSS transitions con `--ease-fluid`.

## Al terminar

1. `## Resultado` con screenshots, comandos, resultado del stream, limitaciones.
2. Marcar step 47 `✅ done` en `ROADMAP.md`.
3. Crear/ejecutar `step-48-smart-chat-hardening.md`.