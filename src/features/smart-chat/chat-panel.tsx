import { useEffect, useRef, useState } from 'react';
import { currentLanguage, useTranslation } from '@/shared/i18n';
import { MAX_MESSAGE_LENGTH, type ChatMessage, type PublicSmartChatConfig } from './chat';
import {
  fetchSmartChatHistory,
  mergeChatMessages,
  replaceDraftMessage,
  streamSmartChatMessage,
} from './chat-client';
import { ChatContactForm } from './chat-contact-form';
import { parseChatText } from './chat-markdown';
import { ChatMessages } from './chat-messages';

interface ChatPanelProps {
  config: PublicSmartChatConfig;
  onClose: () => void;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function MessageText({ text }: { text: string }) {
  return (
    <>
      {parseChatText(text).map((segment, index) => {
        if (segment.type === 'strong') return <strong key={index}>{segment.value}</strong>;
        if (segment.type === 'link') {
          return (
            <a key={index} href={segment.href} target="_blank" rel="noopener noreferrer">
              {segment.value}
            </a>
          );
        }
        return <span key={index}>{segment.value}</span>;
      })}
    </>
  );
}

function TypingDots() {
  return (
    <span className="pp-chat-typing" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function brandFallback(config: PublicSmartChatConfig): string {
  return config.name?.trim() || 'Petals & Predators';
}

export function ChatPanel({ config, onClose }: ChatPanelProps) {
  const { t } = useTranslation();
  const locale = currentLanguage();
  const activeHandlers = config.activeHandlers;
  const humanActive = activeHandlers.includes('WIX_USER');
  const canChat = activeHandlers.length > 0 || config.offline.allowChat;
  const speakerName = brandFallback(config);
  const humanName = config.wixUser?.name ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(!canChat && config.offline.showContactForm);
  const [historyNonce, setHistoryNonce] = useState(0);

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const liveTextRef = useRef('');

  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSmartChatHistory({ limit: 50, signal: controller.signal })
      .then((result) => {
        if (cancelled) return;
        setMessages((current) => mergeChatMessages(current, result.messages));
        setNextCursor(result.nextCursor);
      })
      .catch((loadError: unknown) => {
        if (cancelled || isAbortError(loadError)) return;
        setError('history');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [historyNonce]);

  useEffect(() => {
    if (!humanActive) return;

    const interval = window.setInterval(() => {
      if (document.hidden) return;
      fetchSmartChatHistory({ limit: 50 })
        .then((result) => {
          setMessages((current) => mergeChatMessages(current, result.messages));
        })
        .catch(() => {
          // Polling is best effort; the composer still works.
        });
    }, 8000);

    return () => window.clearInterval(interval);
  }, [humanActive]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.style.height = 'auto';
    composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 112)}px`;
  }, [draft]);

  const loadEarlier = async () => {
    if (!nextCursor || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const result = await fetchSmartChatHistory({ cursor: nextCursor, limit: 50 });
      setMessages((current) => mergeChatMessages(current, result.messages));
      setNextCursor(result.nextCursor);
    } catch {
      setError('history');
    } finally {
      setLoadingEarlier(false);
    }
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || value.length > MAX_MESSAGE_LENGTH || !canChat) return;

    const draftId = `draft-${Date.now()}`;
    const optimistic: ChatMessage = {
      _id: draftId,
      _createdDate: new Date().toISOString(),
      sender: 'USER',
      conversationId: null,
      answerTo: null,
      messageType: 'QUESTION',
      body: { mainText: value, footerText: null, additionalData: null },
      visitorOptions: [],
      assistantActions: [],
      visitorOptionsFields: null,
      engineStatus: null,
    };

    setMessages((current) => [...current, optimistic]);
    setDraft('');
    setError(null);
    setSending(true);
    setLiveText('');
    liveTextRef.current = '';
    setShowContact(false);

    const controller = new AbortController();
    abortRef.current = controller;
    let answered = false;

    try {
      await streamSmartChatMessage(
        value,
        {
          onInput: (message) => {
            setMessages((current) => replaceDraftMessage(current, draftId, message));
          },
          onChunk: (chunk) => {
            liveTextRef.current += chunk;
            setLiveText(liveTextRef.current);
          },
          onAnswer: (message) => {
            answered = true;
            setMessages((current) => mergeChatMessages(current, [message]));
            setLiveText('');
            liveTextRef.current = '';
          },
        },
        controller.signal,
      );

      if (!answered && liveTextRef.current.trim()) {
        const fallback: ChatMessage = {
          ...optimistic,
          _id: `draft-answer-${Date.now()}`,
          sender: 'ASSISTANT',
          messageType: 'ANSWER',
          body: { mainText: liveTextRef.current, footerText: null, additionalData: null },
        };
        setMessages((current) => mergeChatMessages(current, [fallback]));
        setLiveText('');
        liveTextRef.current = '';
      }
    } catch (sendError: unknown) {
      if (!isAbortError(sendError)) {
        setMessages((current) => current.filter((message) => message._id !== draftId));
        setDraft((current) => current || value);
        setError('send');
      }
    } finally {
      if (!controller.signal.aborted) setSending(false);
      setLiveText('');
      liveTextRef.current = '';
      abortRef.current = null;
    }
  };

  const submitComposer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(draft);
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  };

  const status = humanActive
    ? t('smart-chat.status-human')
    : activeHandlers.includes('AI')
      ? t('smart-chat.status-ai')
      : t('smart-chat.status-offline');

  const emptyIntro =
    activeHandlers.length === 0
      ? config.introductions.offline ?? config.offline.introduction
      : config.introduction ??
        (humanActive ? config.introductions.wixUser : config.introductions.ai) ??
        config.engage;

  const suggestions =
    config.suggestions?.enabled && messages.length === 0 && canChat
      ? config.suggestions.questions.slice(0, 5)
      : [];

  const whatsappHref = config.whatsapp
    ? `https://wa.me/${config.whatsapp.phone.replace(/\D/g, '')}${
        config.whatsapp.prefilledMessage
          ? `?text=${encodeURIComponent(config.whatsapp.prefilledMessage)}`
          : ''
      }`
    : null;

  return (
    <section className="pp-chat-panel" aria-label={t('smart-chat.title')}>
      <header className="pp-chat-header">
        <span className="pp-chat-header__avatar" aria-hidden="true">
          {config.avatarUrl ? (
            <img src={config.avatarUrl} alt="" width={36} height={36} />
          ) : (
            speakerName.charAt(0).toUpperCase()
          )}
        </span>
        <span className="pp-chat-header__identity">
          <span className="pp-chat-header__name">{speakerName}</span>
          <span className="pp-chat-header__status">
            <span className="pp-chat-header__dot" aria-hidden="true" />
            {status}
          </span>
        </span>
        <span className="pp-chat-header__actions">
          {config.contact?.enabled && (
            <button
              type="button"
              className="pp-chat-icon-button"
              onClick={() => setShowContact((current) => !current)}
            >
              {t('smart-chat.contact-cta')}
            </button>
          )}
          <button
            type="button"
            className="pp-chat-icon-button pp-chat-icon-button--close"
            onClick={onClose}
            aria-label={t('smart-chat.close')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      </header>

      <div className="pp-chat-body">
        {loading ? (
          <div className="pp-chat-skeletons" aria-label={t('smart-chat.typing')}>
            <span className="pp-chat-skeleton" />
            <span className="pp-chat-skeleton pp-chat-skeleton--short" />
            <span className="pp-chat-skeleton" />
          </div>
        ) : (
          <>
            {nextCursor && (
              <button
                type="button"
                className="pp-chat-load-earlier"
                onClick={loadEarlier}
                disabled={loadingEarlier}
              >
                {loadingEarlier ? t('smart-chat.typing') : t('smart-chat.load-earlier')}
              </button>
            )}

            {messages.length > 0 ? (
              <ChatMessages
                messages={messages}
                speakerName={speakerName}
                avatarUrl={config.avatarUrl}
                humanName={humanName}
                locale={locale}
                hasEarlier={Boolean(nextCursor)}
                loadingEarlier={loadingEarlier}
                onLoadEarlier={loadEarlier}
              />
            ) : (
              <div className="pp-chat-empty">
                <p className="pp-chat-empty__intro">
                  {emptyIntro || t('smart-chat.empty')}
                </p>

                {suggestions.length > 0 && (
                  <div className="pp-chat-suggestions" aria-label={t('smart-chat.suggestions-label')}>
                    {suggestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        className="pp-chat-chip"
                        onClick={() => void send(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}

                {whatsappHref && (
                  <a
                    className="pp-chat-text-link"
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {config.whatsapp?.infoText || t('smart-chat.whatsapp')}
                  </a>
                )}

                {!canChat && !showContact && config.contact?.enabled && (
                  <button
                    type="button"
                    className="pp-chat-text-link"
                    onClick={() => setShowContact(true)}
                  >
                    {t('smart-chat.contact-cta')}
                  </button>
                )}
              </div>
            )}

            {liveText && (
              <div className="pp-chat-live">
                <span className="pp-chat-avatar" aria-hidden="true">
                  {config.avatarUrl ? <img src={config.avatarUrl} alt="" width={28} height={28} /> : speakerName.charAt(0)}
                </span>
                <div className="pp-chat-bubble pp-chat-bubble--assistant">
                  <MessageText text={liveText} />
                </div>
              </div>
            )}

            {sending && !liveText && (
              <div className="pp-chat-live pp-chat-live--typing">
                <span className="pp-chat-avatar" aria-hidden="true">
                  {config.avatarUrl ? <img src={config.avatarUrl} alt="" width={28} height={28} /> : speakerName.charAt(0)}
                </span>
                <div className="pp-chat-bubble pp-chat-bubble--assistant">
                  <TypingDots />
                </div>
              </div>
            )}

            {error && (
              <div className="pp-chat-error" role="alert">
                <span>{t('smart-chat.error')}</span>
                {error === 'history' && (
                  <button type="button" onClick={() => setHistoryNonce((value) => value + 1)}>
                    {t('smart-chat.retry')}
                  </button>
                )}
              </div>
            )}

            {showContact && config.contact && (
              <div className="pp-chat-contact">
                <ChatContactForm contact={config.contact} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="pp-chat-bottom">
        <form className="pp-chat-composer" onSubmit={submitComposer}>
          <textarea
            ref={composerRef}
            className="pp-chat-textarea"
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={canChat ? t('smart-chat.placeholder') : t('smart-chat.status-offline')}
            value={draft}
            disabled={!canChat || sending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onComposerKeyDown}
            aria-label={t('smart-chat.placeholder')}
          />
          <button
            type="submit"
            className="pp-chat-send"
            disabled={!canChat || sending || !draft.trim()}
            aria-label={t('smart-chat.send')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        <p className="pp-chat-disclaimer">
          {config.legalDisclaimer || t('smart-chat.disclaimer')}
        </p>
      </div>
    </section>
  );
}
