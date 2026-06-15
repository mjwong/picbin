import { json, error } from '@sveltejs/kit';
import sharp from 'sharp';
import { adminSupabase } from '$lib/server/admin';
import { processImage } from '$lib/server/image';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const body = await request.json() as {
    title?: string;
    description?: string;
    addTag?: string;
    removeTag?: string;
    rotate?: number;
  };

  // Rotate image bytes server-side
  if (body.rotate) {
    const { data: photo } = await adminSupabase
      .from('photos')
      .select('original_path, thumb_800_path, thumb_300_path, owner_id')
      .eq('id', params.id)
      .single();

    if (!photo) error(404, 'Photo not found');
    if (photo.owner_id !== locals.user.id) error(403, 'Forbidden');

    const { data: blob, error: dlErr } = await adminSupabase.storage
      .from('photos')
      .download(photo.original_path);
    if (dlErr || !blob) error(500, 'Failed to download original');

    const originalBuffer = Buffer.from(await blob.arrayBuffer());
    const rotatedBuffer = await sharp(originalBuffer)
      .rotate()
      .rotate(body.rotate)
      .jpeg({ quality: 95 })
      .toBuffer();

    const { thumb800, thumb300 } = await processImage(rotatedBuffer);

    // New thumbnail paths to bust CDN cache (public bucket ignores query params)
    const dir = photo.thumb_800_path.split('/').slice(0, -1).join('/');
    const ts = Date.now();
    const new800 = `${dir}/800_${ts}.jpg`;
    const new300 = `${dir}/300_${ts}.jpg`;

    await Promise.all([
      adminSupabase.storage.from('photos').upload(photo.original_path, rotatedBuffer, {
        upsert: true, contentType: 'image/jpeg',
      }),
      adminSupabase.storage.from('thumbnails').upload(new800, thumb800, { contentType: 'image/jpeg' }),
      adminSupabase.storage.from('thumbnails').upload(new300, thumb300, { contentType: 'image/jpeg' }),
    ]);

    // Update DB with new thumbnail paths
    await adminSupabase.from('photos').update({ thumb_800_path: new800, thumb_300_path: new300 }).eq('id', params.id);

    // Delete old thumbnail files (best-effort)
    adminSupabase.storage.from('thumbnails').remove([photo.thumb_800_path, photo.thumb_300_path]);

    return new Response(null, { status: 204 });
  }

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
