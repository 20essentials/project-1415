import { describe, expect, it } from 'vitest';
import { resolveActiveHandlers } from '@/features/smart-chat/availability';

const MONDAY_9_ROME = new Date('2026-11-02T08:00:00.000Z');

describe('resolveActiveHandlers', () => {
  it('returns AI for ALWAYS_WITH_AI', () => {
    expect(resolveActiveHandlers({ mode: 'ALWAYS_WITH_AI' }, MONDAY_9_ROME)).toEqual(['AI']);
  });

  it('returns WIX_USER for ALWAYS_WITH_WIX_USER', () => {
    expect(resolveActiveHandlers({ mode: 'ALWAYS_WITH_WIX_USER' }, MONDAY_9_ROME)).toEqual([
      'WIX_USER',
    ]);
  });

  it('returns nobody when the mode is OFF or unknown', () => {
    expect(resolveActiveHandlers({ mode: 'OFF' }, MONDAY_9_ROME)).toEqual([]);
    expect(resolveActiveHandlers({ mode: 'UNKNOWN_MODE' }, MONDAY_9_ROME)).toEqual([]);
    expect(resolveActiveHandlers(null, MONDAY_9_ROME)).toEqual([]);
  });

  it('uses the schedule and the configured timezone', () => {
    const schedule = [
      {
        start: 9 * 60 * 60 * 1000,
        end: 17 * 60 * 60 * 1000,
        handler: 'AI_CHAT' as const,
        days: ['MONDAY' as const],
      },
    ];

    expect(
      resolveActiveHandlers(
        { mode: 'SCHEDULED', timeZone: 'Europe/Rome', schedule },
        MONDAY_9_ROME,
      ),
    ).toEqual(['AI']);

    expect(
      resolveActiveHandlers(
        { mode: 'SCHEDULED', timeZone: 'Europe/Rome', schedule },
        new Date('2026-11-02T18:00:00.000Z'),
      ),
    ).toEqual([]);
  });

  it('supports overnight frames using the previous day', () => {
    const schedule = [
      {
        start: 22 * 60 * 60 * 1000,
        end: 2 * 60 * 60 * 1000,
        handler: 'WIX_USER_CHAT' as const,
        days: ['MONDAY' as const],
      },
    ];

    expect(
      resolveActiveHandlers(
        { mode: 'SCHEDULED', timeZone: 'Europe/Rome', schedule },
        new Date('2026-11-03T00:30:00.000Z'),
      ),
    ).toEqual(['WIX_USER']);
  });

  it('deduplicates handlers and ignores unknown frame handlers', () => {
    const schedule = [
      { start: 0, end: 23 * 60 * 60 * 1000, handler: 'AI_CHAT' as const, days: ['MONDAY' as const] },
      { start: 0, end: 23 * 60 * 60 * 1000, handler: 'AI_CHAT' as const, days: ['MONDAY' as const] },
      { start: 0, end: 23 * 60 * 60 * 1000, handler: 'UNKNOWN_FRAME_HANDLER' as const, days: ['MONDAY' as const] },
    ];

    expect(
      resolveActiveHandlers(
        { mode: 'SCHEDULED', timeZone: 'Europe/Rome', schedule },
        MONDAY_9_ROME,
      ),
    ).toEqual(['AI']);
  });
});
