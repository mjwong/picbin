import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const body = await request.json();

  const { data, error: dbErr } = await locals.supabase
    .from('albums')
    .update(body)
    .eq('id', params.id)
    .eq('owner_id', locals.user.id)
    .select()
    .single();

  if (dbErr) error(500, dbErr.message);
  if (!data) error(404, 'Album not found');
  return json(data);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { error: dbErr } = await locals.supabase
    .from('albums')
    .delete()
    .eq('id', params.id)
    .eq('owner_id', locals.user.id);

  if (dbErr) error(500, dbErr.message);
  return new Response(null, { status: 204 });
};
