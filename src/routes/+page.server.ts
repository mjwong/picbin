import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: albums } = await locals.supabase
    .from('albums')
    .select('id, title, description, visibility, created_at, profiles!owner_id(username, display_name)')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(24);

  return { albums: albums ?? [] };
};
