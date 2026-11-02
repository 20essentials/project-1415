import { describe, expect, it } from 'vitest';
import { validateSmartChatContact } from '@/features/smart-chat/contact';

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
