import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { data: comment } = await locals.supabase
    .from('photo_comments')
    .select('user_id, photo_id')
    .eq('id', params.id)
    .single();

  if (!comment) error(404, 'Comment not found');

  const isAuthor = comment.user_id === locals.user.id;

  let isPhotoOwner = false;
  if (!isAuthor) {
    const { data: photo } = await locals.supabase
      .from('photos')
      .select('owner_id')
      .eq('id', comment.photo_id)
      .single();
    isPhotoOwner = photo?.owner_id === locals.user.id;
  }

  if (!isAuthor && !isPhotoOwner) error(403, 'Forbidden');

  await locals.supabase.from('photo_comments').delete().eq('id', params.id);
  return new Response(null, { status: 204 });
};
