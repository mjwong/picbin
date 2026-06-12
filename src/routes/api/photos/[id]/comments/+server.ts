import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const { body: commentBody } = await request.json() as { body: string };
  if (!commentBody?.trim()) error(400, 'Comment body is required');

  const { data, error: dbErr } = await locals.supabase
    .from('photo_comments')
    .insert({
      photo_id: params.id,
      user_id: locals.user.id,
      body: commentBody.trim(),
    })
    .select()
    .single();

  if (dbErr) error(500, dbErr.message);
  return json(data, { status: 201 });
};
