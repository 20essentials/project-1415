---
description: Step 38 — Loyalty: puntos y recompensas · Petals & Predators
---
# Step 38 — Loyalty: puntos y recompensas

> **Siguiente:** `/step-39-dominio-propio-y-wix-pages-domain` (si aún no existe → `/generate-next-steps`)

## Objetivo

Los miembros ven su balance de puntos, su tier y el catálogo de recompensas en `/rewards`; pueden canjear puntos por una recompensa y recibir un cupón real aplicable en el carrito. Los anónimos ven el estado vacío con CTA a login y el programa se activa por API sin depender de automatizaciones del dashboard.

## Contexto

- **Marca:** Petals & Predators — e-commerce en inglés de plantas carnívoras + flores.
- **Design system:** `DESIGN.md` (frontmatter = tokens) + `.wix/design-tokens.css` +
  `src/styles/global.css`.
- **Recetas Wix:** SKILL_ROOT = `C:\Users\amoil\.agents\skills\wix-headless` ·
  upstream `C:\Users\amoil\.agents\skills\wix-manage`.
- **Estado (inspeccionar antes de empezar):** `src/pages/account.astro` (links de
  `/account/*`), `src/pages/account/orders.astro` (patrón 302 a login con `returnToUrl`),
  `src/pages/api/wishlist.ts` (patrón de auth + errores), `src/features/cart/cart-shape.ts` y
  `src/features/cart/cart-view.tsx` (cupones `addCouponToCurrentCart`),
  `.wix/seeded.json` (bloque `ecom`), `ROADMAP.md` (step 26: cupones en carrito).
- **Prerrequisitos de negocio:** app **Wix Loyalty Program** instalada y programa activado.
  Resolver el `appDefId` en la tabla oficial *Apps Created by Wix* (nunca adivinarlo); si falta,
  buscarlo con Market Listings. La activación de reglas/automatizaciones de "earned" no está
  cubierta por la API → si hace falta, documentar el paso manual en dashboard y continuar con
  el resto.
- **API (confirmar antes de codificar):** `@wix/loyalty` — métodos reales para leer el programa,
  el balance del miembro, listar recompensas y canjear. Leer el schema con `SearchWixAPISpec`;
  **no** asumir nombres, ni que el canje devuelva un cupón utilizable por `@wix/ecom`.

## Functionality

1. **Instalar la app (sin chequear antes si ya está)**
   - `POST https://www.wixapis.com/apps-installer-service/v1/app-instance/install` con
     `{ tenant: { tenantType: 'SITE', id: SITE_ID }, appInstance: { appDefId } }`; reintentar con
     backoff tras la instalación.
   - Activar el programa por API (nombre del programa y nombre de los puntos, p. ej.
     "Predator Points"); si la activación exige dashboard, documentarlo.
   - Añadir el SDK (`@wix/loyalty` o el nombre real publicado) a deps.
   - Registrar en `.wix/seeded.json` bajo `loyalty` (appDefId, programa, IDs de recompensas).
2. **Recompensas por API**
   - Crear 2–3 recompensas canjeables (p. ej. 100 pts → cupón 10%, 250 pts → envío gratis o
     `$15 off`), cada una ligada a un cupón de Wix (crear el cupón con `@wix/ecom`/Coupons API si
     el canje no lo genera solo).
   - Idempotente por nombre. Documentar IDs y códigos en `.wix/seeded.json` (nunca importados en
     `.astro`).
3. **`src/features/rewards/loyalty.ts` (nuevo)**
   - `getLoyaltyOverview(memberId)` → `{ program: { name, pointsName } | null, balance: number,
     tier: string | null, rewards: Reward[] }`. `Reward` = `{ id, name, description, pointsCost,
     available, couponCode: string | null }`. Todo con `auth.elevate` server-side y `try/catch`:
     fallo → `{ program: null, balance: 0, tier: null, rewards: [] }`.
   - `redeemMemberReward(memberId, rewardId)` → `{ balance, couponCode }`; valida balance
     suficiente y recompensa existente **antes** de llamar a la API; errores tipados
     (`NOT_ENOUGH_POINTS`, `REWARD_NOT_FOUND`, `NOT_AUTHENTICATED`, `FAILED`) en
     `RewardError`. El `memberId` sale siempre de `members.getCurrentMember`, nunca del cliente.
4. **`src/pages/api/rewards/redeem.ts`**
   - `POST { rewardId }`: JSON defensivo, 401 sin miembro, 400 por input inválido, 404
     `REWARD_NOT_FOUND`, 409 `NOT_ENOUGH_POINTS`, 500 `FAILED`; éxito → `200 { balance,
     couponCode }`. Sin PII en la respuesta.
5. **`src/features/rewards/reward-list.tsx` (isla `client:idle`)**
   - Tarjetas de recompensa con coste en puntos, botón "Redeem" deshabilitado si
     `balance < pointsCost` (`aria-disabled` + razón), estados idle/submitting (`aria-busy`)/
     success (`role="status"` + código de cupón copiable)/error (`role="alert"`) y retry.
   - Tras canjear, actualizar balance en pantalla; si hay `couponCode`, mostrar CTA a `/cart` y
     documentar que el cupón se puede introducir a mano (no auto-aplicar sin consentimiento del
     usuario).
6. **`src/pages/rewards.astro`**
   - Member-only: sin miembro → `Astro.redirect(localize('/api/auth/login?returnToUrl=…'))`
     con `returnToUrl` localizado (patrón de `/account/orders`).
   - Con miembro: hero con balance + tier, grid de recompensas, estado vacío si no hay catálogo
     y explicación breve de cómo se ganan puntos (texto, sin promesas de reglas no configuradas).
   - `noindex`.
7. **`src/pages/account.astro`**
   - Link "Rewards" junto a Wishlist/Orders y, si es barato, el balance como dato secundario
     (reutilizando `getLoyaltyOverview`).
8. **Carrito / checkout**
   - El canje entrega un cupón; el carrito ya aplica cupones (step 26). Añadir en el estado
     success de `reward-list.tsx` un enlace a `/cart` y, si el usuario lo pide explícitamente,
     `addCouponToCurrentCart(couponCode)` desde la isla del carrito (sin auto-aplicar al cargar).
   - Documentar en el reporte que el descuento de lealtad se materializa vía cupón (no hay
     mutación directa del total por API de Loyalty).
9. **i18n** — namespace `rewards.*` + `account.rewards` en `en`/`es`/`it` (paridad exacta de
   conteo).
10. **Tests**
    - `tests/features/rewards/loyalty.test.ts`: overview con/sin programa, balance insuficiente
      → `NOT_ENOUGH_POINTS` sin llamar a canje, recompensa inexistente, excepción → `FAILED`,
      `memberId` vacío → `NOT_AUTHENTICATED`.
    - E2E: `/rewards` anónimo → 302 con `returnToUrl` localizado; con miembro sembrado → 200
      con balance y recompensas (si no hay miembro disponible, marcar como no verificado).

## Pages / Sections

- `src/pages/rewards.astro` — balance, tier, recompensas y estado vacío.
- `src/pages/account.astro` — acceso a Rewards.
- `src/pages/api/rewards/redeem.ts` — canje scoped al miembro.
- Sin cambios de ruta en `/cart` (el consumo es por cupón existente).

## Design

- Tokens (`var(--color-*)` / Tailwind @theme): fondo `paper`, texto `ink`,
  superficie `paper-warm`, bordes `rule`, énfasis `accent`. Radii 4/6/12px.
- Transiciones 0.2s `cubic-bezier(.4,0,.2,1)`; responsive 375/768/1024/1280;
  `prefers-reduced-motion` respetado.
- Balance con `font-display` grande; recompensas en cards `border-rule` + `bg-paper-warm/40`;
  botón deshabilitado con `opacity-55` (no ocultar el coste).

## Wix wiring

- `@wix/loyalty` (SDK oficial) para programa/balance/recompensas y canje; `@wix/ecom` para
  leer/aplicar el cupón resultante.
- Todas las lecturas/escrituras de lealtad server-side con `auth.elevate`; el cliente solo manda
  `rewardId` y recibe balance/código.
- `.wix/seeded.json` solo para IDs de programa/recompensas/cupones de apoyo.

## Verificación

- [ ] `npx @wix/cli@latest build` en verde
- [ ] `npm run check` sin errores nuevos · `npm test` en verde
- [ ] `/rewards` anónimo → 302 a login con `returnToUrl` localizado (`/es/rewards`, `/it/rewards`)
- [ ] Con miembro: 200, balance y recompensas renderizados; sin catálogo → estado vacío
- [ ] `POST /api/rewards/redeem` sin sesión → 401; `rewardId` inválido → 400; sin puntos → 409
- [ ] Canje con puntos suficientes → 200 con `couponCode`; el código se aplica en `/cart` y
      descuenta (verificar con cupón de prueba y limpiar el carrito)
- [ ] `/account` muestra el link a Rewards
- [ ] Paridad de claves i18n en/es/it
- [ ] Reporte explícito de lo no verificable (reglas de "earned" en dashboard, miembro real)

## Al terminar

1. Marca el paso 38 como `✅ done` en `ROADMAP.md`.
2. Siguiente: `/step-39-dominio-propio-y-wix-pages-domain` (o `/generate-next-steps`).
