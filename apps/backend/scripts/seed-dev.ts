import '../src/env.js';
import { getServiceSupabaseClient } from '../src/services/supabase.js';

const supabase = getServiceSupabaseClient();

if (!supabase) {
  console.error('Supabase env is missing. Check apps/backend/.env.local.');
  process.exit(1);
}

const code = (process.env.DEV_INVITE_CODE ?? 'PITLANE').trim().toUpperCase();

const { error } = await supabase
  .from('invite_codes')
  .upsert(
    {
      code,
      max_uses: 50,
      uses_count: 0,
      expires_at: null,
    },
    { onConflict: 'code' },
  );

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Seeded invite code: ${code}`);
