/** Small token-bucket rate limiter — no dependencies, O(1) per check. */

export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(private ratePerSec: number, private burst: number) {
    this.tokens = burst;
    this.last = Date.now();
  }

  /** Returns true if the action is allowed, false if rate-limited. */
  take(cost = 1): boolean {
    const now = Date.now();
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.ratePerSec);
    this.last = now;
    if (this.tokens < cost) return false;
    this.tokens -= cost;
    return true;
  }
}

/** Fixed-window counter keyed by string (e.g. IP), with periodic cleanup. */
export class WindowCounter {
  private map = new Map<string, { n: number; windowStart: number }>();

  constructor(private windowMs: number, private max: number) {}

  take(key: string): boolean {
    const now = Date.now();
    const e = this.map.get(key);
    if (!e || now - e.windowStart > this.windowMs) {
      this.map.set(key, { n: 1, windowStart: now });
      return true;
    }
    if (e.n >= this.max) return false;
    e.n++;
    return true;
  }

  sweep(): void {
    const now = Date.now();
    for (const [k, e] of this.map) if (now - e.windowStart > this.windowMs) this.map.delete(k);
  }
}
