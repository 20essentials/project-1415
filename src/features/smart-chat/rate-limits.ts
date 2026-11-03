export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

// Soft limit kept in memory: per-invocation on hosting isolates; still enough
// to blunt automated flooding between deployments.
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  take(clientKey: string): RateLimitDecision {
    const at = this.now();
    const bucket = this.buckets.get(clientKey);

    if (!bucket || bucket.resetAt <= at) {
      this.buckets.set(clientKey, { count: 1, resetAt: at + this.windowMs });
      if (this.buckets.size > 1024) this.evictExpired(at);
      return { allowed: true, retryAfterMs: 0 };
    }

    if (bucket.count >= this.limit) {
      return { allowed: false, retryAfterMs: bucket.resetAt - at };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }

  private evictExpired(at: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= at) this.buckets.delete(key);
    }
  }
}

export function chatClientKey(request: Request, forwardedFor: string | null): string {
  const ip = forwardedFor?.split(',')[0].trim();
  return ip || 'anonymous';
}
