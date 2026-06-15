import { fail, redirect } from '@sveltejs/kit';
import sharp from 'sharp';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { adminSupabase } from '$lib/server/admin';
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

  uploadAvatar: async ({ request, locals }) => {
    if (!locals.user) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;
    if (!file || !file.size) return fail(400, { avatarError: 'No file provided' });
    if (!file.type.startsWith('image/')) return fail(400, { avatarError: 'Must be an image' });

    const buffer = Buffer.from(await file.arrayBuffer());
    const resized = await sharp(buffer)
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const path = `${locals.user.id}/avatar.jpg`;
    const { error: upErr } = await adminSupabase.storage
      .from('avatars')
      .upload(path, resized, { upsert: true, contentType: 'image/jpeg' });

    if (upErr) return fail(500, { avatarError: upErr.message });

    const avatarUrl = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;
    const { error: dbErr } = await locals.supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', locals.user.id);

    if (dbErr) return fail(500, { avatarError: dbErr.message });
    return { avatarSuccess: true };
  },
};
