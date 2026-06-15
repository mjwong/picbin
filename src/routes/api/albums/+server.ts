import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');

  const body = await request.json();
  const { title, description, visibility } = body as {
    title: string;
    description?: string;
    visibility: 'public' | 'restricted';
  };

  if (!title?.trim()) error(400, 'Title is required');
  if (!['public', 'restricted'].includes(visibility)) error(400, 'Invalid visibility');

  const { data, error: dbErr } = await locals.supabase
    .from('albums')
    .insert({ owner_id: locals.user.id, title: title.trim(), description: description ?? null, visibility })
    .select()
    .single();

  if (dbErr) {
    if (dbErr.code === '23503') error(400, 'Profile not found — please log out and log back in');
    error(500, dbErr.message);
  }
  return json(data, { status: 201 });
};
