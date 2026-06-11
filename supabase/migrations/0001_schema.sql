-- Extensions
create extension if not exists pgcrypto;

-- profiles
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz default now() not null
);

-- album visibility enum
create type public.album_visibility as enum ('public', 'restricted');

-- albums
create table public.albums (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  description    text,
  cover_photo_id uuid,
  visibility     public.album_visibility not null default 'public',
  created_at     timestamptz default now() not null
);

-- photos
create table public.photos (
  id             uuid primary key default gen_random_uuid(),
  album_id       uuid not null references public.albums(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id) on delete cascade,
  title          text,
  description    text,
  original_path  text not null,
  thumb_800_path text not null,
  thumb_300_path text not null,
  exif_data      jsonb,
  created_at     timestamptz default now() not null
);

-- cover_photo_id FK (after photos table exists to avoid circular dep)
alter table public.albums
  add constraint albums_cover_photo_id_fkey
  foreign key (cover_photo_id) references public.photos(id) on delete set null;

-- album_shares
create table public.album_shares (
  album_id uuid not null references public.albums(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (album_id, user_id)
);

-- album_share_links
create table public.album_share_links (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.albums(id) on delete cascade,
  token      text unique not null default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz
);

-- photo_likes
create table public.photo_likes (
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  primary key (photo_id, user_id)
);

-- photo_comments
create table public.photo_comments (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.photos(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz default now() not null
);

-- photo_tags
create table public.photo_tags (
  photo_id uuid not null references public.photos(id) on delete cascade,
  tag      text not null,
  primary key (photo_id, tag)
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'preferred_username',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage buckets
insert into storage.buckets (id, name, public) values ('photos', 'photos', false);
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

-- RLS
alter table public.profiles         enable row level security;
alter table public.albums            enable row level security;
alter table public.photos            enable row level security;
alter table public.album_shares      enable row level security;
alter table public.album_share_links enable row level security;
alter table public.photo_likes       enable row level security;
alter table public.photo_comments    enable row level security;
alter table public.photo_tags        enable row level security;

-- profiles
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = id);

-- albums
create policy "albums_select_public" on public.albums
  for select using (visibility = 'public');
create policy "albums_select_owner"  on public.albums
  for select using (auth.uid() = owner_id);
create policy "albums_select_shared" on public.albums
  for select using (
    visibility = 'restricted' and
    exists (select 1 from public.album_shares where album_id = albums.id and user_id = auth.uid())
  );
create policy "albums_insert_auth"   on public.albums
  for insert with check (auth.uid() = owner_id);
create policy "albums_update_owner"  on public.albums
  for update using (auth.uid() = owner_id);
create policy "albums_delete_owner"  on public.albums
  for delete using (auth.uid() = owner_id);

-- photos
create policy "photos_select_public_album" on public.photos
  for select using (
    exists (select 1 from public.albums where id = photos.album_id and visibility = 'public')
  );
create policy "photos_select_owner" on public.photos
  for select using (auth.uid() = owner_id);
create policy "photos_select_shared_album" on public.photos
  for select using (
    exists (select 1 from public.album_shares where album_id = photos.album_id and user_id = auth.uid())
  );
create policy "photos_insert_auth"  on public.photos
  for insert with check (auth.uid() = owner_id);
create policy "photos_update_owner" on public.photos
  for update using (auth.uid() = owner_id);
create policy "photos_delete_owner" on public.photos
  for delete using (auth.uid() = owner_id);

-- album_shares
create policy "album_shares_select_own" on public.album_shares
  for select using (user_id = auth.uid());
create policy "album_shares_all_album_owner" on public.album_shares
  for all using (
    exists (select 1 from public.albums where id = album_shares.album_id and owner_id = auth.uid())
  );

-- album_share_links
create policy "album_share_links_all_album_owner" on public.album_share_links
  for all using (
    exists (select 1 from public.albums where id = album_share_links.album_id and owner_id = auth.uid())
  );

-- photo_likes
create policy "photo_likes_select_all"   on public.photo_likes for select using (true);
create policy "photo_likes_insert_auth"  on public.photo_likes for insert with check (auth.uid() = user_id);
create policy "photo_likes_delete_own"   on public.photo_likes for delete using (auth.uid() = user_id);

-- photo_comments
create policy "photo_comments_select_all"  on public.photo_comments for select using (true);
create policy "photo_comments_insert_auth" on public.photo_comments for insert with check (auth.uid() = user_id);
create policy "photo_comments_delete_own"  on public.photo_comments for delete using (auth.uid() = user_id);

-- photo_tags
create policy "photo_tags_select_all"        on public.photo_tags for select using (true);
create policy "photo_tags_all_photo_owner"   on public.photo_tags
  for all using (
    exists (select 1 from public.photos where id = photo_tags.photo_id and owner_id = auth.uid())
  );

-- Storage policies: photos bucket (private, owner path prefix)
create policy "photos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "photos_storage_select" on storage.objects
  for select using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "photos_storage_delete" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: thumbnails bucket (public read, authenticated write)
create policy "thumbnails_storage_public_read" on storage.objects
  for select using (bucket_id = 'thumbnails');
create policy "thumbnails_storage_auth_insert" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');
create policy "thumbnails_storage_owner_delete" on storage.objects
  for delete using (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);
