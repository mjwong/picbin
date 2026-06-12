import { error } from '@sveltejs/kit';
import { canViewAlbum } from '$lib/server/access';
import { adminSupabase } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const token = url.searchParams.get('token');
  const allowed = await canViewAlbum(
    locals.supabase,
    params.albumId,
    locals.user?.id ?? null,
    token
  );
  if (!allowed) error(403, 'Access denied');

  // Use admin client: canViewAlbum already verified access; RLS blocks anon on restricted albums.
  const { data: album } = await adminSupabase
    .from('albums')
    .select('id, title, description, visibility, owner_id, profiles!owner_id(username, display_name)')
    .eq('id', params.albumId)
    .single();

  if (!album) error(404, 'Album not found');

  const { data: photos } = await adminSupabase
    .from('photos')
    .select('id, title, thumb_300_path, created_at')
    .eq('album_id', params.albumId)
    .order('created_at', { ascending: false });

  const isOwner = locals.user?.id === album.owner_id;

  return { album, photos: photos ?? [], isOwner, token };
};
