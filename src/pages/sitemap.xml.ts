import type { APIRoute } from 'astro';
import { productsV3 } from '@wix/stores';
import { listStoreCategories } from '@/utils/categories';

interface SitemapEntry {
  loc: string;
  priority: string;
  changefreq: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const entries: SitemapEntry[] = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/products', priority: '0.9', changefreq: 'weekly' },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  ];

  try {
    const categories = await listStoreCategories();
    for (const category of categories) {
      entries.push({ loc: `/category/${category.slug}`, priority: '0.8', changefreq: 'weekly' });
    }
  } catch (error) {
    console.error('[sitemap] category lookup failed:', error);
  }

  try {
    const result = await productsV3.queryProducts({ fields: ['CURRENCY'] }).limit(100).find();
    for (const product of result.items ?? []) {
      if (!product.slug || product.ribbon?.name === 'Gift Card') continue;
      entries.push({ loc: `/products/${product.slug}`, priority: '0.7', changefreq: 'weekly' });
    }
  } catch (error) {
    console.error('[sitemap] product lookup failed:', error);
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(
      (entry) =>
        `  <url><loc>${escapeXml(new URL(entry.loc, origin).href)}</loc>` +
        `<changefreq>${entry.changefreq}</changefreq>` +
        `<priority>${entry.priority}</priority></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
