export const MAX_MESSAGE_LENGTH = 4096;

export type PublicChatHandler = 'AI' | 'WIX_USER';
export type ChatAppearance = 'DESKTOP_AND_MOBILE' | 'DESKTOP' | 'MOBILE';

export interface PublicChatIntroductions {
  ai: string | null;
  wixUser: string | null;
  offline: string | null;
}

export interface PublicChatContact {
  enabled: boolean;
  introMessage: string | null;
  successMessage: string | null;
  fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    message: boolean;
    requiredName: boolean;
    requiredEmail: boolean;
    requiredPhone: boolean;
    requiredMessage: boolean;
  };
}

export interface PublicChatWhatsApp {
  phone: string;
  infoText: string | null;
  prefilledMessage: string | null;
}

export interface PublicChatWixUser {
  allowChat: boolean;
  name: string | null;
  avatarUrl: string | null;
  introduction: string | null;
  engage: string | null;
  faqIntroduction: string | null;
}

export interface PublicSmartChatConfig {
  enabled: boolean;
  name: string | null;
  avatarUrl: string | null;
  introduction: string | null;
  introductions: PublicChatIntroductions;
  legalDisclaimer: string | null;
  engage: string | null;
  suggestions: {
    enabled: boolean;
    questions: string[];
    introduction: string | null;
    displayWhenMinimized: boolean;
  } | null;
  appearance: ChatAppearance;
  autoOpen: boolean;
  pages: string[] | null;
  activeHandlers: PublicChatHandler[];
  contact: PublicChatContact | null;
  whatsapp: PublicChatWhatsApp | null;
  offline: {
    hideWidget: boolean;
    allowChat: boolean;
    showContactForm: boolean;
    introduction: string | null;
  };
  wixUser: PublicChatWixUser | null;
}

export interface ChatMessage {
  _id: string | null;
  _createdDate: string | null;
  sender: string | null;
  conversationId: string | null;
  answerTo: string | null;
  messageType: string | null;
  body: {
    mainText: string | null;
    footerText: string | null;
    additionalData: Record<string, unknown>[] | null;
  };
  visitorOptions: string[];
  assistantActions: string[];
  visitorOptionsFields: Record<string, unknown>[] | null;
  engineStatus: string | null;
}

export interface WixChatMessage {
  _id?: string | null;
  _createdDate?: Date | string | null;
  id?: string | null;
  createdDate?: string | null;
  sender?: string | null;
  conversationId?: string | null;
  answerTo?: string | null;
  messageType?: string | null;
  body?: {
    mainText?: string | null;
    footerText?: string | null;
    additionalData?: Record<string, unknown>[] | null;
  } | null;
  visitorOptions?: string[] | null;
  assistantActions?: string[] | null;
  visitorOptionsFields?: Record<string, unknown>[] | null;
  engineStatus?: string | null;
}

export interface SmartChatStreamFrame {
  inputMessage?: WixChatMessage;
  answerChunk?: string;
  answerMessage?: WixChatMessage;
}

export interface SmartChatMessagesResponse {
  messages: ChatMessage[];
  nextCursor: string | null;
}

function normaliseSender(message: WixChatMessage): string | null {
  const sender = message.sender ?? null;
  if (sender && sender !== 'UNKNOWN') return sender;

  const type = message.messageType;
  if (type === 'QUESTION' || type === 'USER_QUESTION' || type === 'USER_ANSWER') {
    return 'USER';
  }

  return sender;
}

export function toChatMessage(message: WixChatMessage): ChatMessage {
  const created = message._createdDate ?? message.createdDate;

  return {
    _id: message._id ?? message.id ?? null,
    _createdDate:
      created instanceof Date
        ? created.toISOString()
        : (created ?? null),
    sender: normaliseSender(message),
    conversationId: message.conversationId ?? null,
    answerTo: message.answerTo ?? null,
    messageType: message.messageType ?? null,
    body: {
      mainText: message.body?.mainText ?? null,
      footerText: message.body?.footerText ?? null,
      additionalData: message.body?.additionalData ?? null,
    },
    visitorOptions: message.visitorOptions ?? [],
    assistantActions: message.assistantActions ?? [],
    visitorOptionsFields: message.visitorOptionsFields ?? null,
    engineStatus: message.engineStatus ?? null,
  };
}

export function isPublicChatHandler(value: string | null | undefined): value is PublicChatHandler {
  return value === 'AI' || value === 'WIX_USER';
}
