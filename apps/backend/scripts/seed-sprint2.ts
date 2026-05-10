import '../src/env.js';
import { getServiceSupabaseClient } from '../src/services/supabase.js';

const supabase = getServiceSupabaseClient();

if (!supabase) {
  console.error('Supabase env is missing. Check apps/backend/.env.local.');
  process.exit(1);
}

const password = process.env.DEV_TEST_PASSWORD ?? 'ChangeMe123!';
const h3Cell = process.env.DEV_H3_CELL ?? '8928308280fffff';

type SeedUser = {
  email: string;
  username: string;
  displayName: string;
  role?: 'user' | 'moderator' | 'admin';
};

const users: SeedUser[] = [
  {
    email: process.env.DEV_TEST_EMAIL ?? 'dev@pitlane.test',
    username: 'dev_driver',
    displayName: 'Pitlane Dev Driver',
  },
  {
    email: process.env.DEV_HELPER_EMAIL ?? 'helper@pitlane.test',
    username: 'dev_helper',
    displayName: 'Pitlane Dev Helper',
  },
  {
    email: process.env.DEV_BUSINESS_EMAIL ?? 'business@pitlane.test',
    username: 'dev_business',
    displayName: 'Pitlane Dev Business',
  },
];

async function ensureUser(seed: SeedUser): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: seed.email,
    password,
    email_confirm: true,
    user_metadata: {
      username: seed.username,
      full_name: seed.displayName,
    },
  });

  if (!error && data.user) {
    await upsertProfile(data.user.id, seed);
    return data.user.id;
  }

  if (!error?.message.toLowerCase().includes('already')) {
    throw error;
  }

  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = existingUsers.users.find((user) => user.email === seed.email);
  if (!existing) throw new Error(`Existing seed user not found: ${seed.email}`);

  await upsertProfile(existing.id, seed);
  return existing.id;
}

async function upsertProfile(userId: string, seed: SeedUser) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        username: seed.username,
        display_name: seed.displayName,
        role: seed.role ?? 'user',
        is_verified: true,
      },
      { onConflict: 'id' },
    );

  if (error) throw error;
}

async function seedVehicle(userId: string): Promise<string> {
  await supabase
    .from('vehicles')
    .delete()
    .eq('user_id', userId)
    .eq('make', 'BMW')
    .eq('model', 'E30');

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      user_id: userId,
      type: 'car',
      make: 'BMW',
      model: 'E30',
      year: 1989,
      color: 'red',
      is_primary: true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

async function seedFlares(driverId: string) {
  const title = '[DEV] Pitlane Cars & Coffee';
  await supabase.from('flares').delete().eq('creator_id', driverId).eq('title', title);

  const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const endsAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('flares').insert({
    creator_id: driverId,
    title,
    description: 'Seed data for Sprint 2 map testing.',
    h3_cell: h3Cell,
    starts_at: startsAt,
    ends_at: endsAt,
    rsvp_count: 1,
    status: 'active',
  });

  if (error) throw error;
}

async function seedBusinessPins(businessId: string) {
  await supabase.from('business_pins').delete().eq('owner_id', businessId).in('name', [
    '[DEV] Pit Garage',
    '[DEV] Pit Stop Detailing',
  ]);

  const { error } = await supabase.from('business_pins').insert([
    {
      owner_id: businessId,
      name: '[DEV] Pit Garage',
      category: 'garage',
      h3_cell: h3Cell,
      address: 'Maslak, Istanbul',
      phone: '+905551112233',
      website: 'https://pitlane.test',
      is_verified: true,
      is_active: true,
      campaign_text: 'Bugün fren bakımında indirim',
      campaign_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      owner_id: businessId,
      name: '[DEV] Pit Stop Detailing',
      category: 'other',
      h3_cell: h3Cell,
      address: 'Ayazaga, Istanbul',
      is_verified: false,
      is_active: true,
    },
  ]);

  if (error) throw error;
}

async function seedHelpRequest(driverId: string, vehicleId: string) {
  const description = '[DEV] Akü bitti, yakın yardım gerekli.';
  await supabase.from('help_requests').delete().eq('requester_id', driverId).eq('description', description);

  const { error } = await supabase.from('help_requests').insert({
    requester_id: driverId,
    vehicle_id: vehicleId,
    h3_cell: h3Cell,
    issue_type: 'breakdown',
    description,
    status: 'open',
  });

  if (error) throw error;
}

async function main() {
  const [driverId, , businessId] = await Promise.all(users.map(ensureUser));
  const vehicleId = await seedVehicle(driverId);

  await Promise.all([
    seedFlares(driverId),
    seedBusinessPins(businessId),
    seedHelpRequest(driverId, vehicleId),
  ]);

  console.log(`Seeded Sprint 2 map data in H3 cell ${h3Cell}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
