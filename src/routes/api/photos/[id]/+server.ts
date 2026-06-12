import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const body = await request.json() as {
    title?: string;
    description?: string;
    addTag?: string;
    removeTag?: string;
  };

  // Update photo fields
  if (body.title !== undefined || body.description !== undefined) {
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;

    const { error: dbErr } = await locals.supabase
      .from('photos')
      .update(update)
      .eq('id', params.id)
      .eq('owner_id', locals.user.id);

    if (dbErr) error(500, dbErr.message);
  }

  // Add tag
  if (body.addTag) {
    const { error: dbErr } = await locals.supabase
      .from('photo_tags')
      .upsert({ photo_id: params.id, tag: body.addTag });
    if (dbErr) error(500, dbErr.message);
  }

  // Remove tag
  if (body.removeTag) {
    const { error: dbErr } = await locals.supabase
      .from('photo_tags')
      .delete()
      .eq('photo_id', params.id)
      .eq('tag', body.removeTag);
    if (dbErr) error(500, dbErr.message);
  }

  return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  // Fetch paths before delete for storage cleanup
  const { data: photo } = await locals.supabase
    .from('photos')
    .select('original_path, thumb_800_path, thumb_300_path')
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .single();

  if (!photo) error(404, 'Photo not found');

  const { error: dbErr } = await locals.supabase
    .from('photos')
    .delete()
    .eq('id', params.id)
    .eq('owner_id', locals.user.id);

  if (dbErr) error(500, dbErr.message);

  // Clean up storage (best-effort)
  await Promise.allSettled([
    locals.supabase.storage.from('photos').remove([photo.original_path]),
    locals.supabase.storage.from('thumbnails').remove([photo.thumb_800_path, photo.thumb_300_path]),
  ]);

  return new Response(null, { status: 204 });
};
