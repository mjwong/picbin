import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
  login: async ({ request, locals }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(400, { error: error.message });
    redirect(303, '/');
  },

  google: async ({ locals, url }) => {
    const { data, error } = await locals.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${url.origin}/auth/callback` },
    });
    if (error) return fail(400, { error: error.message });
    redirect(303, data.url);
  },

  logout: async ({ locals }) => {
    await locals.supabase.auth.signOut();
    redirect(303, '/login');
  },
};
