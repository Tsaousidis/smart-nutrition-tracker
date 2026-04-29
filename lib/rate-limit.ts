import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client from environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter instances for different purposes
const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10s"), // 5 requests per 10 seconds for auth
  prefix: "ratelimit:auth",
});

const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1m"), // 30 requests per minute for general API
  prefix: "ratelimit:api",
});

const parseRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1m"), // 10 requests per minute for meal parsing
  prefix: "ratelimit:parse",
});

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  return "unknown";
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  // Determine which rate limiter to use based on the key prefix
  let limiter: Ratelimit;
  
  if (options.key.startsWith("auth:")) {
    limiter = authRatelimit;
  } else if (options.key.startsWith("parse:")) {
    limiter = parseRatelimit;
  } else {
    limiter = apiRatelimit;
  }

  try {
    const result = await limiter.limit(options.key);
    
    return {
      allowed: result.success,
      retryAfterSeconds: Math.ceil((result.reset - Date.now()) / 1000),
      remaining: result.remaining,
    };
  } catch (error) {
    // If Redis fails, allow the request (fail-open for availability)
    console.error("Rate limit error:", error);
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: options.limit,
    };
  }
}

// Helper functions for specific rate limit scenarios
export async function checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `auth:${ip}`,
    limit: 5,
    windowMs: 10000,
  });
}

export async function checkApiRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `api:${ip}`,
    limit: 30,
    windowMs: 60000,
  });
}

export async function checkParseRateLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `parse:${userId}`,
    limit: 10,
    windowMs: 60000,
  });
}
