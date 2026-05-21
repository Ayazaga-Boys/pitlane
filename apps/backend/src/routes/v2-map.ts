import { Hono } from 'hono';
import { validationError } from '../lib/http.js';
import { V2MapHeatmapQuerySchema } from '../schemas/map.schema.js';
import { getVehicleHeatmapCells } from '../services/valkey.js';

export const v2MapRoutes = new Hono();

v2MapRoutes.get('/heatmap', async (c) => {
  const parsed = V2MapHeatmapQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return validationError(c, parsed.error);

  try {
    const data = await getVehicleHeatmapCells(parsed.data.vehicle_type, parsed.data.bounds);
    return c.json({
      data,
      meta: {
        vehicle_type: parsed.data.vehicle_type,
        cache_key_prefix: parsed.data.vehicle_type === 'any'
          ? 'heatmap:snapshot'
          : `heatmap:snapshot:vehicle:${parsed.data.vehicle_type}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Valkey heatmap read failed';
    return c.json({ code: 'DOWNSTREAM_ERROR', error: message }, 502);
  }
});
