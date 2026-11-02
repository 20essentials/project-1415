import { describe, expect, it } from 'vitest';
import { mapChatSettings } from '@/features/smart-chat/chat-settings';

type WidgetSettingsResult = Parameters<typeof mapChatSettings>[0];

function response(overrides: Record<string, unknown> = {}): WidgetSettingsResult {
  return {
    nameHandlers: 'Flora',
    defaultAvatar: 'default-avatar',
    activeHandlers: ['AI'],
    widgetSettings: {
      _id: 'settings-id',
      revision: '1',
      activeHours: {
        mode: 'ALWAYS_WITH_AI',
        timeZone: 'Europe/Rome',
        schedule: [],
      },
      commonBehavior: {
        autoOpen: true,
        appearance: 'DESKTOP',
        pagesWithChat: ['/products'],
        contactForm: {
          introMessage: 'Tell us more',
          successMessage: 'Thanks',
          fields: {
            includeName: true,
            includeEmail: true,
            includePhone: false,
            includeMessage: true,
            requiredName: true,
            requiredEmail: true,
            requiredPhone: false,
            requiredMessage: true,
          },
        },
      },
      aiBehavior: {
        avatar: 'ai-avatar',
        introduction: { enabled: true, text: 'Hi from Flora' },
        legalDisclaimer: { enabled: true, text: 'AI answers may be wrong' },
        engage: { enabled: true, text: 'Need help picking a plant?' },
        suggestions: {
          enabled: true,
          displayWhenMinimized: false,
          introduction: { enabled: true, text: 'Try one' },
          questions: [
            { enabled: true, text: 'Which plant is easy?' },
            { enabled: false, text: 'Hidden question' },
          ],
        },
      },
      offlineBehavior: {
        hideWidget: false,
        allowChat: true,
        showContactForm: true,
        introduction: { enabled: true, text: 'We are offline' },
      },
      wixUserBehavior: {
        allowChat: true,
        name: 'Ana',
        avatar: 'wix-user-avatar',
        introduction: { enabled: true, text: 'Hello, I am Ana' },
        engage: { enabled: true, text: 'Ask a human' },
        faqQuestions: {
          enabled: true,
          introduction: { enabled: true, text: 'FAQ' },
        },
      },
      socialButtons: {
        whatsapp: {
          enabled: true,
          phone: '+34123456789',
          infoText: 'Chat on WhatsApp',
          prefilledMessage: 'Hi',
        },
      },
    },
    ...overrides,
  } as unknown as WidgetSettingsResult;
}

describe('mapChatSettings', () => {
  it('maps the AI configuration to the public shape', () => {
    const config = mapChatSettings(response());

    expect(config.enabled).toBe(true);
    expect(config.name).toBe('Flora');
    expect(config.introduction).toBe('Hi from Flora');
    expect(config.introductions).toEqual({
      ai: 'Hi from Flora',
      wixUser: 'Hello, I am Ana',
      offline: 'We are offline',
    });
    expect(config.avatarUrl).toContain('ai-avatar');
    expect(config.legalDisclaimer).toBe('AI answers may be wrong');
    expect(config.engage).toBe('Need help picking a plant?');
    expect(config.appearance).toBe('DESKTOP');
    expect(config.autoOpen).toBe(true);
    expect(config.pages).toEqual(['/products']);
    expect(config.activeHandlers).toEqual(['AI']);
    expect(config.suggestions).toEqual({
      enabled: true,
      questions: ['Which plant is easy?'],
      introduction: 'Try one',
      displayWhenMinimized: false,
    });
    expect(config.contact?.fields.phone).toBe(false);
    expect(config.contact?.fields.requiredEmail).toBe(true);
    expect(config.whatsapp).toEqual({
      phone: '+34123456789',
      infoText: 'Chat on WhatsApp',
      prefilledMessage: 'Hi',
    });
    expect(config.offline).toEqual({
      hideWidget: false,
      allowChat: true,
      showContactForm: true,
      introduction: 'We are offline',
    });
    expect(config.wixUser?.name).toBe('Ana');
    expect(config.wixUser?.faqIntroduction).toBe('FAQ');
  });

  it('uses the Wix user identity when that is the active handler', () => {
    const base = response({ activeHandlers: ['WIX_USER'] });
    const settings = base.widgetSettings as unknown as Record<string, unknown>;
    settings.activeHours = {
      mode: 'ALWAYS_WITH_WIX_USER',
      timeZone: 'Europe/Rome',
      schedule: [],
    };

    const config = mapChatSettings(base);

    expect(config.activeHandlers).toEqual(['WIX_USER']);
    expect(config.name).toBe('Ana');
    expect(config.introduction).toBe('Hello, I am Ana');
    expect(config.engage).toBe('Ask a human');
    expect(config.avatarUrl).toContain('wix-user-avatar');
  });

  it('disables the widget when settings are hidden offline', () => {
    const base = response();
    const settings = base.widgetSettings as unknown as Record<string, unknown>;
    settings.offlineBehavior = {
      hideWidget: true,
      allowChat: false,
      showContactForm: false,
    };

    const config = mapChatSettings(base);
    expect(config.enabled).toBe(false);
    expect(config.offline.hideWidget).toBe(true);
  });

  it('returns a safe disabled config when settings are missing', () => {
    const config = mapChatSettings({} as WidgetSettingsResult);

    expect(config.enabled).toBe(false);
    expect(config.activeHandlers).toEqual([]);
    expect(config.offline.hideWidget).toBe(true);
  });
});
