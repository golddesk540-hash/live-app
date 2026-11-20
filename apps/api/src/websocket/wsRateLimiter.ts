/**
 * POPO LIVE — REAL-TIME WEBSOCKET RATE LIMITER
 * 
 * Protects WebSocket server from chat floods and denial of service.
 * Implements sliding-window token counts per connection / user.
 */

export interface RateLimitOptions {
  windowMs: number;
  maxEvents: number;
}

export class WsRateLimiter {
  private userBuckets: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxEvents: number;

  constructor(options: RateLimitOptions = { windowMs: 3000, maxEvents: 10 }) {
    this.windowMs = options.windowMs;
    this.maxEvents = options.maxEvents;
  }

  /**
   * Checks whether the user is permitted to send an event.
   * Returns true if allowed, false if rate limited.
   */
  public checkRateLimit(key: string): boolean {
    const now = Date.now();
    const timestamps = this.userBuckets.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxEvents) {
      this.userBuckets.set(key, validTimestamps);
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.userBuckets.set(key, validTimestamps);
    return true;
  }

  /**
   * Resets rate limiter record for a user
   */
  public reset(key: string): void {
    this.userBuckets.delete(key);
  }

  /**
   * Periodic cleanup of expired entries
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.userBuckets.entries()) {
      const active = timestamps.filter((t) => now - t < this.windowMs);
      if (active.length === 0) {
        this.userBuckets.delete(key);
      } else {
        this.userBuckets.set(key, active);
      }
    }
  }
}
