import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const raw = url.searchParams.get('next') ?? '/';
  const next = raw.startsWith('/') ? raw : '/';

  if (code) {
    await locals.supabase.auth.exchangeCodeForSession(code);
  }

  redirect(303, next);
};
