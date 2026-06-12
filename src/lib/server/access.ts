import type { SupabaseClient } from '@supabase/supabase-js';

export async function canViewAlbum(
  supabase: SupabaseClient,
  albumId: string,
  userId: string | null,
  token: string | null
): Promise<boolean> {
  const { data } = await supabase.rpc('can_view_album', {
    p_album_id: albumId,
    p_user_id: userId,
    p_token: token,
  });
  return data === true;
}
