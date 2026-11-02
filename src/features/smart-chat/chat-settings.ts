import { widgetSettingsV2 } from '@wix/ai-site-chat';
import type { GetWidgetSettingsResponse } from '@wix/auto_sdk_ai-site-chat_widget-settings-v-2';
import { auth } from '@wix/essentials';
import { resolveWixImageUrl } from '@/shared/wix-image';
import { resolveActiveHandlers, type ActiveHoursInput } from './availability';
import {
  isPublicChatHandler,
  type ChatAppearance,
  type PublicChatContact,
  type PublicSmartChatConfig,
} from './chat';

const CACHE_TTL_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_TTL_MS = 60 * 1000;
const AVATAR_SIZE = 128;

type WidgetSettingsResult = GetWidgetSettingsResponse;
type WidgetSettings = NonNullable<WidgetSettingsResult['widgetSettings']>;
type SettingsMessage = { enabled?: boolean | null; text?: string | null } | null | undefined;

interface CacheEntry {
  value: PublicSmartChatConfig;
  expiresAt: number;
}

let cache: CacheEntry | null = null;

function disabledConfig(): PublicSmartChatConfig {
  return {
    enabled: false,
    name: null,
    avatarUrl: null,
    introduction: null,
    introductions: { ai: null, wixUser: null, offline: null },
    legalDisclaimer: null,
    engage: null,
    suggestions: null,
    appearance: 'DESKTOP_AND_MOBILE',
    autoOpen: false,
    pages: null,
    activeHandlers: [],
    contact: null,
    whatsapp: null,
    offline: {
      hideWidget: true,
      allowChat: false,
      showContactForm: false,
      introduction: null,
    },
    wixUser: null,
  };
}

function messageText(message: SettingsMessage): string | null {
  return message?.enabled && message.text ? message.text : null;
}

function normaliseAppearance(value: string | null | undefined): ChatAppearance {
  if (value === 'DESKTOP' || value === 'MOBILE') return value;
  return 'DESKTOP_AND_MOBILE';
}

function contactConfig(settings: WidgetSettings): PublicChatContact | null {
  const contactForm = settings.commonBehavior?.contactForm;
  if (!contactForm) return null;

  const fields = contactForm.fields;

  return {
    enabled: true,
    introMessage: contactForm.introMessage ?? null,
    successMessage: contactForm.successMessage ?? null,
    fields: {
      name: fields?.includeName ?? true,
      email: fields?.includeEmail ?? true,
      phone: fields?.includePhone ?? true,
      message: fields?.includeMessage ?? true,
      requiredName: fields?.requiredName ?? false,
      requiredEmail: fields?.requiredEmail ?? true,
      requiredPhone: fields?.requiredPhone ?? false,
      requiredMessage: fields?.requiredMessage ?? false,
    },
  };
}

export function mapChatSettings(response: WidgetSettingsResult): PublicSmartChatConfig {
  const settings = response.widgetSettings;
  if (!settings) return disabledConfig();

  const ai = settings.aiBehavior;
  const wixUser = settings.wixUserBehavior;
  const offline = settings.offlineBehavior;
  const common = settings.commonBehavior;
  const activeHandlers = settings.activeHours
    ? resolveActiveHandlers(settings.activeHours as unknown as ActiveHoursInput)
    : (response.activeHandlers ?? []).filter(isPublicChatHandler);
  const primary = activeHandlers[0] ?? 'AI';

  const aiIntroduction = messageText(ai?.introduction);
  const wixUserIntroduction = messageText(wixUser?.introduction);
  const offlineIntroduction = messageText(offline?.introduction);

  const aiAvatar = resolveWixImageUrl(ai?.avatar, AVATAR_SIZE, AVATAR_SIZE);
  const wixUserAvatar = resolveWixImageUrl(wixUser?.avatar, AVATAR_SIZE, AVATAR_SIZE);
  const defaultAvatar = resolveWixImageUrl(response.defaultAvatar, AVATAR_SIZE, AVATAR_SIZE);

  const suggestions = ai?.suggestions;
  const questions = suggestions?.enabled
    ? (suggestions.questions ?? [])
        .filter((question) => question.enabled !== false && question.text)
        .map((question) => question.text as string)
    : [];

  const whatsapp = settings.socialButtons?.whatsapp;
  const whatsappEnabled = Boolean(whatsapp?.enabled && whatsapp.phone);

  const hideWidget = offline?.hideWidget ?? false;
  const wixUserName = wixUser?.name ?? null;

  return {
    enabled: !hideWidget,
    name: primary === 'WIX_USER' ? wixUserName ?? response.nameHandlers ?? null : response.nameHandlers ?? null,
    avatarUrl:
      primary === 'WIX_USER'
        ? wixUserAvatar ?? defaultAvatar
        : aiAvatar ?? defaultAvatar,
    introduction: primary === 'WIX_USER' ? wixUserIntroduction : aiIntroduction,
    introductions: {
      ai: aiIntroduction,
      wixUser: wixUserIntroduction,
      offline: offlineIntroduction,
    },
    legalDisclaimer: messageText(ai?.legalDisclaimer),
    engage: primary === 'WIX_USER' ? messageText(wixUser?.engage) : messageText(ai?.engage),
    suggestions:
      suggestions?.enabled
        ? {
            enabled: true,
            questions,
            introduction: messageText(suggestions.introduction),
            displayWhenMinimized: suggestions.displayWhenMinimized ?? true,
          }
        : null,
    appearance: normaliseAppearance(common?.appearance),
    autoOpen: common?.autoOpen ?? false,
    pages: common?.pagesWithChat?.length ? common.pagesWithChat : null,
    activeHandlers,
    contact: contactConfig(settings),
    whatsapp:
      whatsappEnabled && whatsapp?.phone
        ? {
            phone: whatsapp.phone,
            infoText: whatsapp.infoText ?? null,
            prefilledMessage: whatsapp.prefilledMessage ?? null,
          }
        : null,
    offline: {
      hideWidget,
      allowChat: offline?.allowChat ?? false,
      showContactForm: offline?.showContactForm ?? false,
      introduction: offlineIntroduction,
    },
    wixUser: wixUser
      ? {
          allowChat: wixUser.allowChat ?? true,
          name: wixUserName,
          avatarUrl: wixUserAvatar,
          introduction: wixUserIntroduction,
          engage: messageText(wixUser.engage),
          faqIntroduction: messageText(wixUser.faqQuestions?.introduction),
        }
      : null,
  };
}

export function clearSmartChatSettingsCache(): void {
  cache = null;
}

export async function getSmartChatConfig(): Promise<PublicSmartChatConfig> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;

  try {
    const elevated = auth.elevate(widgetSettingsV2.getWidgetSettings);
    const response = await elevated();
    const value = mapChatSettings(response);
    cache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch (error) {
    console.error('[smart-chat] widget settings failed:', error);
    const value = disabledConfig();
    cache = { value, expiresAt: Date.now() + NEGATIVE_CACHE_TTL_MS };
    return value;
  }
}
