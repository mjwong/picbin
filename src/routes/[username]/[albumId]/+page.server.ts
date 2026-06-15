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

  const photoList = await adminSupabase
    .from('photos')
    .select('id, title, thumb_300_path, thumb_800_path, created_at')
    .eq('album_id', params.albumId)
    .order('created_at', { ascending: false });

  const photos = photoList.data ?? [];
  const photoIds = photos.map((p: any) => p.id);

  const { data: tagRows } = photoIds.length
    ? await adminSupabase.from('photo_tags').select('photo_id, tag').in('photo_id', photoIds)
    : { data: [] };

  const tagMap: Record<string, string[]> = {};
  for (const row of tagRows ?? []) {
    const r = row as any;
    tagMap[r.photo_id] = [...(tagMap[r.photo_id] ?? []), r.tag];
  }

  const photosWithTags = photos.map((p: any) => ({ ...p, tags: tagMap[p.id] ?? [] }));
  const allTags = [...new Set((tagRows ?? []).map((r: any) => r.tag))].sort();

  const isOwner = locals.user?.id === album.owner_id;

  return { album, photos: photosWithTags, isOwner, token, allTags };
};
