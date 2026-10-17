import { describe, expect, it } from 'vitest';
import {
  buildCatalogHref,
  DEFAULT_CATALOG_QUERY,
  filterCatalogItems,
  isCatalogFiltered,
  minPrice,
  parseCatalogQuery,
  sortCatalogItems,
  type CatalogItem,
} from '@/features/product-catalog/catalog-filters';

function item(overrides: Partial<CatalogItem> & Pick<CatalogItem, 'name'>): CatalogItem {
  return overrides;
}

function variantPrice(amount: string): CatalogItem {
  return {
    variantSummary: { minPriceVariant: { price: { actualPrice: { amount } } } },
  };
}

describe('parseCatalogQuery', () => {
  it('returns the defaults when no params are present', () => {
    expect(parseCatalogQuery(new URLSearchParams())).toEqual(DEFAULT_CATALOG_QUERY);
  });

  it('keeps valid sort and availability values', () => {
    expect(parseCatalogQuery(new URLSearchParams('sort=price-asc&availability=in-stock'))).toEqual({
      sort: 'price-asc',
      availability: 'in-stock',
    });
  });

  it('falls back to defaults for unknown values', () => {
    expect(parseCatalogQuery(new URLSearchParams('sort=__x&availability=nope'))).toEqual(
      DEFAULT_CATALOG_QUERY,
    );
  });
});

describe('buildCatalogHref', () => {
  it('omits default params entirely', () => {
    expect(buildCatalogHref('/products', DEFAULT_CATALOG_QUERY)).toBe('/products');
  });

  it('serializes only non-default params', () => {
    expect(buildCatalogHref('/products', { sort: 'price-asc', availability: 'in-stock' })).toBe(
      '/products?sort=price-asc&availability=in-stock',
    );
    expect(buildCatalogHref('/products', { sort: 'featured', availability: 'in-stock' })).toBe(
      '/products?availability=in-stock',
    );
  });

  it('propagates the cursor and never duplicates the question mark', () => {
    expect(buildCatalogHref('/products', { sort: 'name-asc', availability: 'all' }, { cursor: 'abc' })).toBe(
      '/products?sort=name-asc&cursor=abc',
    );
    expect(buildCatalogHref('/products', DEFAULT_CATALOG_QUERY, { cursor: 'abc' })).toBe(
      '/products?cursor=abc',
    );
  });
});

describe('isCatalogFiltered', () => {
  it('is false for the default query and true otherwise', () => {
    expect(isCatalogFiltered(DEFAULT_CATALOG_QUERY)).toBe(false);
    expect(isCatalogFiltered({ sort: 'newest', availability: 'all' })).toBe(true);
    expect(isCatalogFiltered({ sort: 'featured', availability: 'in-stock' })).toBe(true);
  });
});

describe('minPrice', () => {
  it('prefers the discounted variant price, then the actual price', () => {
    expect(
      minPrice({
        variantSummary: {
          minPriceVariant: {
            price: { priceAfterDiscount: { amount: '18.00' }, actualPrice: { amount: '24.00' } },
          },
        },
      }),
    ).toBe(18);
    expect(minPrice(variantPrice('24.00'))).toBe(24);
  });

  it('falls back to the actual price range', () => {
    expect(minPrice({ actualPriceRange: { minValue: { amount: '32.50' } } })).toBe(32.5);
  });

  it('returns null when no price is available', () => {
    expect(minPrice({})).toBeNull();
    expect(minPrice({ variantSummary: { minPriceVariant: { price: {} } } })).toBeNull();
  });
});

describe('sortCatalogItems', () => {
  const products: CatalogItem[] = [
    item({ name: 'Cape Sundew', actualPriceRange: { minValue: { amount: '18' } } }),
    item({ name: 'Akai Ryu', ...variantPrice('24') }),
    item({ name: 'No price' }),
    item({ name: 'Moonlight Orchid', actualPriceRange: { minValue: { amount: '32' } } }),
  ];

  it('sorts ascending by price with priceless items last', () => {
    const sorted = sortCatalogItems(products, 'price-asc');
    expect(sorted.map((p) => p.name)).toEqual(['Cape Sundew', 'Akai Ryu', 'Moonlight Orchid', 'No price']);
  });

  it('sorts descending by price with priceless items still last', () => {
    const sorted = sortCatalogItems(products, 'price-desc');
    expect(sorted.map((p) => p.name)).toEqual(['Moonlight Orchid', 'Akai Ryu', 'Cape Sundew', 'No price']);
  });

  it('sorts alphabetically by name', () => {
    const sorted = sortCatalogItems(products, 'name-asc');
    expect(sorted.map((p) => p.name)).toEqual(['Akai Ryu', 'Cape Sundew', 'Moonlight Orchid', 'No price']);
  });

  it('sorts newest first and keeps invalid or missing dates last', () => {
    const dated: CatalogItem[] = [
      item({ name: 'Old', _createdDate: '2026-01-01T00:00:00.000Z' }),
      item({ name: 'New', _createdDate: '2026-03-01T00:00:00.000Z' }),
      item({ name: 'Broken', _createdDate: 'not-a-date' }),
      item({ name: 'Undated' }),
    ];
    const sorted = sortCatalogItems(dated, 'newest');
    expect(sorted.slice(0, 2).map((p) => p.name)).toEqual(['New', 'Old']);
    expect(sorted.slice(2).map((p) => p.name).sort()).toEqual(['Broken', 'Undated']);
  });

  it('keeps the incoming order for featured and never mutates the input', () => {
    const original = products.map((p) => p.name);
    const sorted = sortCatalogItems(products, 'featured');
    expect(sorted.map((p) => p.name)).toEqual(original);
    sortCatalogItems(products, 'price-asc');
    expect(products.map((p) => p.name)).toEqual(original);
  });
});

describe('filterCatalogItems', () => {
  const products: CatalogItem[] = [
    item({ name: 'In stock', inventory: { availabilityStatus: 'IN_STOCK' } }),
    item({ name: 'Out of stock', inventory: { availabilityStatus: 'OUT_OF_STOCK' } }),
    item({ name: 'No inventory data' }),
  ];

  it('excludes only OUT_OF_STOCK when filtering in-stock', () => {
    expect(filterCatalogItems(products, 'in-stock').map((p) => p.name)).toEqual([
      'In stock',
      'No inventory data',
    ]);
  });

  it('keeps everything for the all availability', () => {
    expect(filterCatalogItems(products, 'all')).toHaveLength(3);
  });
});
