import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio')
    .eq('username', params.username)
    .single();

  if (!profile) error(404, 'User not found');

  const isOwner = locals.user?.id === profile.id;

  const query = locals.supabase
    .from('albums')
    .select('id, title, description, visibility, created_at')
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false });

  if (!isOwner) query.eq('visibility', 'public');

  const { data: albums } = await query;

  return { profile, albums: albums ?? [], isOwner };
};
