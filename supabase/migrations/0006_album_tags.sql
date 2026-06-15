create table public.album_tags (
  album_id uuid not null references public.albums(id) on delete cascade,
  tag      text not null check (char_length(trim(tag)) > 0),
  primary key (album_id, tag)
);

alter table public.album_tags enable row level security;

create policy "album_tags_owner_all" on public.album_tags
  for all using (
    exists (select 1 from albums where albums.id = album_id and albums.owner_id = auth.uid())
  );

create policy "album_tags_select_all" on public.album_tags
  for select using (true);
