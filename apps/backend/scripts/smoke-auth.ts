import '../src/env.js';
import { createApp } from '../src/app.js';
import { getAnonSupabaseClient, getServiceSupabaseClient } from '../src/services/supabase.js';

const email = process.env.DEV_TEST_EMAIL ?? 'dev@rollpit.test';
const password = process.env.DEV_TEST_PASSWORD ?? 'ChangeMe123!';
const username = `dev_${Date.now().toString(36)}`;

const admin = getServiceSupabaseClient();
const anon = getAnonSupabaseClient();

if (!admin || !anon) {
  console.error('Supabase env is missing. Check apps/backend/.env.local.');
  process.exit(1);
}

const app = createApp();

async function ensureUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: 'Rollpit Dev',
    },
  });

  if (!error && data.user) return data.user.id;

  if (!error?.message.toLowerCase().includes('already')) {
    throw error;
  }

  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = users.users.find((user) => user.email === email);
  if (!existing) throw new Error('Existing dev user not found after duplicate create response.');

  await admin
    .from('profiles')
    .update({ username, display_name: 'Rollpit Dev' })
    .eq('id', existing.id);

  return existing.id;
}

async function request(path: string, token: string, init?: RequestInit) {
  return app.request(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
}

async function main() {
  const userId = await ensureUser();
  const { data: session, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !session.session?.access_token) {
    throw signInError ?? new Error('Missing access token');
  }

  const token = session.session.access_token;

  const profileResponse = await request('/v1/profiles/me', token, {
    method: 'PATCH',
    body: JSON.stringify({ display_name: 'Rollpit Dev', bio: 'Backend smoke test user' }),
  });
  if (profileResponse.status !== 200) {
    throw new Error(`Profile update failed: ${profileResponse.status} ${await profileResponse.text()}`);
  }

  const vehicleResponse = await request('/v1/profiles/me/vehicles', token, {
    method: 'POST',
    body: JSON.stringify({
      type: 'car',
      make: 'BMW',
      model: 'E30',
      year: 1989,
      color: 'red',
      is_primary: true,
    }),
  });
  if (vehicleResponse.status !== 201) {
    throw new Error(`Vehicle create failed: ${vehicleResponse.status} ${await vehicleResponse.text()}`);
  }

  const profileByUsernameResponse = await request(`/v1/profiles/${username}`, token);
  if (profileByUsernameResponse.status !== 200) {
    throw new Error(
      `Profile lookup failed: ${profileByUsernameResponse.status} ${await profileByUsernameResponse.text()}`,
    );
  }

  const vehicle = await vehicleResponse.json();
  console.log(`Smoke auth passed for ${email} (${userId}), vehicle ${vehicle.data.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
