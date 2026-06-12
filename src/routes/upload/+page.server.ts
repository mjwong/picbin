import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (!locals.user) redirect(303, '/login');

  const albumId = url.searchParams.get('albumId');
  if (!albumId) redirect(303, '/albums/new');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id, title, owner_id, profiles!owner_id(username)')
    .eq('id', albumId)
    .eq('owner_id', locals.user.id)
    .single();

  if (!album) error(403, 'Album not found');

  return { album };
};
