import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const body = await request.json() as { expiresAt?: string };

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  const { data: link, error: dbErr } = await locals.supabase
    .from('album_share_links')
    .insert({
      album_id: params.id,
      expires_at: body.expiresAt ?? null,
    })
    .select()
    .single();

  if (dbErr) error(500, dbErr.message);
  return json(link, { status: 201 });
};

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { data: album } = await locals.supabase
    .from('albums')
    .select('id')
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .single();
  if (!album) error(403, 'Album not found or access denied');

  const { data: links } = await locals.supabase
    .from('album_share_links')
    .select('id, token, expires_at')
    .eq('album_id', params.id);

  return json(links ?? []);
};
