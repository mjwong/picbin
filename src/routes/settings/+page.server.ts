import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');

  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('*')
    .eq('id', locals.user.id)
    .single();

  return { profile };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const display_name = (data.get('display_name') ?? '').toString().trim() || null;
    const bio = (data.get('bio') ?? '').toString().trim() || null;

    const { error } = await locals.supabase
      .from('profiles')
      .update({ display_name, bio })
      .eq('id', locals.user.id);

    if (error) return fail(500, { error: error.message });
    return { success: true };
  },
};
