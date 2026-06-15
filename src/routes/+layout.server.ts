import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  let profile: { display_name: string | null; avatar_url: string | null } | null = null;

  if (locals.user) {
    const { data } = await locals.supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', locals.user.id)
      .single();
    profile = data;
  }

  return {
    session: locals.session,
    user: locals.user,
    profile,
  };
};
