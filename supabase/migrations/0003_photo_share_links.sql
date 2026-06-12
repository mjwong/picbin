create table public.photo_share_links (
  id         uuid primary key default gen_random_uuid(),
  photo_id   uuid not null references public.photos(id) on delete cascade,
  token      text not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_at timestamptz default now() not null
);

alter table public.photo_share_links enable row level security;

-- Owner can manage their photo's share links
create policy "photo_share_links_owner_all" on public.photo_share_links
  for all using (
    exists (
      select 1 from photos where photos.id = photo_id and photos.owner_id = auth.uid()
    )
  );

-- Anyone can read (token is the secret)
create policy "photo_share_links_select_any" on public.photo_share_links
  for select using (true);
