import { error } from '@sveltejs/kit';
import { adminSupabase } from '$lib/server/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { data: link } = await adminSupabase
    .from('photo_share_links')
    .select('photo_id')
    .eq('token', params.token)
    .single();

  if (!link) error(404, 'Share link not found or expired');

  const { data: photo } = await adminSupabase
    .from('photos')
    .select('*, profiles!owner_id(username, display_name), albums(title, id)')
    .eq('id', link.photo_id)
    .single();

  if (!photo) error(404, 'Photo not found');

  const { data: signed } = await adminSupabase.storage
    .from('photos')
    .createSignedUrl(photo.original_path, 3600);

  return {
    photo,
    token: params.token,
    signedUrl: signed?.signedUrl ?? null,
  };
};
