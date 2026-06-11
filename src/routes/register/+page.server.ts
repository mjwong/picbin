import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) redirect(303, '/');
};

export const actions: Actions = {
  register: async ({ request, locals, url }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const username = (data.get('username') as string).trim().toLowerCase();

    if (!username.match(/^[a-z0-9_]{3,30}$/)) {
      return fail(400, { error: 'Username must be 3–30 chars, letters/numbers/underscores only' });
    }

    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { preferred_username: username },
        emailRedirectTo: `${url.origin}/auth/callback`,
      },
    });

    if (error) return fail(400, { error: error.message });
    return { success: true };
  },
};
