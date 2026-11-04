import { i18n } from '@wix/essentials';
import { getRelativeLocaleUrl } from 'wix:astro:i18n';
import type { TFunction } from 'i18next';

export const LOCALES = ['en', 'es', 'it'] as const;
export type Locale = (typeof LOCALES)[number];
export const PRIMARY_LOCALE: Locale = 'en';

export function useTranslation(): { t: TFunction } {
  const base = i18n.getTranslationFunction();
  // In the browser, persisted islands (transition:persist) outlive client-side
  // locale switches, and the host language they hydrated with does not update.
  // Re-anchor the live translation to the wixLanguage cookie on every call;
  // i18next resolves that language from the resources bundled for the page.
  if (typeof document === 'undefined') return { t: base };
  const language = readSiteLanguage();
  const t = ((key: string, options?: Record<string, unknown>) =>
    base(key, { ...options, lng: language })) as unknown as TFunction;
  return { t };
}

export function currentLanguage(): string {
  if (typeof document === 'undefined') return i18n.getLanguage();
  return readSiteLanguage();
}

export function localize(path: string): string {
  return getRelativeLocaleUrl(path);
}

export function stripLocalePrefix(pathname: string): string {
  const [, first, ...rest] = pathname.split('/');
  if (!first || !(LOCALES as readonly string[]).includes(first)) return pathname;
  const remainder = rest.join('/');
  return remainder ? `/${remainder}` : '/';
}

export function localeUrl(pathname: string, locale: string): string {
  const clean = stripLocalePrefix(pathname);
  if (locale === PRIMARY_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

// Wix sets the `wixLanguage` cookie for the visitor's current locale (see the
// Astro localization middleware); guests routed to Wix-hosted pages must render
// in the same language.
export function readSiteLanguage(): string {
  if (typeof document === 'undefined') return PRIMARY_LOCALE;
  const match = /(?:^|;\s*)wixLanguage=([a-z]{2,3})/i.exec(document.cookie);
  return match?.[1] ?? PRIMARY_LOCALE;
}
