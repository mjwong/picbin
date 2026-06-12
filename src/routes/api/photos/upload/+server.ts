import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { processImage } from '$lib/server/image';
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

  // Verify the user owns the album
  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', albumId)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  const buffer = Buffer.from(await file.arrayBuffer());

  let processed;
  try {
    processed = await processImage(buffer);
  } catch {
    error(422, 'Could not process image — ensure it is a valid JPEG, PNG, WebP, or GIF');
  }

  // Extract EXIF fields from Sharp metadata (non-fatal)
  let exifData: Record<string, unknown> | null = null;
  try {
    exifData = {
      width: processed.metadata.width,
      height: processed.metadata.height,
      format: processed.metadata.format,
      density: processed.metadata.density ?? null,
      space: processed.metadata.space ?? null,
      hasAlpha: processed.metadata.hasAlpha ?? false,
    };
  } catch {
    exifData = null;
  }

  // Service role client bypasses RLS for storage writes
  const admin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const photoId = crypto.randomUUID();
  const uid = locals.user.id;

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/gif' ? 'gif' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const originalPath = `${uid}/${photoId}/original.${ext}`;
  const path800 = `${uid}/${photoId}/800.jpg`;
  const path300 = `${uid}/${photoId}/300.jpg`;

  const [u1, u2, u3] = await Promise.all([
    admin.storage.from('photos').upload(originalPath, buffer, { contentType: file.type }),
    admin.storage.from('thumbnails').upload(path800, processed.thumb800, { contentType: 'image/jpeg' }),
    admin.storage.from('thumbnails').upload(path300, processed.thumb300, { contentType: 'image/jpeg' }),
  ]);

  if (u1.error || u2.error || u3.error) {
    await Promise.allSettled([
      admin.storage.from('photos').remove([originalPath]),
      admin.storage.from('thumbnails').remove([path800, path300]),
    ]);
    error(500, 'Storage upload failed');
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
      thumb_800_path: path800,
      thumb_300_path: path300,
      exif_data: exifData,
    })
    .select()
    .single();

  if (dbErr) {
    // Rollback storage if DB insert fails
    await Promise.allSettled([
      admin.storage.from('photos').remove([originalPath]),
      admin.storage.from('thumbnails').remove([path800, path300]),
    ]);
    error(500, 'Failed to save photo metadata');
  }

  return json(photo, { status: 201 });
};
