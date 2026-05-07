import type { Context, Next } from 'hono';

export async function maintenanceMode(c: Context, next: Next): Promise<Response | void> {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return c.json(
      {
        code: 'SERVICE_UNAVAILABLE',
        error: 'Pitlane is temporarily under maintenance',
      },
      503,
    );
  }

  await next();
}
