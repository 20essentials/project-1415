import { test, expect, type Page } from '@playwright/test';

const chatConfig = {
  enabled: true,
  name: 'Petals & Predators',
  avatarUrl: null,
  introduction: 'Ask us anything about plants, orders or care.',
  introductions: {
    ai: 'Ask us anything about plants, orders or care.',
    wixUser: null,
    offline: null,
  },
  legalDisclaimer: null,
  engage: null,
  suggestions: {
    enabled: true,
    questions: ['How do I care for a Venus flytrap?'],
    introduction: null,
    displayWhenMinimized: false,
  },
  appearance: 'DESKTOP_AND_MOBILE',
  autoOpen: false,
  pages: null,
  activeHandlers: ['AI'],
  contact: {
    enabled: true,
    introMessage: 'Leave us a note.',
    successMessage: 'Message received.',
    fields: {
      name: true,
      email: true,
      phone: false,
      message: true,
      requiredName: false,
      requiredEmail: true,
      requiredPhone: false,
      requiredMessage: true,
    },
  },
  whatsapp: null,
  offline: {
    hideWidget: false,
    allowChat: false,
    showContactForm: true,
    introduction: 'We are offline right now.',
  },
  wixUser: null,
};

const answerText = 'The **Cape Sundew** is the easiest beginner plant.';
const longAnswer = [
  'The **Cape Sundew** is the easiest beginner plant.',
  ...Array.from(
    { length: 18 },
    (_, index) => `Care tip ${index + 1}: keep the soil damp and give it direct sun.`,
  ),
].join('\n\n');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pp_consent_v1', 'accepted'));
});

async function mockChat(
  page: Page,
  overrides: Partial<typeof chatConfig> = {},
  answer = answerText,
) {
  const config = { ...chatConfig, ...overrides };

  await page.route('**/api/smart-chat/config', (route) =>
    route.fulfill({ json: config }),
  );

  await page.route('**/api/smart-chat/messages', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { messages: [], nextCursor: null } });
      return;
    }

    const frames = [
      {
        inputMessage: {
          id: 'message-user',
          createdDate: '2026-01-01T10:00:00.000Z',
          sender: 'UNKNOWN',
          messageType: 'QUESTION',
          body: { mainText: 'Which plant is easiest for a beginner?' },
        },
      },
      { answerChunk: answer },
      {
        answerMessage: {
          id: 'message-assistant',
          createdDate: '2026-01-01T10:00:01.000Z',
          sender: 'ASSISTANT',
          messageType: 'ANSWER',
          body: { mainText: answer },
        },
      },
    ];

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/x-ndjson' },
      body: `${frames.map((frame) => JSON.stringify(frame)).join('\n')}\n`,
    });
  });
}

async function openChat(page: Page) {
  const launcher = page.locator('.pp-chat-launcher');
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator('.pp-chat-panel')).toBeVisible();
}

async function conversationMetrics(page: Page) {
  return page.evaluate(() => {
    const messages = document.querySelector<HTMLElement>('.pp-chat-messages');
    const viewport = messages?.querySelector<HTMLElement>('.vlist-viewport');
    const vlist = messages?.querySelector<HTMLElement>('.vlist');
    const composer = document.querySelector<HTMLElement>('.pp-chat-composer');
    const user = [...document.querySelectorAll<HTMLElement>('.pp-chat-item--user')].at(-1);
    const assistant = [...document.querySelectorAll<HTMLElement>('.pp-chat-item--assistant')].at(-1);
    const box = (element: HTMLElement | null | undefined) => {
      const rect = element?.getBoundingClientRect();
      return { top: rect?.top ?? 0, bottom: rect?.bottom ?? 0, height: rect?.height ?? 0 };
    };

    return {
      atBottom: viewport
        ? viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 2
        : false,
      messagesHeight: box(messages).height,
      vlistHeight: box(vlist).height,
      userBottom: box(user).bottom,
      assistantTop: box(assistant).top,
      assistantBottom: box(assistant).bottom,
      viewportBottom: box(viewport).bottom,
      composerTop: box(composer).top,
    };
  });
}

test.describe('smart chat desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opens, streams a mocked answer and keeps the conversation in order', async ({ page }) => {
    await mockChat(page);
    await page.goto('/');
    await openChat(page);

    await expect(page.locator('.pp-chat-header__status')).toHaveText('AI assistant');
    await expect(page.locator('.pp-chat-launcher')).toHaveAttribute('href', '/contact');

    const textarea = page.locator('.pp-chat-textarea');
    await textarea.fill('Which plant is easiest for a beginner?');
    await textarea.press('Enter');

    const userBubble = page.locator('.pp-chat-item--user .pp-chat-bubble').last();
    const assistantBubble = page.locator('.pp-chat-item--assistant .pp-chat-bubble').last();
    await expect(userBubble).toHaveText('Which plant is easiest for a beginner?');
    await expect(assistantBubble).toContainText('Cape Sundew');
    await expect(page.locator('.pp-chat-live')).toHaveCount(0);

    const userBox = await userBubble.boundingBox();
    const assistantBox = await assistantBubble.boundingBox();
    expect(userBox?.y ?? 0).toBeLessThan(assistantBox?.y ?? 0);

    const layout = await conversationMetrics(page);
    expect(Math.abs(layout.vlistHeight - layout.messagesHeight)).toBeLessThan(1);
    expect(layout.atBottom).toBe(true);
    expect(layout.userBottom).toBeLessThanOrEqual(layout.assistantTop + 1);
    expect(layout.assistantBottom).toBeLessThanOrEqual(layout.viewportBottom + 1);
    expect(layout.assistantBottom).toBeLessThanOrEqual(layout.composerTop + 1);

    const panelBox = await page.locator('.pp-chat-panel').boundingBox();
    expect(panelBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeLessThanOrEqual(1440);
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(900);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('does not render on a noindex page', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('.pp-chat-launcher')).toHaveCount(0);
  });
});

test.describe('smart chat mobile', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('the panel fits the viewport', async ({ page }) => {
    await mockChat(page);
    await page.goto('/');
    await openChat(page);

    const panelBox = await page.locator('.pp-chat-panel').boundingBox();
    expect(panelBox?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect(panelBox?.y ?? -1).toBeGreaterThanOrEqual(0);
    expect((panelBox?.x ?? 0) + (panelBox?.width ?? 0)).toBeLessThanOrEqual(360);
    expect((panelBox?.y ?? 0) + (panelBox?.height ?? 0)).toBeLessThanOrEqual(640);
    await expect(page.locator('.pp-chat-textarea')).toBeVisible();
  });

  test('keeps a long answer scrolled to its newest message', async ({ page }) => {
    await mockChat(page, {}, longAnswer);
    await page.goto('/');
    await openChat(page);

    const textarea = page.locator('.pp-chat-textarea');
    await textarea.fill('Which plant is easiest for a beginner?');
    await textarea.press('Enter');

    const assistantBubble = page.locator('.pp-chat-item--assistant .pp-chat-bubble').last();
    await expect(assistantBubble).toContainText('Care tip 18');
    await expect(page.locator('.pp-chat-live')).toHaveCount(0);

    const layout = await conversationMetrics(page);
    expect(Math.abs(layout.vlistHeight - layout.messagesHeight)).toBeLessThan(1);
    expect(layout.atBottom).toBe(true);
    expect(layout.userBottom).toBeLessThanOrEqual(layout.assistantTop + 1);
    expect(layout.assistantBottom).toBeLessThanOrEqual(layout.viewportBottom + 1);
    expect(layout.assistantBottom).toBeLessThanOrEqual(layout.composerTop + 1);
  });

  test('offline shows the contact form in form mode', async ({ page }) => {
    await mockChat(page, { activeHandlers: [] });
    await page.goto('/');
    await openChat(page);

    await expect(page.locator('.pp-chat-header__status')).toHaveText('Offline');
    await expect(page.locator('.pp-chat-form')).toBeVisible();
    await expect(page.locator('.pp-chat-form__submit')).toBeVisible();
    await expect(page.locator('.pp-chat-panel')).toHaveAttribute('data-mode', 'form');
    await expect(page.locator('.pp-chat-composer')).toBeHidden();
  });

  test('the contact form has a clear exit back to the conversation', async ({ page }) => {
    await mockChat(page);
    await page.goto('/');
    await openChat(page);

    const contactToggle = page.locator('.pp-chat-header').getByRole('button', { name: 'Contact' });
    await contactToggle.click();
    await expect(page.locator('.pp-chat-panel')).toHaveAttribute('data-mode', 'form');
    await expect(page.locator('.pp-chat-composer')).toBeHidden();

    await page.getByRole('button', { name: 'Close form' }).click();
    await expect(page.locator('.pp-chat-panel')).toHaveAttribute('data-mode', 'chat');
    await expect(page.locator('.pp-chat-textarea')).toBeVisible();
  });
});
