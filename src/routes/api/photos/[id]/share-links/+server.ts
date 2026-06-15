import { json, error } from '@sveltejs/kit';
import { adminSupabase } from '$lib/server/admin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { data: photo } = await adminSupabase
    .from('photos')
    .select('owner_id')
    .eq('id', params.id)
    .single();

  if (!photo) error(404, 'Photo not found');
  if (photo.owner_id !== locals.user.id) error(403, 'Forbidden');

  const { data: link, error: err } = await locals.supabase
    .from('photo_share_links')
    .insert({ photo_id: params.id })
    .select('id, token')
    .single();

  if (err) error(500, err.message);
  return json(link);
};
