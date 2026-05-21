import { describe, expect, it } from 'vitest';
import { JoinWaitingListSchema, ValidateInviteCodeSchema } from '../src/schemas/auth.schema.js';
import { CreateCommunitySchema, UpdateCommunitySchema } from '../src/schemas/community.schema.js';
import { CreateFlareSchema, RsvpFlareSchema, UpdateFlareSchema } from '../src/schemas/flare.schema.js';
import { CreateHelpSchema } from '../src/schemas/help.schema.js';
import { MapNearbyQuerySchema, MapPinsQuerySchema, V2MapHeatmapQuerySchema } from '../src/schemas/map.schema.js';
import { UploadUrlSchema } from '../src/schemas/media.schema.js';
import { SendMessageSchema } from '../src/schemas/message.schema.js';
import { CreateReportSchema, UserIdParamSchema } from '../src/schemas/moderation.schema.js';
import { RegisterDeviceSchema } from '../src/schemas/notification.schema.js';
import { V2CreateHelpSchema } from '../src/schemas/v2-help.schema.js';
import {
  CreatePinSchema,
  StartCampaignSchema,
  TaxDocumentFinalizeSchema,
  TaxDocumentUploadUrlSchema,
  UpdatePinSchema,
} from '../src/schemas/pin.schema.js';
import { CreateVehicleSchema, ProfileDeletionCancelTokenParamSchema, UpdateProfileSchema } from '../src/schemas/profile.schema.js';
import {
  V2BusinessApplicationDocumentSchema,
  V2BusinessLocationsNearbyQuerySchema,
  V2CreateBusinessApplicationSchema,
  V2RejectBusinessApplicationSchema,
} from '../src/schemas/v2-business.schema.js';
import {
  V2CreateCommentSchema,
  V2CreateCommunityEventSchema,
  V2CreateCommunityInviteSchema,
  V2CreateCommunityNeedSchema,
  V2CreateCommunityPollSchema,
  V2CreateCommunityRoleSchema,
  V2CreatePostSchema,
  V2CreateStorySchema,
  V2EventRsvpSchema,
  V2FollowListQuerySchema,
  V2PrivacySchema,
  V2RespondCommunityInviteSchema,
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

  it('accepts deletion cancel tokens', () => {
    expect(ProfileDeletionCancelTokenParamSchema.safeParse({
      token: 'a'.repeat(43),
    }).success).toBe(true);
    expect(ProfileDeletionCancelTokenParamSchema.safeParse({
      token: 'bad token',
    }).success).toBe(false);
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

  it('accepts community invite drafts and responses', () => {
    expect(V2CreateCommunityInviteSchema.parse({ type: 'code' }).mode).toBe('instant');
    expect(V2CreateCommunityInviteSchema.safeParse({
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    }).success).toBe(false);
    expect(V2RespondCommunityInviteSchema.parse({ response: 'accept' }).response).toBe('accept');
  });

  it('accepts community event drafts, RSVPs, and polls', () => {
    expect(V2CreateCommunityEventSchema.parse({
      title: 'Sunday Meet',
      starts_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      location_h3: '8928308280fffff',
    }).title).toBe('Sunday Meet');
    expect(V2CreateCommunityEventSchema.safeParse({
      title: 'Past',
      starts_at: new Date(Date.now() - 60_000).toISOString(),
    }).success).toBe(false);
    expect(V2EventRsvpSchema.parse({ response: 'maybe' }).response).toBe('maybe');
    expect(V2CreateCommunityPollSchema.parse({
      question: 'Where should we meet?',
      options: ['Garage', 'Track'],
    }).options).toHaveLength(2);
    expect(V2CreateCommunityPollSchema.safeParse({
      question: 'One option?',
      options: ['Only'],
    }).success).toBe(false);
  });

  it('accepts community tagged needs', () => {
    const parsed = V2CreateCommunityNeedSchema.parse({
      type: 'parts',
      urgency_color: 'red',
      body: 'Need a spare chain near the meet point.',
    });

    expect(parsed.urgency_color).toBe('red');
    expect(V2CreateCommunityNeedSchema.safeParse({
      type: 'fuel',
      urgency_color: 'blue',
      body: 'Need fuel',
    }).success).toBe(false);
    expect(V2CreateCommunityNeedSchema.safeParse({
      type: 'parts',
      urgency_color: 'yellow',
      body: '',
    }).success).toBe(false);
  });
});

describe('v2 business schemas', () => {
  it('accepts business applications and documents', () => {
    const parsed = V2CreateBusinessApplicationSchema.parse({
      business_name: 'Pit Garage',
      category: 'garage',
      h3_cell: '8928308280fffff',
      latitude: 41.0082,
      longitude: 28.9784,
      address: 'Istanbul paddock',
      working_hours: { monday: ['09:00', '18:00'] },
    });

    expect(parsed.category).toBe('garage');
    expect(V2CreateBusinessApplicationSchema.safeParse({
      business_name: 'Bad',
      category: 'garage',
      h3_cell: 'bad-cell',
      latitude: 91,
      longitude: 28.9784,
      address: 'Istanbul paddock',
    }).success).toBe(false);
    expect(V2BusinessApplicationDocumentSchema.safeParse({
      document_type: 'tax_license',
      filename: 'tax.pdf',
      content_type: 'application/pdf',
      size_bytes: 2_000_000,
    }).success).toBe(true);
    expect(V2BusinessApplicationDocumentSchema.safeParse({
      document_type: 'tax_license',
      filename: 'tax.exe',
      content_type: 'application/octet-stream',
      size_bytes: 2_000_000,
    }).success).toBe(false);
  });

  it('accepts business admin and nearby queries', () => {
    expect(V2RejectBusinessApplicationSchema.parse({ reason: 'Missing document' }).reason).toBe('Missing document');
    expect(V2RejectBusinessApplicationSchema.safeParse({ reason: '' }).success).toBe(false);
    const nearby = V2BusinessLocationsNearbyQuerySchema.parse({
      h3cell: '8928308280fffff',
      k: '3',
      category: 'repair',
    });

    expect(nearby.k).toBe(3);
    expect(V2BusinessLocationsNearbyQuerySchema.safeParse({
      h3cell: '8928308280fffff',
      k: '6',
    }).success).toBe(false);
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

  it('accepts v2 vehicle-filtered heatmap queries', () => {
    const parsed = V2MapHeatmapQuerySchema.parse({
      vehicle_type: 'motorcycle',
      bounds: '8828308281fffff,882830828dfffff',
    });

    expect(parsed.vehicle_type).toBe('motorcycle');
    expect(parsed.bounds).toHaveLength(2);
    expect(V2MapHeatmapQuerySchema.safeParse({ vehicle_type: 'truck' }).success).toBe(false);
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

  it('accepts targeted v2 help requests', () => {
    expect(V2CreateHelpSchema.parse({
      h3_cell: '8928308280fffff',
      issue_type: 'breakdown',
      target_type: 'followers',
      urgency: 'critical',
    }).target_type).toBe('followers');
    expect(V2CreateHelpSchema.safeParse({
      h3_cell: '8928308280fffff',
      issue_type: 'fuel',
      target_type: 'group',
    }).success).toBe(false);
    expect(V2CreateHelpSchema.safeParse({
      h3_cell: '8928308280fffff',
      issue_type: 'fuel',
      target_type: 'nearby',
      target_id: '00000000-0000-4000-8000-000000000001',
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
