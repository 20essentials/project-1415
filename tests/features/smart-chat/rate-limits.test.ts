import { describe, expect, it } from 'vitest';
import { InMemoryRateLimiter } from '@/features/smart-chat/rate-limits';

function makeLimiter(now: number[]): InMemoryRateLimiter {
  let step = 0;
  return new InMemoryRateLimiter(3, 10_000, () => now[Math.min(step++, now.length - 1)]);
}

describe('InMemoryRateLimiter', () => {
  it('allows up to the limit within the window', () => {
    let step = 0;
    const clock = () => 1_000 + step++ * 100;
    const limiter = new InMemoryRateLimiter(3, 10_000, clock);

    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(true);
    const fourth = limiter.take('a');

    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks clients independently', () => {
    const limiter = makeLimiter([1_000]);

    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('b').allowed).toBe(true);
  });

  it('resets after the window expires', () => {
    let step = 0;
    const times = [1_000, 1_100, 1_200, 1_300, 12_000, 12_100];
    const clock = () => times[Math.min(step++, times.length - 1)];
    const limiter = new InMemoryRateLimiter(3, 10_000, clock);

    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(true);
    expect(limiter.take('a').allowed).toBe(false);

    expect(limiter.take('a').allowed).toBe(true);
  });

  it('reports the remaining wait with Retry-After granularity', () => {
    const limiter = makeLimiter([1_000, 1_100, 1_200, 1_300]);

    limiter.take('a');
    limiter.take('a');
    limiter.take('a');
    const blocked = limiter.take('a');

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(9700);
    expect(Math.ceil(blocked.retryAfterMs / 1000)).toBe(10);
  });
});
