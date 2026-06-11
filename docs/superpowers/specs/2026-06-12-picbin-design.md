# Picbin — Design Spec

**Date:** 2026-06-12  
**Status:** Approved

---

## Overview

Picbin is a multi-user photo sharing web app (Flickr-like) built with SvelteKit full-stack and Supabase. Users create albums, upload photos, and share them publicly or with restricted access via user grants or expiring share links.

---

## Architecture

```
Browser
  └── SvelteKit (Node adapter)
        ├── +page.svelte         — all UI (Svelte components)
        ├── +page.server.ts      — SSR load functions
        └── src/routes/api/      — REST endpoints

Supabase
  ├── Auth          — email/password + Google OAuth, session JWTs
  ├── PostgreSQL     — all relational data, RLS enforced
  └── Storage
        ├── photos/              — originals (private bucket, signed URLs)
        └── thumbnails/          — Sharp-generated (public bucket)
```

**Upload flow:**  
Browser POSTs multipart to `/api/photos/upload` → SvelteKit server reads file → Sharp generates 800px thumbnail + 300px preview → both stored in Supabase Storage → EXIF extracted and metadata inserted to DB → photo record returned.

---

## Data Model

```sql
-- Extends Supabase auth.users
profiles (
  id            uuid PK → auth.users.id,
  username      text UNIQUE NOT NULL,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz
)

albums (
  id             uuid PK,
  owner_id       uuid → profiles.id,
  title          text NOT NULL,
  description    text,
  cover_photo_id uuid → photos.id nullable,
  visibility     enum('public', 'restricted'),
  created_at     timestamptz
)

photos (
  id             uuid PK,
  album_id       uuid → albums.id,
  owner_id       uuid → profiles.id,
  title          text,
  description    text,
  original_path  text,        -- Supabase Storage path (private)
  thumb_800_path text,        -- public bucket
  thumb_300_path text,        -- public bucket
  exif_data      jsonb,
  created_at     timestamptz
)

album_shares (                 -- user-based restricted access
  album_id  uuid → albums.id,
  user_id   uuid → profiles.id,
  PRIMARY KEY (album_id, user_id)
)

album_share_links (            -- link-based restricted access
  id         uuid PK,
  album_id   uuid → albums.id,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz nullable
)

photo_likes (
  photo_id  uuid → photos.id,
  user_id   uuid → profiles.id,
  PRIMARY KEY (photo_id, user_id)
)

photo_comments (
  id         uuid PK,
  photo_id   uuid → photos.id,
  user_id    uuid → profiles.id,
  body       text NOT NULL,
  created_at timestamptz
)

photo_tags (
  photo_id  uuid → photos.id,
  tag       text,
  PRIMARY KEY (photo_id, tag)
)
```

---

## Sharing & Access Control

| Album state | Who can view |
|-------------|-------------|
| `public` | Anyone, no login required |
| `restricted` + user grant | Users listed in `album_shares` (must be logged in) |
| `restricted` + share link | Anyone with valid token in URL, no login required |

**Access check order** (runs on every album/photo load):

1. Album is `public` → allow
2. Viewer is album owner → allow
3. `album_shares` row exists for viewer's user ID → allow
4. Request carries `?token=<x>` matching a non-expired `album_share_links.token` → allow
5. Otherwise → 403

Rules 1–3 enforced by Supabase RLS at DB level. Rule 4 handled in SvelteKit server load — token validated server-side, never exposed to client.

Share link tokens: `crypto.randomUUID()`. Optional expiry. Owner revokes by deleting the row.

---

## Routes & API Surface

### Pages (SvelteKit SSR)

| Route | Description |
|-------|-------------|
| `/` | Home feed — public albums, recent activity |
| `/[username]` | User profile + album grid |
| `/[username]/[albumId]` | Album view — photo grid |
| `/[username]/[albumId]/[photoId]` | Photo detail — EXIF, comments, likes, tags |
| `/upload` | Upload photos to album (auth required) |
| `/albums/new` | Create album (auth required) |
| `/albums/[albumId]/settings` | Edit album, manage shares (owner only) |
| `/settings` | Profile settings |
| `/login` | Login page |
| `/register` | Registration page |

### API Routes

```
POST   /api/photos/upload                — multipart upload, Sharp processing
DELETE /api/photos/[id]                  — owner only
PATCH  /api/photos/[id]                  — update title/description/tags

POST   /api/albums                       — create album
PATCH  /api/albums/[id]                  — update metadata/visibility
DELETE /api/albums/[id]                  — owner only

POST   /api/albums/[id]/shares           — grant user access
DELETE /api/albums/[id]/shares/[userId]  — revoke user access
POST   /api/albums/[id]/links            — create share link (optional expiry)
DELETE /api/albums/[id]/links/[linkId]   — revoke share link

POST   /api/photos/[id]/likes            — toggle like
POST   /api/photos/[id]/comments         — add comment
DELETE /api/comments/[id]               — comment author or photo owner
```

---

## Image Processing

- **Library:** Sharp (server-side, runs in SvelteKit API route on upload)
- **Sizes generated:** 800px wide (album grid), 300px wide (preview/thumbnail)
- **Originals:** stored in private Supabase Storage bucket, served via signed URLs
- **Thumbnails:** stored in public Supabase Storage bucket, served directly
- **EXIF:** extracted with `exif-reader` or `sharp` metadata, stored as jsonb. Parse failures are non-fatal — photo saves with `exif_data: null`.

---

## Error Handling

- API routes return `{ error: string }` with appropriate HTTP status (400/401/403/404/500)
- Page-level errors use SvelteKit `error()` helper, rendered by `+error.svelte`
- Upload failures: Sharp errors caught, partial Supabase Storage uploads rolled back
- EXIF parse failures: non-fatal, `exif_data` stored as `null`

---

## Testing

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Sharp pipeline, EXIF extraction, access-check logic |
| Integration | Vitest + local Supabase | API routes against `supabase start` instance |
| E2E | Playwright | Upload flow, sharing flow, comment/like flow |

No mocking of Supabase in integration tests — local Supabase instance only.

---

## Tech Stack Summary

| Concern | Choice |
|---------|--------|
| Framework | SvelteKit (Node adapter) |
| Language | TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth — email/password + Google OAuth |
| Storage | Supabase Storage |
| Image processing | Sharp |
| Testing | Vitest + Playwright |
