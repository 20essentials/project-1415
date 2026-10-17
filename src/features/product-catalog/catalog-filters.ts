// Products V3 no admite sort/filtros server-side por precio, nombre ni disponibilidad: se resuelven en SSR.
export type CatalogSort = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest';
export type CatalogAvailability = 'all' | 'in-stock';

export interface CatalogQuery {
  sort: CatalogSort;
  availability: CatalogAvailability;
}

export interface CatalogItem {
  _id?: string | null;
  name?: string | null;
  slug?: string | null;
  ribbon?: { name?: string | null } | null;
  inventory?: { availabilityStatus?: string | null } | null;
  variantSummary?: {
    minPriceVariant?: {
      price?: {
        priceAfterDiscount?: { amount?: string | null } | null;
        actualPrice?: { amount?: string | null } | null;
      } | null;
    } | null;
  } | null;
  actualPriceRange?: { minValue?: { amount?: string | null } | null } | null;
  _createdDate?: string | Date | null;
}

export const DEFAULT_CATALOG_QUERY: CatalogQuery = { sort: 'featured', availability: 'all' };

const SORTS: readonly CatalogSort[] = ['featured', 'price-asc', 'price-desc', 'name-asc', 'newest'];
const AVAILABILITIES: readonly CatalogAvailability[] = ['all', 'in-stock'];

export function parseCatalogQuery(searchParams: URLSearchParams): CatalogQuery {
  const sort = searchParams.get('sort');
  const availability = searchParams.get('availability');
  return {
    sort: (SORTS as readonly string[]).includes(sort ?? '')
      ? (sort as CatalogSort)
      : DEFAULT_CATALOG_QUERY.sort,
    availability: (AVAILABILITIES as readonly string[]).includes(availability ?? '')
      ? (availability as CatalogAvailability)
      : DEFAULT_CATALOG_QUERY.availability,
  };
}

export function buildCatalogHref(
  basePath: string,
  query: CatalogQuery,
  extras: { cursor?: string | null } = {},
): string {
  const params = new URLSearchParams();
  if (query.sort !== DEFAULT_CATALOG_QUERY.sort) params.set('sort', query.sort);
  if (query.availability !== DEFAULT_CATALOG_QUERY.availability) {
    params.set('availability', query.availability);
  }
  if (extras.cursor) params.set('cursor', extras.cursor);
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function isCatalogFiltered(query: CatalogQuery): boolean {
  return (
    query.sort !== DEFAULT_CATALOG_QUERY.sort ||
    query.availability !== DEFAULT_CATALOG_QUERY.availability
  );
}

function toPriceValue(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function minPrice(item: CatalogItem): number | null {
  const variantPrice = item.variantSummary?.minPriceVariant?.price;
  const direct = toPriceValue(variantPrice?.priceAfterDiscount?.amount ?? variantPrice?.actualPrice?.amount);
  if (direct !== null) return direct;
  return toPriceValue(item.actualPriceRange?.minValue?.amount);
}

function toTimestamp(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

function compareByName(a: CatalogItem, b: CatalogItem, locale?: string): number {
  return (a.name ?? '').localeCompare(b.name ?? '', locale, { sensitivity: 'base' });
}

function compareByPrice(a: CatalogItem, b: CatalogItem, direction: 'asc' | 'desc', locale?: string): number {
  const pa = minPrice(a);
  const pb = minPrice(b);
  if (pa === null && pb === null) return compareByName(a, b, locale);
  if (pa === null) return 1;
  if (pb === null) return -1;
  if (pa !== pb) return direction === 'asc' ? pa - pb : pb - pa;
  return compareByName(a, b, locale);
}

export function sortCatalogItems<T extends CatalogItem>(items: T[], sort: CatalogSort, locale?: string): T[] {
  const copy = items.slice();
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => compareByPrice(a, b, 'asc', locale));
    case 'price-desc':
      return copy.sort((a, b) => compareByPrice(a, b, 'desc', locale));
    case 'name-asc':
      return copy.sort((a, b) => compareByName(a, b, locale));
    case 'newest':
      return copy.sort((a, b) => {
        const ta = toTimestamp(a._createdDate);
        const tb = toTimestamp(b._createdDate);
        if (ta === null && tb === null) return 0;
        if (ta === null) return 1;
        if (tb === null) return -1;
        return tb - ta;
      });
    case 'featured':
    default:
      return copy;
  }
}

export function filterCatalogItems<T extends CatalogItem>(
  items: T[],
  availability: CatalogAvailability,
): T[] {
  if (availability !== 'in-stock') return items.slice();
  return items.filter((item) => item.inventory?.availabilityStatus !== 'OUT_OF_STOCK');
}
