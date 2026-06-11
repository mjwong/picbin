export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_photo_id: string | null;
  visibility: 'public' | 'restricted';
  created_at: string;
}

export interface Photo {
  id: string;
  album_id: string;
  owner_id: string;
  title: string | null;
  description: string | null;
  original_path: string;
  thumb_800_path: string;
  thumb_300_path: string;
  exif_data: Record<string, unknown> | null;
  created_at: string;
}

export interface AlbumShareLink {
  id: string;
  album_id: string;
  token: string;
  expires_at: string | null;
}

export interface PhotoComment {
  id: string;
  photo_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { username: string; display_name: string | null };
}
