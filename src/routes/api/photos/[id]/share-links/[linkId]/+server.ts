import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { error: err } = await locals.supabase
    .from('photo_share_links')
    .delete()
    .eq('id', params.linkId)
    .eq('photo_id', params.id);

  if (err) error(500, err.message);
  return json({ ok: true });
};
