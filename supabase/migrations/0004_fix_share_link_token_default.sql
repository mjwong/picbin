alter table public.photo_share_links
  alter column token set default translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
