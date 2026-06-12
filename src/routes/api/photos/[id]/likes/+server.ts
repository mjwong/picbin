import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { data: existing } = await locals.supabase
    .from('photo_likes')
    .select('photo_id')
    .eq('photo_id', params.id)
    .eq('user_id', locals.user.id)
    .single();

  if (existing) {
    await locals.supabase
      .from('photo_likes')
      .delete()
      .eq('photo_id', params.id)
      .eq('user_id', locals.user.id);
    return json({ liked: false });
  } else {
    await locals.supabase
      .from('photo_likes')
      .insert({ photo_id: params.id, user_id: locals.user.id });
    return json({ liked: true });
  }
};
