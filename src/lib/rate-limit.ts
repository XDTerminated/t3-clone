/**
 * In-memory rate limiting using sliding window algorithm
 * For production multi-server deployments, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory (cleared on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with success status and rate limit info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  /** Standard API routes: 60 requests per minute */
  standard: { limit: 60, windowMs: 60 * 1000 },
  /** Expensive operations (AI chat, title generation): 10 requests per minute */
  expensive: { limit: 10, windowMs: 60 * 1000 },
  /** Auth operations: 5 requests per minute */
  auth: { limit: 5, windowMs: 60 * 1000 },
} as const;

/**
 * Get the appropriate rate limit config for a path
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Expensive AI operations
  if (
    pathname.startsWith("/api/chat") ||
    pathname.includes("/generate-title")
  ) {
    return RATE_LIMITS.expensive;
  }

  // Auth operations
  if (pathname.startsWith("/api/auth") || pathname.includes("/sign")) {
    return RATE_LIMITS.auth;
  }

  // Default standard rate limit
  return RATE_LIMITS.standard;
}

/**
 * Helper to get client identifier from request headers
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers (for proxied requests)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}

/**
 * Create rate limit response with appropriate headers
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
        "Retry-After": Math.ceil(
          (result.resetTime - Date.now()) / 1000
        ).toString(),
      },
    }
  );
}
