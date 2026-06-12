import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) redirect(303, '/login');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id, title, description, visibility, owner_id, profiles!owner_id(username)')
    .eq('id', params.albumId)
    .eq('owner_id', locals.user.id)
    .single();

  if (!album) error(403, 'Album not found');

  const [{ data: shares }, { data: links }] = await Promise.all([
    locals.supabase
      .from('album_shares')
      .select('user_id, profiles!user_id(username, display_name)')
      .eq('album_id', params.albumId),
    locals.supabase
      .from('album_share_links')
      .select('id, token, expires_at')
      .eq('album_id', params.albumId),
  ]);

  return {
    album,
    shares: shares ?? [],
    links: links ?? [],
  };
};
