import type { SupabaseClient } from '@supabase/supabase-js';

export async function canViewAlbum(
  supabase: SupabaseClient,
  albumId: string,
  userId: string | null,
  token: string | null
): Promise<boolean> {
  const { data: album } = await supabase
    .from('albums')
    .select('owner_id, visibility')
    .eq('id', albumId)
    .single();

  if (!album) return false;
  if (album.visibility === 'public') return true;
  if (userId && userId === album.owner_id) return true;

  if (userId) {
    const { data: share } = await supabase
      .from('album_shares')
      .select('album_id')
      .eq('album_id', albumId)
      .eq('user_id', userId)
      .single();
    if (share) return true;
  }

  if (token) {
    const { data: link } = await supabase
      .from('album_share_links')
      .select('id, expires_at')
      .eq('album_id', albumId)
      .eq('token', token)
      .single();
    if (link && (!link.expires_at || new Date(link.expires_at) > new Date())) {
      return true;
    }
  }

  return false;
}
