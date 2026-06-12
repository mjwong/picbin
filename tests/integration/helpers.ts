import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY ?? '';

export const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

export async function createTestUser(email: string, password: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { preferred_username: email.split('@')[0].replace(/[^a-z0-9_]/g, '_') },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, session: data.session };
}

export async function cleanupUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId);
}
