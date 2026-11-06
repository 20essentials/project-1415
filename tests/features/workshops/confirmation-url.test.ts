import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { signBookingConfirmation, verifyBookingConfirmation } from '@/features/workshops/confirmation-url';

const SECRET = 'test-secret';
const INPUT = {
  id: 'booking-123',
  service: 'Care 101',
  start: '2030-01-01T10:00:00',
  end: '2030-01-01T11:00:00',
};

function signedParams(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

describe('signBookingConfirmation', () => {
  it('round-trips through verifyBookingConfirmation', () => {
    const query = signBookingConfirmation(INPUT, SECRET);
    expect(verifyBookingConfirmation(signedParams(query), SECRET)).toBe(true);
  });

  it('round-trips with the query params in a different order', () => {
    const query = signBookingConfirmation(INPUT, SECRET);
    const reordered = new URLSearchParams(query);
    const params = [...reordered.entries()].reverse();
    expect(verifyBookingConfirmation(new URLSearchParams(params), SECRET)).toBe(true);
  });

  it('rejects an altered id', () => {
    const params = signedParams(signBookingConfirmation(INPUT, SECRET));
    params.set('id', 'booking-456');
    expect(verifyBookingConfirmation(params, SECRET)).toBe(false);
  });

  it('rejects an altered service', () => {
    const params = signedParams(signBookingConfirmation(INPUT, SECRET));
    params.set('service', 'Repotting 101');
    expect(verifyBookingConfirmation(params, SECRET)).toBe(false);
  });

  it('rejects a missing signature', () => {
    const params = signedParams(signBookingConfirmation(INPUT, SECRET));
    params.delete('sig');
    expect(verifyBookingConfirmation(params, SECRET)).toBe(false);
  });

  it('rejects a missing id', () => {
    const params = signedParams(signBookingConfirmation(INPUT, SECRET));
    params.delete('id');
    expect(verifyBookingConfirmation(params, SECRET)).toBe(false);
  });

  it('rejects a signature computed over a different payload order', () => {
    const params = signedParams(signBookingConfirmation(INPUT, SECRET));
    const reorderedPayload = [INPUT.service, INPUT.id, INPUT.start, INPUT.end].join('|');
    params.set('sig', createHmac('sha256', SECRET).update(reorderedPayload).digest('hex'));
    expect(verifyBookingConfirmation(params, SECRET)).toBe(false);
  });

  it('rejects a signature made with another secret', () => {
    const query = signBookingConfirmation(INPUT, 'other-secret');
    expect(verifyBookingConfirmation(signedParams(query), SECRET)).toBe(false);
  });
});
