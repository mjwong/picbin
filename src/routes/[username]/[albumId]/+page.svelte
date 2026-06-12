<script lang="ts">
  import type { PageData } from './$types';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';

  let { data }: { data: PageData } = $props();
  const { album, photos, isOwner, token } = data as any;

  function thumbUrl(path: string) {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
  }
</script>

<h1>{album.title}</h1>
{#if album.description}<p>{album.description}</p>{/if}

{#if isOwner}
  <a href="/albums/{album.id}/settings">⚙ Settings</a>
  <a href="/upload?albumId={album.id}">+ Upload Photos</a>
{/if}

{#if photos.length === 0}
  <p>No photos yet.</p>
{:else}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.5rem;margin-top:1rem">
    {#each photos as photo}
      <a href="{photo.id}{token ? `?token=${token}` : ''}">
        <img src={thumbUrl(photo.thumb_300_path)} alt={photo.title ?? ''} style="width:100%;height:200px;object-fit:cover" />
      </a>
    {/each}
  </div>
{/if}
