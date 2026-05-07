import { describe, expect, it } from 'vitest';
import { JoinWaitingListSchema, ValidateInviteCodeSchema } from '../src/schemas/auth.schema.js';
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
