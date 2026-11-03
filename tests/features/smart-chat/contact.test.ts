import { describe, expect, it } from 'vitest';
import {
  mapSmartChatContactToTargets,
  validateSmartChatContact,
} from '@/features/smart-chat/contact';

describe('validateSmartChatContact', () => {
  it('requires message and email', () => {
    expect(validateSmartChatContact({ message: '' })).toEqual(['message', 'email']);
  });

  it('rejects invalid email and too long message', () => {
    expect(
      validateSmartChatContact({ email: 'bad', message: 'a'.repeat(4097) }),
    ).toEqual(['message', 'email']);
  });

  it('returns no errors for a valid minimal payload', () => {
    expect(
      validateSmartChatContact({ email: 'flora@example.com', message: 'Hello' }),
    ).toEqual([]);
  });
});

describe('mapSmartChatContactToTargets', () => {
  const input = { name: 'Ada', email: 'ada@example.com', phone: '+39 02', message: 'Hi' };

  it('maps to the built-in contact form targets', () => {
    expect(mapSmartChatContactToTargets(input, ['first_name', 'email', 'message'])).toEqual({
      message: 'Hi',
      email: 'ada@example.com',
      first_name: 'Ada',
    });
  });

  it('drops keys the form does not accept', () => {
    expect(mapSmartChatContactToTargets(input, ['email', 'message'])).toEqual({
      message: 'Hi',
      email: 'ada@example.com',
    });
  });

  it('keeps message and email without a target list', () => {
    expect(mapSmartChatContactToTargets(input, null)).toEqual({
      message: 'Hi',
      email: 'ada@example.com',
    });
  });
});
