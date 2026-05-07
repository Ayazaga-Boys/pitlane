import type { Context } from 'hono';
import type { ZodError } from 'zod';

export function validationError(c: Context, error: ZodError) {
  return c.json(
    {
      code: 'VALIDATION_ERROR',
      error: 'Validation failed',
      details: error.flatten(),
    },
    422,
  );
}

export function serviceUnavailable(c: Context) {
  return c.json(
    {
      code: 'SERVICE_UNAVAILABLE',
      error: 'Supabase is not configured',
    },
    503,
  );
}
