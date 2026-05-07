import type { Context, Next } from 'hono';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const minuteMs = 60_000;
const hourMs = 60 * minuteMs;

function getLimit(path: string): { limit: number; windowMs: number } {
  if (path.includes('/auth/')) return { limit: 10, windowMs: minuteMs };
  if (path.includes('/media/upload-url')) return { limit: 20, windowMs: minuteMs };
  if (path.includes('/messages/')) return { limit: 60, windowMs: minuteMs };
  if (path.includes('/help')) return { limit: 5, windowMs: hourMs };
  return { limit: 200, windowMs: minuteMs };
}

function clientKey(c: Context): string {
  const forwardedFor = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || c.req.header('x-real-ip') || 'local';
  return `${ip}:${c.req.method}:${c.req.path}`;
}

export async function rateLimit(c: Context, next: Next): Promise<Response | void> {
  const now = Date.now();
  const { limit, windowMs } = getLimit(c.req.path);
  const key = clientKey(c);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    await next();
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return c.json(
      {
        code: 'RATE_LIMITED',
        error: 'Too many requests',
      },
      429,
      {
        'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)),
      },
    );
  }

  await next();
}
