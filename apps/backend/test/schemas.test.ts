import { describe, expect, it } from 'vitest';
import { JoinWaitingListSchema, ValidateInviteCodeSchema } from '../src/schemas/auth.schema.js';
import { CreateFlareSchema, RsvpFlareSchema, UpdateFlareSchema } from '../src/schemas/flare.schema.js';
import { MapNearbyQuerySchema, MapPinsQuerySchema } from '../src/schemas/map.schema.js';
import { CreateVehicleSchema, UpdateProfileSchema } from '../src/schemas/profile.schema.js';

describe('auth schemas', () => {
  it('normalizes invite codes', () => {
    const parsed = ValidateInviteCodeSchema.parse({ code: ' pitlane ' });
    expect(parsed.code).toBe('PITLANE');
  });

  it('normalizes waiting list emails', () => {
    const parsed = JoinWaitingListSchema.parse({
      email: 'TEST@PITLANE.APP',
      vehicle_type: 'car',
      city: 'Istanbul',
    });
    expect(parsed.email).toBe('test@pitlane.app');
  });
});

describe('profile schemas', () => {
  it('accepts a valid profile update', () => {
    const parsed = UpdateProfileSchema.parse({ display_name: 'Erol', ghost_mode: true });
    expect(parsed.ghost_mode).toBe(true);
  });

  it('rejects impossible vehicle years', () => {
    expect(() => CreateVehicleSchema.parse({
      type: 'car',
      make: 'BMW',
      model: 'E30',
      year: 1800,
    })).toThrow();
  });
});

describe('map schemas', () => {
  it('coerces nearby query k value', () => {
    const parsed = MapNearbyQuerySchema.parse({
      h3cell: '8928308280fffff',
      k: '3',
    });

    expect(parsed.k).toBe(3);
  });

  it('keeps map radius bounded', () => {
    expect(MapNearbyQuerySchema.safeParse({ h3cell: '8928308280fffff', k: '9' }).success).toBe(false);
  });

  it('validates optional pin category', () => {
    expect(MapPinsQuerySchema.safeParse({ h3cell: '8928308280fffff', category: 'garage' }).success).toBe(true);
    expect(MapPinsQuerySchema.safeParse({ h3cell: '8928308280fffff', category: 'mall' }).success).toBe(false);
  });
});

describe('flare schemas', () => {
  it('accepts a valid future flare', () => {
    const startsAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const parsed = CreateFlareSchema.parse({
      title: 'Cars and Coffee',
      h3_cell: '8928308280fffff',
      starts_at: startsAt,
    });

    expect(parsed.title).toBe('Cars and Coffee');
  });

  it('rejects flares starting too soon', () => {
    const startsAt = new Date(Date.now() + 60 * 1000).toISOString();

    expect(CreateFlareSchema.safeParse({
      title: 'Too soon',
      h3_cell: '8928308280fffff',
      starts_at: startsAt,
    }).success).toBe(false);
  });

  it('requires update payloads to include a field', () => {
    expect(UpdateFlareSchema.safeParse({}).success).toBe(false);
  });

  it('defaults RSVP status to going', () => {
    expect(RsvpFlareSchema.parse({}).status).toBe('going');
  });
});
