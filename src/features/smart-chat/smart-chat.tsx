import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/shared/analytics';
import { getConsentState } from '@/shared/consent';
import { localize, stripLocalePrefix, useTranslation } from '@/shared/i18n';
import type { PublicSmartChatConfig } from './chat';
import { fetchSmartChatConfig } from './chat-client';
import { ChatPanel } from './chat-panel';

const AUTO_OPEN_KEY = 'pp_chat_auto_opened_v1';

function appearsOnThisViewport(config: PublicSmartChatConfig): boolean {
  if (typeof window === 'undefined') return true;
  const desktop = window.matchMedia('(min-width: 768px)').matches;
  if (config.appearance === 'DESKTOP') return desktop;
  if (config.appearance === 'MOBILE') return !desktop;
  return true;
}

function pathAllowsChat(config: PublicSmartChatConfig, pathname: string): boolean {
  if (!config.pages || config.pages.length === 0) return true;
  const path = stripLocalePrefix(pathname);
  return config.pages.some((page) => {
    const clean = page.length > 1 ? page.replace(/\/+$/, '') : page;
    return path === clean || path.startsWith(`${clean}/`);
  });
}

export function SmartChat() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<PublicSmartChatConfig | null>(null);
  const [pathname, setPathname] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const launcherRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<PublicSmartChatConfig | null> => {
      const next = await fetchSmartChatConfig();
      if (cancelled) return null;
      setConfig(next);
      setPathname(window.location.pathname);
      return next;
    };

    const onPageLoad = async () => {
      const next = await load();
      if (cancelled) return;
      // The panel only closes here when the new route no longer offers chat.
      if (!next?.enabled || !pathAllowsChat(next, window.location.pathname)) {
        setOpen(false);
      }
    };

    void load();
    document.addEventListener('astro:page-load', onPageLoad);

    return () => {
      cancelled = true;
      document.removeEventListener('astro:page-load', onPageLoad);
    };
  }, []);

  const visible =
    Boolean(config?.enabled) &&
    pathname !== null &&
    pathAllowsChat(config as PublicSmartChatConfig, pathname) &&
    appearsOnThisViewport(config as PublicSmartChatConfig);

  useEffect(() => {
    if (!visible || !config?.autoOpen || open) return;
    if (getConsentState() === null) return;
    if (document.querySelector('[data-pp-consent]:not([hidden])')) return;

    try {
      if (window.sessionStorage.getItem(AUTO_OPEN_KEY)) return;
      window.sessionStorage.setItem(AUTO_OPEN_KEY, '1');
    } catch {
      return;
    }

    setOpen(true);
    trackEvent('CustomEvent', { category: 'SmartChat', action: 'AutoOpen' });
  }, [visible, config, open]);

  if (!visible) return null;

  const openChat = () => {
    setOpen(true);
    trackEvent('CustomEvent', { category: 'SmartChat', action: 'Open' });
  };

  const closeChat = () => {
    setOpen(false);
    launcherRef.current?.focus();
  };

  const openWithQuestion = (question: string) => {
    setPendingQuestion(question);
    openChat();
  };

  return (
    <div className="pp-chat-root" data-appearance={config?.appearance ?? 'DESKTOP_AND_MOBILE'} data-open={open ? '' : undefined}>
      {open && config && (
        <ChatPanel
          config={config}
          onClose={closeChat}
          initialQuestion={pendingQuestion ?? undefined}
          onInitialQuestionSent={() => setPendingQuestion(null)}
        />
      )}

      {!open && config?.suggestions?.displayWhenMinimized && (
        <div className="pp-chat-tips">
          {config.suggestions.questions.slice(0, 2).map((question) => (
            <button
              key={question}
              type="button"
              className="pp-chat-chip"
              onClick={() => openWithQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <a
        ref={launcherRef}
        className="pp-chat-launcher"
        href={localize('/contact')}
        aria-label={t('smart-chat.open')}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          if (open) closeChat();
          else openChat();
        }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
            <path
              d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v6a2.5 2.5 0 01-2.5 2.5H10l-4.2 3.15A.5.5 0 015 17.75V6.5z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M9 9h6M9 12h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
      </a>
    </div>
  );
}
