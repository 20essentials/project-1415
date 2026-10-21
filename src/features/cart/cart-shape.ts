// El carrito llega en dos versiones según el endpoint que lo devuelve:
//   - v1 (`currentCart`): `id` en cart y line item, `productName` traducible,
//     `price` plano (MultiCurrencyPrice) y totales en `subtotal` /
//     `subtotalAfterDiscounts` / `discount`.
//   - v2 (`currentCartV2`, respuestas de cupón): `_id`, `name` traducible,
//     `pricing.totalPrice` y `subtotal` (ConvertedMoney).
// Los normalizadores de este módulo folding de ambos a una sola forma para que
// la vista no tenga que conocer la versión del payload.

export interface MoneyLike {
  amount?: number | string | null;
  convertedAmount?: number | string | null;
  formattedAmount?: string | null;
  formattedConvertedAmount?: string | null;
}

export interface CartLineItem {
  id: string;
  title: string | null;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  formattedUnitPrice: string | null;
  formattedLineTotal: string | null;
  image: string | { id?: string; url?: string } | null;
}

export interface CartCoupon {
  id: string | null;
  code: string | null;
}

export interface CartTotals {
  currency: string | null;
  subtotal: number;
  discount: number;
  total: number;
  formattedSubtotal: string | null;
  formattedDiscount: string | null;
  formattedTotal: string | null;
}

export interface NormalizedCart {
  lineItems: CartLineItem[];
  coupons: CartCoupon[];
  totals: CartTotals;
}

type Record_ = Record<string, unknown>;

function asRecord(value: unknown): Record_ | null {
  return typeof value === "object" && value !== null ? (value as Record_) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readTranslatable(value: unknown): string | null {
  if (typeof value === "string") return readString(value);
  const rec = asRecord(value);
  if (!rec) return null;
  return readString(rec.translated) ?? readString(rec.original) ?? readString(rec.name);
}

function readMoney(value: unknown): MoneyLike | null {
  const rec = asRecord(value);
  return rec ? (rec as MoneyLike) : null;
}

function moneyAmount(value: unknown): number | null {
  const rec = asRecord(value);
  if (!rec) return null;
  return readNumber(rec.amount) ?? readNumber(rec.convertedAmount);
}

function moneyFormatted(value: unknown): string | null {
  const rec = asRecord(value);
  if (!rec) return null;
  return readString(rec.formattedAmount) ?? readString(rec.formattedConvertedAmount);
}

export function normalizeLineItem(raw: unknown): CartLineItem | null {
  const rec = asRecord(raw);
  if (!rec) return null;

  // v1 expone `id`; v2 expone `_id`.
  const id = readString(rec.id) ?? readString(rec._id);
  if (!id) return null;

  const quantity = readNumber(rec.quantity) ?? 1;

  // v1: `price` (unitario) + `lineItemPrice` (total de la línea).
  // v2: `pricing.unitPrice` + `pricing.totalPrice`.
  const v1Price = readMoney(rec.price);
  const v1LineTotal = readMoney(rec.lineItemPrice);
  const pricing = asRecord(rec.pricing);
  const v2Unit = pricing ? readMoney(pricing.unitPrice) : null;
  const v2Total = pricing ? readMoney(pricing.totalPrice) : null;

  const unitPrice = moneyAmount(v1Price) ?? moneyAmount(v2Unit) ?? 0;
  const lineTotal =
    moneyAmount(v1LineTotal) ??
    moneyAmount(v2Total) ??
    unitPrice * quantity;

  return {
    id,
    title: readTranslatable(rec.productName) ?? readTranslatable(rec.name),
    description: readString(rec.description),
    quantity,
    unitPrice,
    lineTotal,
    formattedUnitPrice: moneyFormatted(v1Price) ?? moneyFormatted(v2Unit),
    formattedLineTotal: moneyFormatted(v1LineTotal) ?? moneyFormatted(v2Total),
    image: (rec.image as string | { id?: string; url?: string } | null) ?? null,
  };
}

export function normalizeCoupons(raw: unknown): CartCoupon[] {
  const rec = asRecord(raw);
  if (!rec) return [];

  // v2: `coupons[]` con `_id` + `code`.
  // v1: `appliedDiscounts[].coupon` con `_id` + `code`.
  const direct = Array.isArray(rec.coupons) ? rec.coupons : [];
  const applied = Array.isArray(rec.appliedDiscounts) ? rec.appliedDiscounts : [];

  const fromDirect = direct
    .map((entry) => {
      const coupon = asRecord(entry);
      if (!coupon) return null;
      return {
        id: readString(coupon._id) ?? readString(coupon.id),
        code: readString(coupon.code),
      } satisfies CartCoupon;
    })
    .filter((coupon): coupon is CartCoupon => coupon !== null);

  if (fromDirect.length > 0) return fromDirect;

  return applied
    .map((entry) => {
      const discount = asRecord(entry);
      const coupon = discount ? asRecord(discount.coupon) : null;
      if (!coupon) return null;
      return {
        id: readString(coupon._id) ?? readString(coupon.id),
        code: readString(coupon.code),
      } satisfies CartCoupon;
    })
    .filter((coupon): coupon is CartCoupon => coupon !== null);
}

export function normalizeTotals(raw: unknown): CartTotals {
  const rec = asRecord(raw) ?? {};

  const currency =
    readString(rec.currency) ??
    readString(rec.paymentCurrency) ??
    readString(rec.conversionCurrency) ??
    readString(asRecord(rec.businessInfo)?.currencyCode) ??
    readString(asRecord(rec.paymentInfo)?.currencyCode);

  // v1: `subtotal` / `subtotalAfterDiscounts` / `discount` (MultiCurrencyPrice).
  // v2: `subtotal` (ConvertedMoney) y sin discount explícito.
  const v1Subtotal = readMoney(rec.subtotal);
  const v1AfterDiscounts = readMoney(rec.subtotalAfterDiscounts);
  const v1Discount = readMoney(rec.discount);

  const subtotal = moneyAmount(v1Subtotal) ?? 0;
  const discount = moneyAmount(v1Discount) ?? 0;
  const total = moneyAmount(v1AfterDiscounts) ?? Math.max(0, subtotal - discount);

  return {
    currency,
    subtotal,
    discount,
    total,
    formattedSubtotal: moneyFormatted(v1Subtotal),
    formattedDiscount: moneyFormatted(v1Discount),
    formattedTotal: moneyFormatted(v1AfterDiscounts),
  };
}

export function normalizeCart(raw: unknown): NormalizedCart {
  const rec = asRecord(raw) ?? {};
  const lineItems = Array.isArray(rec.lineItems) ? rec.lineItems : [];

  return {
    lineItems: lineItems
      .map(normalizeLineItem)
      .filter((item): item is CartLineItem => item !== null),
    coupons: normalizeCoupons(rec),
    totals: normalizeTotals(rec),
  };
}
