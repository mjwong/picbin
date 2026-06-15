import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestHandler } from './$types';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const albumId = formData.get('albumId') as string | null;
  const title = (formData.get('title') as string | null) || null;
  const description = (formData.get('description') as string | null) || null;

  if (!file) error(400, 'No file provided');
  if (!albumId) error(400, 'albumId is required');
  if (!ALLOWED_TYPES.has(file.type)) error(400, `Unsupported file type: ${file.type}`);
  if (file.size > MAX_BYTES) error(400, 'File exceeds 50 MB limit');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', albumId)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const photoId = crypto.randomUUID();
  const uid = locals.user.id;

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const originalPath = `${uid}/${photoId}/original.${ext}`;

  const { error: uploadErr } = await admin.storage
    .from('photos')
    .upload(originalPath, buffer, { contentType: file.type });

  if (uploadErr) {
    console.error('Storage upload error:', uploadErr);
    error(500, `Storage upload failed: ${uploadErr.message}`);
  }

  const { data: photo, error: dbErr } = await locals.supabase
    .from('photos')
    .insert({
      id: photoId,
      album_id: albumId,
      owner_id: uid,
      title,
      description,
      original_path: originalPath,
      thumb_800_path: originalPath,
      thumb_300_path: originalPath,
      exif_data: null,
    })
    .select()
    .single();

  if (dbErr) {
    console.error('DB insert error:', dbErr);
    await admin.storage.from('photos').remove([originalPath]);
    error(500, 'Failed to save photo metadata');
  }

  return json(photo, { status: 201 });
};
