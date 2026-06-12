<script lang="ts">
  import type { PageData } from './$types';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);
  let album = $derived(d.album);
  let photos = $derived(d.photos);
  let isOwner = $derived(d.isOwner);
  let token = $derived(d.token);

  function thumbUrl(path: string) {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
  }
</script>

<div class="container">
  <div class="album-header">
    <div>
      <div class="album-eyebrow">
        <a href="/{album.profiles.username}" class="back-link">@{album.profiles.username}</a>
        {#if album.visibility === 'restricted'}
          <span class="badge badge-restricted">Restricted</span>
        {/if}
      </div>
      <h1>{album.title}</h1>
      {#if album.description}<p class="album-desc">{album.description}</p>{/if}
    </div>

    {#if isOwner}
      <div class="album-actions">
        <a href="/albums/{album.id}/settings" class="btn btn-ghost btn-sm">⚙ Settings</a>
        <a href="/upload?albumId={album.id}" class="btn btn-primary btn-sm">+ Upload</a>
      </div>
    {/if}
  </div>

  {#if photos.length === 0}
    <div class="empty-state">
      <p>No photos yet.{#if isOwner} <a href="/upload?albumId={album.id}">Upload the first photo</a>.{/if}</p>
    </div>
  {:else}
    <div class="photo-grid">
      {#each photos as photo}
        <a href="/{album.profiles.username}/{album.id}/{photo.id}{token ? `?token=${token}` : ''}" class="photo-tile">
          <img src={thumbUrl(photo.thumb_300_path)} alt={photo.title ?? ''} />
          {#if photo.title}
            <div class="photo-tile-label">{photo.title}</div>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .album-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .album-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;
  }
  .back-link { font-size: 0.875rem; color: var(--color-on-surface-variant); }
  .back-link:hover { color: var(--color-primary); }
  .album-desc { color: var(--color-on-surface-variant); font-size: 0.9375rem; margin: 0.375rem 0 0; }
  .album-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
  .photo-tile-label {
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    color: var(--color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #fff;
  }
  .empty-state {
    padding: 3rem;
    text-align: center;
    background: #fff;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }
</style>
