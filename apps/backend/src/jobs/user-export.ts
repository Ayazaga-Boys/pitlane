import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabaseClient } from '../services/supabase.js';
import {
  buildUserExportArchive,
  uploadUserExportArchive,
  type UserExportDelivery,
} from '../services/user-export.js';

export interface RunUserExportJobInput {
  userId: string;
  generatedAt?: Date;
  supabase?: SupabaseClient | null;
}

export interface UserExportJobResult extends UserExportDelivery {
  user_id: string;
}

export async function runUserExportJob(input: RunUserExportJobInput): Promise<UserExportJobResult> {
  const supabase = input.supabase === undefined ? getServiceSupabaseClient() : input.supabase;
  if (!supabase) throw new Error('Supabase service client is not configured');

  const generatedAt = input.generatedAt ?? new Date();
  const archive = await buildUserExportArchive(supabase, input.userId, generatedAt);
  const delivery = await uploadUserExportArchive({ archive, generatedAt });

  return {
    user_id: input.userId,
    ...delivery,
  };
}
