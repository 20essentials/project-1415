import { describe, expect, it } from 'vitest';
import { toChatMessage } from '@/features/smart-chat/chat';

describe('toChatMessage', () => {
  it('maps the REST stream shape', () => {
    const message = toChatMessage({
      id: 'message-id',
      createdDate: '2026-11-02T16:37:57.162Z',
      sender: 'UNKNOWN',
      messageType: 'QUESTION',
      conversationId: 'conversation-id',
      body: { mainText: 'Hello', additionalData: [] },
      visitorOptions: [],
      assistantActions: [],
    });

    expect(message._id).toBe('message-id');
    expect(message._createdDate).toBe('2026-11-02T16:37:57.162Z');
    expect(message.sender).toBe('USER');
    expect(message.body.mainText).toBe('Hello');
  });

  it('maps the SDK shape', () => {
    const message = toChatMessage({
      _id: 'sdk-id',
      _createdDate: new Date('2026-11-02T16:38:00.000Z'),
      sender: 'ASSISTANT',
      messageType: 'ANSWER',
      body: { mainText: 'Hi', footerText: 'Footer' },
    });

    expect(message._id).toBe('sdk-id');
    expect(message._createdDate).toBe('2026-11-02T16:38:00.000Z');
    expect(message.sender).toBe('ASSISTANT');
    expect(message.body.footerText).toBe('Footer');
    expect(message.visitorOptions).toEqual([]);
  });

  it('keeps unknown senders for non visitor message types', () => {
    const message = toChatMessage({
      id: 'message-id',
      sender: 'UNKNOWN',
      messageType: 'SYSTEM',
    });

    expect(message.sender).toBe('UNKNOWN');
    expect(message._createdDate).toBeNull();
  });
});
