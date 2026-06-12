import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  await locals.supabase
    .from('album_shares')
    .delete()
    .eq('album_id', params.id)
    .eq('user_id', params.userId);

  return new Response(null, { status: 204 });
};
