import { Hono } from 'hono';
import type { AppEnv } from '../types/hono.js';

export const v2VehicleRoutes = new Hono<AppEnv>();

const VEHICLE_ICONS = [
  icon('motorcycle_standard', 'Standard', 'motorcycle'),
  icon('motorcycle_chopper', 'Chopper', 'motorcycle'),
  icon('motorcycle_sport', 'Sport', 'motorcycle'),
  icon('motorcycle_enduro', 'Enduro', 'motorcycle'),
  icon('motorcycle_scooter', 'Scooter', 'motorcycle'),
  icon('car_sedan', 'Sedan', 'car'),
  icon('car_suv', 'SUV', 'car'),
  icon('car_hatchback', 'Hatchback', 'car'),
  icon('car_pickup', 'Pickup', 'car'),
  icon('car_classic', 'Classic', 'car'),
  icon('car_sport', 'Sport', 'car'),
] as const;

v2VehicleRoutes.get('/icons', (c) => c.json({ data: VEHICLE_ICONS }));

function icon(slug: string, displayName: string, category: 'car' | 'motorcycle') {
  return {
    slug,
    display_name: displayName,
    category,
    asset_path: `assets/vehicle_icons/${slug}.svg`,
  };
}
