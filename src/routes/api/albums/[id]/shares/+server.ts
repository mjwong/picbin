import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { usernameOrEmail } = await request.json() as { usernameOrEmail: string };
  if (!usernameOrEmail?.trim()) error(400, 'usernameOrEmail is required');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  const { data: target } = await locals.supabase
    .from('profiles')
    .select('id')
    .eq('username', usernameOrEmail.trim())
    .single();
  if (!target) error(404, 'User not found');

  const { error: dbErr } = await locals.supabase
    .from('album_shares')
    .upsert({ album_id: params.id, user_id: target.id });
  if (dbErr) error(500, dbErr.message);

  return json({ user_id: target.id }, { status: 201 });
};
