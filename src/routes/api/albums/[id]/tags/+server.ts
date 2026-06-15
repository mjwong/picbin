import { json, error } from '@sveltejs/kit';
import { adminSupabase } from '$lib/server/admin';
import type { RequestHandler } from './$types';

async function verifyOwner(albumId: string, userId: string) {
  const { data } = await adminSupabase.from('albums').select('owner_id').eq('id', albumId).single();
  if (!data) error(404, 'Album not found');
  if (data.owner_id !== userId) error(403, 'Forbidden');
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');
  await verifyOwner(params.id, locals.user.id);

  const { tag } = await request.json() as { tag: string };
  const cleaned = tag?.trim().toLowerCase();
  if (!cleaned) error(400, 'Tag required');

  const { error: dbErr } = await locals.supabase
    .from('album_tags')
    .upsert({ album_id: params.id, tag: cleaned });

  if (dbErr) error(500, dbErr.message);
  return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');
  await verifyOwner(params.id, locals.user.id);

  const { tag } = await request.json() as { tag: string };
  if (!tag) error(400, 'Tag required');

  const { error: dbErr } = await locals.supabase
    .from('album_tags')
    .delete()
    .eq('album_id', params.id)
    .eq('tag', tag);

  if (dbErr) error(500, dbErr.message);
  return new Response(null, { status: 204 });
};
