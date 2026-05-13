import '../src/env.js';
import { getServiceSupabaseClient } from '../src/services/supabase.js';

const supabase = getServiceSupabaseClient();

if (!supabase) {
  console.error('Supabase env is missing. Check apps/backend/.env.local.');
  process.exit(1);
}

const email = process.env.DEV_ADMIN_EMAIL ?? 'admin@rollpit.test';
const password = process.env.DEV_ADMIN_PASSWORD ?? 'AdminTest123!';
const username = process.env.DEV_ADMIN_USERNAME ?? 'admin';
const displayName = process.env.DEV_ADMIN_DISPLAY_NAME ?? 'Rollpit Admin';

async function findExistingUserId() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email === email)?.id;
}

async function ensureAdminUser() {
  const existingUserId = await findExistingUserId();

  if (existingUserId) {
    const { error } = await supabase.auth.admin.updateUserById(existingUserId, {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: displayName,
      },
    });

    if (error) throw error;
    return existingUserId;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      full_name: displayName,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Admin user was not returned by Supabase.');
  return data.user.id;
}

async function main() {
  const userId = await ensureAdminUser();

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        username,
        display_name: displayName,
        role: 'admin',
        is_verified: true,
      },
      { onConflict: 'id' },
    );

  if (error) throw error;

  console.log(`Seeded admin user: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
