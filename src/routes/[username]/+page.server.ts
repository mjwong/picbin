import { error } from '@sveltejs/kit';
import { adminSupabase } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('username', params.username)
    .single();

  if (!profile) error(404, 'User not found');

  const isOwner = locals.user?.id === profile.id;

  let query = adminSupabase
    .from('albums')
    .select('id, title, description, visibility, created_at, cover_photo_id, photos!albums_cover_photo_id_fkey(thumb_300_path)')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false });

  if (!isOwner) query = query.eq('visibility', 'public') as typeof query;

  const { data: albums } = await query;
  const albumList = albums ?? [];

  const { data: photoCounts } = await adminSupabase
    .from('photos')
    .select('album_id')
    .in('album_id', albumList.map((a: any) => a.id));

  const countMap: Record<string, number> = {};
  for (const row of photoCounts ?? []) {
    countMap[(row as any).album_id] = (countMap[(row as any).album_id] ?? 0) + 1;
  }

  const { data: tagRows } = await adminSupabase
    .from('album_tags')
    .select('album_id, tag')
    .in('album_id', albumList.map((a: any) => a.id));

  const tagMap: Record<string, string[]> = {};
  for (const row of tagRows ?? []) {
    const r = row as any;
    tagMap[r.album_id] = [...(tagMap[r.album_id] ?? []), r.tag];
  }

  const albumsWithCount = albumList.map((a: any) => ({
    ...a,
    photoCount: countMap[a.id] ?? 0,
    tags: tagMap[a.id] ?? [],
  }));

  const allTags = [...new Set((tagRows ?? []).map((r: any) => r.tag))].sort();

  return { profile, albums: albumsWithCount, isOwner, allTags };
};
