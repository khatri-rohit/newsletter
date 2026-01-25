// ==========================================
// RATE LIMITING UTILITY
// ==========================================

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

interface RateLimitStore {
  [key: string]: number[];
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  check(limit: number, token: string): { success: boolean; remaining: number } {
    const now = Date.now();
    const tokenKey = token;

    // Initialize or get existing timestamps for this token
    if (!this.store[tokenKey]) {
      this.store[tokenKey] = [];
    }

    // Remove timestamps outside the current window
    this.store[tokenKey] = this.store[tokenKey].filter(
      (timestamp) => timestamp > now - this.config.interval
    );

    // Check if limit exceeded
    if (this.store[tokenKey].length >= limit) {
      return {
        success: false,
        remaining: 0,
      };
    }

    // Add current request timestamp
    this.store[tokenKey].push(now);

    return {
      success: true,
      remaining: limit - this.store[tokenKey].length,
    };
  }

  reset(token: string): void {
    delete this.store[token];
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      this.store[key] = this.store[key].filter(
        (timestamp) => timestamp > now - this.config.interval
      );
      if (this.store[key].length === 0) {
        delete this.store[key];
      }
    });
  }
}

// Create rate limiter instances
export const apiLimiter = new RateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const subscribeRateLimiter = new RateLimiter({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 100,
});

export const authRateLimiter = new RateLimiter({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

// Cleanup every 5 minutes
setInterval(
  () => {
    apiLimiter.cleanup();
    subscribeRateLimiter.cleanup();
    authRateLimiter.cleanup();
  },
  5 * 60 * 1000
);

// Helper to get client identifier
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}
