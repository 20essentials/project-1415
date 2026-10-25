import { i18n } from '@wix/essentials';
import { getRelativeLocaleUrl } from 'wix:astro:i18n';
import type { TFunction } from 'i18next';

export const LOCALES = ['en', 'es', 'it'] as const;
export type Locale = (typeof LOCALES)[number];
export const PRIMARY_LOCALE: Locale = 'en';

export function useTranslation(): { t: TFunction } {
  return { t: i18n.getTranslationFunction() };
}

export function currentLanguage(): string {
  return i18n.getLanguage();
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
