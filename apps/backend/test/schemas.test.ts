import { describe, expect, it } from 'vitest';
import { JoinWaitingListSchema, ValidateInviteCodeSchema } from '../src/schemas/auth.schema.js';
import { CreateCommunitySchema, UpdateCommunitySchema } from '../src/schemas/community.schema.js';
import { CreateFlareSchema, RsvpFlareSchema, UpdateFlareSchema } from '../src/schemas/flare.schema.js';
import { CreateHelpSchema } from '../src/schemas/help.schema.js';
import { MapNearbyQuerySchema, MapPinsQuerySchema } from '../src/schemas/map.schema.js';
import { UploadUrlSchema } from '../src/schemas/media.schema.js';
import { SendMessageSchema } from '../src/schemas/message.schema.js';
import { CreateReportSchema, UserIdParamSchema } from '../src/schemas/moderation.schema.js';
import { RegisterDeviceSchema } from '../src/schemas/notification.schema.js';
import {
  CreatePinSchema,
  StartCampaignSchema,
  TaxDocumentFinalizeSchema,
  TaxDocumentUploadUrlSchema,
  UpdatePinSchema,
} from '../src/schemas/pin.schema.js';
import { CreateVehicleSchema, UpdateProfileSchema } from '../src/schemas/profile.schema.js';
import {
  V2CreateCommentSchema,
  V2CreateCommunityRoleSchema,
  V2CreatePostSchema,
  V2CreateStorySchema,
  V2FollowListQuerySchema,
  V2PrivacySchema,
  V2UpdateCommunityRoleSchema,
} from '../src/schemas/v2-social.schema.js';

describe('auth schemas', () => {
  it('normalizes invite codes', () => {
    const parsed = ValidateInviteCodeSchema.parse({ code: ' rollpit ' });
    expect(parsed.code).toBe('ROLLPIT');
  });

  it('normalizes waiting list emails', () => {
    const parsed = JoinWaitingListSchema.parse({
      email: 'TEST@ROLLPIT.COM',
      vehicle_type: 'car',
      city: 'Istanbul',
    });
    expect(parsed.email).toBe('test@rollpit.com');
  });
});

describe('profile schemas', () => {
  it('accepts a valid profile update', () => {
    const parsed = UpdateProfileSchema.parse({ display_name: 'Erol', ghost_mode: true });
    expect(parsed.ghost_mode).toBe(true);
  });

  it('accepts notification preferences on profile update', () => {
    const parsed = UpdateProfileSchema.parse({
      notification_prefs: {
        dm_new: true,
        community_message: false,
        quiet_hours_start: '23:00',
        quiet_hours_end: '08:00',
      },
    });

    expect(parsed.notification_prefs?.dm_new).toBe(true);
  });

  it('rejects invalid quiet hour values', () => {
    expect(UpdateProfileSchema.safeParse({
      notification_prefs: { quiet_hours_start: '25:99' },
    }).success).toBe(false);
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

describe('v2 social schemas', () => {
  it('accepts profile privacy settings', () => {
    const parsed = V2PrivacySchema.parse({
      is_private: true,
      location_share_mode: 'followers',
      bio_extended: 'Garaj ve pist notları.',
    });

    expect(parsed.location_share_mode).toBe('followers');
  });

  it('requires at least one privacy field', () => {
    expect(V2PrivacySchema.safeParse({}).success).toBe(false);
  });

  it('bounds follow list pagination', () => {
    const parsed = V2FollowListQuerySchema.parse({
      user_id: '00000000-0000-4000-8000-000000000001',
      limit: '50',
    });

    expect(parsed.limit).toBe(50);
    expect(V2FollowListQuerySchema.safeParse({
      user_id: '00000000-0000-4000-8000-000000000001',
      limit: '51',
    }).success).toBe(false);
  });

  it('accepts post drafts with caption or media', () => {
    expect(V2CreatePostSchema.parse({ caption: 'Pist gunu', visibility: 'followers' }).visibility).toBe('followers');
    expect(V2CreatePostSchema.safeParse({
      media_id: '00000000-0000-4000-8000-000000000001',
    }).success).toBe(true);
    expect(V2CreatePostSchema.safeParse({ visibility: 'public' }).success).toBe(false);
  });

  it('bounds comment bodies', () => {
    expect(V2CreateCommentSchema.parse({ body: 'Harika!' }).body).toBe('Harika!');
    expect(V2CreateCommentSchema.safeParse({ body: '' }).success).toBe(false);
    expect(V2CreateCommentSchema.safeParse({ body: 'x'.repeat(501) }).success).toBe(false);
  });

  it('accepts bounded story drafts', () => {
    expect(V2CreateStorySchema.parse({
      media_id: '00000000-0000-4000-8000-000000000001',
    }).audience).toBe('followers');
    expect(V2CreateStorySchema.safeParse({
      media_id: '00000000-0000-4000-8000-000000000001',
      expires_at: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    }).success).toBe(false);
  });

  it('accepts community role permissions', () => {
    const parsed = V2CreateCommunityRoleSchema.parse({
      name: 'Meet Host',
      permissions: { can_invite: true, can_create_event: true },
      rank_order: 25,
    });

    expect(parsed.permissions.can_create_event).toBe(true);
    expect(V2CreateCommunityRoleSchema.safeParse({
      name: 'Bad',
      permissions: { can_delete_everything: true },
    }).success).toBe(false);
    expect(V2UpdateCommunityRoleSchema.safeParse({}).success).toBe(false);
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

describe('pin schemas', () => {
  it('accepts a valid business pin', () => {
    const parsed = CreatePinSchema.parse({
      name: 'Pit Garage',
      category: 'garage',
      h3_cell: '8928308280fffff',
    });

    expect(parsed.category).toBe('garage');
  });

  it('requires update payloads to include a field', () => {
    expect(UpdatePinSchema.safeParse({}).success).toBe(false);
  });

  it('requires campaign end to be in the next 30 days', () => {
    const validEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const tooLateEnd = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

    expect(StartCampaignSchema.safeParse({
      campaign_text: 'Bugun fren bakımında indirim',
      campaign_ends_at: validEnd,
    }).success).toBe(true);
    expect(StartCampaignSchema.safeParse({
      campaign_text: 'Bugun fren bakımında indirim',
      campaign_ends_at: tooLateEnd,
    }).success).toBe(false);
  });

  it('accepts tax document uploads with bounded content types', () => {
    expect(TaxDocumentUploadUrlSchema.safeParse({
      filename: 'vergi-levhasi.pdf',
      content_type: 'application/pdf',
      size_bytes: 2_000_000,
    }).success).toBe(true);
    expect(TaxDocumentUploadUrlSchema.safeParse({
      filename: 'vergi.exe',
      content_type: 'application/octet-stream',
      size_bytes: 2_000_000,
    }).success).toBe(false);
  });

  it('accepts tax document finalize payloads', () => {
    const parsed = TaxDocumentFinalizeSchema.parse({
      storage_key: 'business-tax-documents/pin/user/doc.pdf',
      content_type: 'application/pdf',
    });

    expect(parsed.content_type).toBe('application/pdf');
  });
});

describe('help schemas', () => {
  it('accepts a valid help request', () => {
    const parsed = CreateHelpSchema.parse({
      h3_cell: '8928308280fffff',
      issue_type: 'flat_tire',
      description: 'Lastik patladı',
    });

    expect(parsed.issue_type).toBe('flat_tire');
  });

  it('rejects long help descriptions', () => {
    expect(CreateHelpSchema.safeParse({
      h3_cell: '8928308280fffff',
      issue_type: 'fuel',
      description: 'x'.repeat(301),
    }).success).toBe(false);
  });
});

describe('media schemas', () => {
  it('accepts valid photo upload requests', () => {
    const parsed = UploadUrlSchema.parse({
      filename: 'snap.jpg',
      content_type: 'image/jpeg',
      asset_type: 'photo',
      size_bytes: 512_000,
    });

    expect(parsed.asset_type).toBe('photo');
  });

  it('rejects media type mismatches', () => {
    expect(UploadUrlSchema.safeParse({
      filename: 'video.mp4',
      content_type: 'video/mp4',
      asset_type: 'photo',
      size_bytes: 1_000_000,
    }).success).toBe(false);
  });

  it('rejects oversized uploads', () => {
    expect(UploadUrlSchema.safeParse({
      filename: 'huge.mp4',
      content_type: 'video/mp4',
      asset_type: 'video',
      size_bytes: 101 * 1024 * 1024,
    }).success).toBe(false);
  });
});

describe('community schemas', () => {
  it('accepts a valid community draft', () => {
    const parsed = CreateCommunitySchema.parse({
      name: 'Istanbul Riders',
      slug: 'istanbul-riders',
      vehicle_type: 'motorcycle',
      city: 'Istanbul',
    });

    expect(parsed.type).toBe('public');
    expect(parsed.vehicle_type).toBe('motorcycle');
  });

  it('rejects invalid slugs', () => {
    expect(CreateCommunitySchema.safeParse({
      name: 'Bad Slug',
      slug: 'Bad Slug',
    }).success).toBe(false);
  });

  it('requires community update payloads to include a field', () => {
    expect(UpdateCommunitySchema.safeParse({}).success).toBe(false);
  });
});

describe('moderation schemas', () => {
  it('accepts a valid report', () => {
    const parsed = CreateReportSchema.parse({
      content_type: 'profile',
      content_id: '00000000-0000-4000-8000-000000000001',
      reason: 'spam',
    });

    expect(parsed.reason).toBe('spam');
  });

  it('accepts post and comment report targets', () => {
    expect(
      CreateReportSchema.safeParse({
        content_type: 'post',
        content_id: '00000000-0000-4000-8000-000000000001',
        reason: 'inappropriate',
      }).success,
    ).toBe(true);

    expect(
      CreateReportSchema.safeParse({
        content_type: 'comment',
        content_id: '00000000-0000-4000-8000-000000000001',
        reason: 'harassment',
      }).success,
    ).toBe(true);
  });

  it('validates block user params', () => {
    expect(UserIdParamSchema.safeParse({ userId: '00000000-0000-4000-8000-000000000001' }).success).toBe(true);
    expect(UserIdParamSchema.safeParse({ userId: 'bad-id' }).success).toBe(false);
  });
});

describe('notification schemas', () => {
  it('accepts valid push device registration', () => {
    const parsed = RegisterDeviceSchema.parse({
      platform: 'ios',
      token: 'rollpit-dev-device-token-ios',
      app_build: 'dev',
    });

    expect(parsed.platform).toBe('ios');
  });

  it('rejects short push tokens', () => {
    expect(RegisterDeviceSchema.safeParse({
      platform: 'android',
      token: 'short',
    }).success).toBe(false);
  });
});

describe('message schemas', () => {
  it('accepts text messages', () => {
    expect(SendMessageSchema.parse({ body: 'Selam' }).body).toBe('Selam');
  });

  it('requires text or media', () => {
    expect(SendMessageSchema.safeParse({}).success).toBe(false);
  });

  it('requires media type with media url', () => {
    expect(SendMessageSchema.safeParse({ media_url: 'https://rollpit.test/a.jpg' }).success).toBe(false);
  });
});
