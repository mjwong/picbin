<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);
  let profile = $derived(d.profile);
  let albums = $derived(d.albums);
  let isOwner = $derived(d.isOwner);
</script>

<div class="container">
  <div class="profile-header">
    <div class="profile-avatar">{(profile.display_name ?? profile.username).charAt(0).toUpperCase()}</div>
    <div class="profile-info">
      <h1>{profile.display_name ?? profile.username}</h1>
      <p class="meta">@{profile.username}</p>
      {#if profile.bio}<p class="profile-bio">{profile.bio}</p>{/if}
    </div>
    {#if isOwner}
      <a href="/albums/new" class="btn btn-primary btn-sm">+ New Album</a>
    {/if}
  </div>

  <hr class="divider" />

  {#if albums.length === 0}
    <div class="empty-state">
      {#if isOwner}
        <p>No albums yet. <a href="/albums/new">Create your first album</a>.</p>
      {:else}
        <p>No public albums.</p>
      {/if}
    </div>
  {:else}
    <div class="album-grid">
      {#each albums as album}
        <a href="/{profile.username}/{album.id}" class="album-card">
          <div class="album-card-head">
            <span class="album-card-title">{album.title}</span>
            {#if album.visibility === 'restricted'}
              <span class="badge badge-restricted">Restricted</span>
            {/if}
          </div>
          <div class="album-card-meta">{album.visibility === 'restricted' ? 'Private album' : 'Public album'}</div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .profile-header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 0;
    flex-wrap: wrap;
  }
  .profile-avatar {
    width: 4rem;
    height: 4rem;
    border-radius: var(--radius-full);
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .profile-info { flex: 1; min-width: 0; }
  .profile-info h1 { margin-bottom: 0; }
  .profile-bio { margin-top: 0.375rem; color: var(--color-on-surface-variant); font-size: 0.9375rem; }
  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--grid-gap);
  }
  .album-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .empty-state {
    padding: 3rem;
    text-align: center;
    background: #fff;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }
</style>
