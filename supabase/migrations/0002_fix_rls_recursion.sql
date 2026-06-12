-- Break RLS recursion: albums_select_shared → album_shares → album_shares_all_album_owner → albums → ...
-- Security definer functions bypass RLS on their target table, cutting the cycle.

create or replace function public.user_has_album_share(p_album_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from album_shares where album_id = p_album_id and user_id = p_user_id);
$$;

create or replace function public.is_album_owner(p_album_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from albums where id = p_album_id and owner_id = p_user_id);
$$;

-- albums: replace shared-access policy with security definer call
drop policy "albums_select_shared" on public.albums;
create policy "albums_select_shared" on public.albums
  for select using (
    visibility = 'restricted' and
    public.user_has_album_share(id, auth.uid())
  );

-- album_shares: replace owner policy with security definer call
drop policy "album_shares_all_album_owner" on public.album_shares;
create policy "album_shares_all_album_owner" on public.album_shares
  for all using (public.is_album_owner(album_id, auth.uid()));
