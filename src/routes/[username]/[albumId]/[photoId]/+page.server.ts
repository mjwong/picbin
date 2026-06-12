import { error } from '@sveltejs/kit';
import { canViewAlbum } from '$lib/server/access';
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

  const { data: photo } = await locals.supabase
    .from('photos')
    .select('*')
    .eq('id', params.photoId)
    .eq('album_id', params.albumId)
    .single();

  if (!photo) error(404, 'Photo not found');

  const [{ data: comments }, { data: likes }, { data: tags }] = await Promise.all([
    locals.supabase
      .from('photo_comments')
      .select('id, body, created_at, profiles!user_id(username, display_name)')
      .eq('photo_id', params.photoId)
      .order('created_at', { ascending: true }),
    locals.supabase
      .from('photo_likes')
      .select('user_id')
      .eq('photo_id', params.photoId),
    locals.supabase
      .from('photo_tags')
      .select('tag')
      .eq('photo_id', params.photoId),
  ]);

  // Generate signed URL for original (private bucket)
  const { data: signed } = await locals.supabase.storage
    .from('photos')
    .createSignedUrl(photo.original_path, 3600);

  const isOwner = locals.user?.id === photo.owner_id;
  const userLiked = !!locals.user && (likes ?? []).some((l: any) => l.user_id === locals.user!.id);

  return {
    photo,
    signedUrl: signed?.signedUrl ?? null,
    comments: comments ?? [],
    likeCount: (likes ?? []).length,
    userLiked,
    tags: (tags ?? []).map((t: any) => t.tag),
    isOwner,
    token,
  };
};
