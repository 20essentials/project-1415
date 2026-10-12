import type { APIRoute } from 'astro';
import { productsV3 } from '@wix/stores';
import { listStoreCategories } from '@/utils/categories';
import { queryGuides } from '@/utils/journal';
import { LOCALES, localeUrl } from '@/utils/i18n';

interface SitemapEntry {
  loc: string;
  priority: string;
  changefreq: string;
  localized?: boolean;
}

interface Alternate {
  locale: string;
  loc: string;
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
    { loc: '/', priority: '1.0', changefreq: 'weekly', localized: true },
    { loc: '/products', priority: '0.9', changefreq: 'weekly', localized: true },
    { loc: '/journal', priority: '0.6', changefreq: 'weekly', localized: true },
    { loc: '/about', priority: '0.5', changefreq: 'monthly', localized: true },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly', localized: true },
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

  try {
    const guides = await queryGuides();
    for (const guide of guides) {
      entries.push({ loc: `/journal/${guide.slug}`, priority: '0.6', changefreq: 'monthly' });
    }
  } catch (error) {
    console.error('[sitemap] guide lookup failed:', error);
  }

  const renderUrl = (loc: string, entry: SitemapEntry, alternates?: Alternate[]): string => {
    const parts = [`<loc>${escapeXml(new URL(loc, origin).href)}</loc>`];
    if (alternates) {
      for (const alternate of alternates) {
        parts.push(
          `<xhtml:link rel="alternate" hreflang="${alternate.locale}" href="${escapeXml(new URL(alternate.loc, origin).href)}"/>`,
        );
      }
      const xDefault = alternates.find((alternate) => alternate.locale === 'en') ?? alternates[0];
      parts.push(
        `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(new URL(xDefault.loc, origin).href)}"/>`,
      );
    }
    parts.push(`<changefreq>${entry.changefreq}</changefreq>`);
    parts.push(`<priority>${entry.priority}</priority>`);
    return `  <url>${parts.join('')}</url>`;
  };

  const lines: string[] = [];
  for (const entry of entries) {
    if (entry.localized) {
      const alternates = LOCALES.map((locale) => ({ locale, loc: localeUrl(entry.loc, locale) }));
      for (const alternate of alternates) {
        lines.push(renderUrl(alternate.loc, entry, alternates));
      }
    } else {
      lines.push(renderUrl(entry.loc, entry));
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...lines,
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
