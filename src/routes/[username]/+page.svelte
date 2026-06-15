<script lang="ts">
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);
  let profile = $derived(d.profile);
  let albums = $derived(d.albums as any[]);
  let isOwner = $derived(d.isOwner);
  let allTags = $derived(d.allTags as string[]);

  let search = $state('');
  let yearFilter = $state('');
  let sortBy = $state('newest');
  let tagFilter = $state('');

  let years = $derived(
    [...new Set(albums.map((a: any) => new Date(a.created_at).getFullYear()))].sort((a, b) => b - a)
  );

  let filtered = $derived(() => {
    let list = [...albums];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a: any) => a.title.toLowerCase().includes(q));
    }
    if (yearFilter) {
      list = list.filter((a: any) => new Date(a.created_at).getFullYear().toString() === yearFilter);
    }
    if (tagFilter) {
      list = list.filter((a: any) => a.tags?.includes(tagFilter));
    }
    switch (sortBy) {
      case 'oldest':   list.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case 'az':       list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za':       list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'photos':   list.sort((a, b) => b.photoCount - a.photoCount); break;
      default:         list.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
    }
    return list;
  });

  let hasFilters = $derived(!!search.trim() || !!yearFilter || sortBy !== 'newest' || !!tagFilter);

  function clearFilters() {
    search = '';
    yearFilter = '';
    sortBy = 'newest';
    tagFilter = '';
  }
</script>

<div class="container">

  {#if albums.length > 0}
    <div class="filter-bar">
      <input
        class="search-input"
        type="search"
        placeholder="Search albums…"
        bind:value={search}
      />
      <select class="filter-select" bind:value={yearFilter}>
        <option value="">All years</option>
        {#each years as year}
          <option value={year.toString()}>{year}</option>
        {/each}
      </select>
      <select class="filter-select" bind:value={sortBy}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="az">A → Z</option>
        <option value="za">Z → A</option>
        <option value="photos">Most photos</option>
      </select>
      {#if allTags.length > 0}
        <select class="filter-select" bind:value={tagFilter}>
          <option value="">All tags</option>
          {#each allTags as tag}
            <option value={tag}>{tag}</option>
          {/each}
        </select>
      {/if}
      {#if hasFilters}
        <button class="btn btn-ghost btn-sm" onclick={clearFilters}>Clear</button>
      {/if}
    </div>
  {/if}

  {#if albums.length === 0}
    <div class="empty-state">
      {#if isOwner}
        <p>No albums yet. <a href="/albums/new">Create your first album</a>.</p>
      {:else}
        <p>No public albums.</p>
      {/if}
    </div>
  {:else if filtered().length === 0}
    <div class="empty-state">
      <p>No albums match your filters. <button class="link-btn" onclick={clearFilters}>Clear filters</button></p>
    </div>
  {:else}
    <div class="album-grid">
      {#each filtered() as album}
        <a href="/{profile.username}/{album.id}" class="album-card">
          <div class="album-cover">
            {#if album.photos?.thumb_300_path}
              <img src="{PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/{album.photos.thumb_300_path}" alt={album.title} class="cover-img" />
            {:else}
              <div class="cover-placeholder">{album.title.charAt(0).toUpperCase()}</div>
            {/if}
          </div>
          <div class="album-card-body">
            <div class="album-card-head">
              <span class="album-card-title">{album.title}</span>
              {#if album.visibility === 'restricted'}
                <span class="badge badge-restricted">Restricted</span>
              {/if}
            </div>
            <div class="album-card-meta">
              {album.visibility === 'restricted' ? 'Private' : 'Public'} · {album.photoCount} {album.photoCount === 1 ? 'photo' : 'photos'} · {new Date(album.created_at).getFullYear()}
            </div>
            {#if album.tags?.length}
              <div class="album-tags">
                {#each album.tags as tag}
                  <button class="tag-chip" onclick={(e) => { e.preventDefault(); tagFilter = tag; }}>{tag}</button>
                {/each}
              </div>
            {/if}
          </div>
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
    overflow: hidden;
  }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .profile-info { flex: 1; min-width: 0; }
  .profile-info h1 { margin-bottom: 0; }
  .profile-bio { margin-top: 0.375rem; color: var(--color-on-surface-variant); font-size: 0.9375rem; }

  .filter-bar {
    display: flex;
    gap: 0.625rem;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }
  .search-input {
    flex: 1;
    min-width: 160px;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.4375rem 0.75rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    outline: none;
    background: #fff;
    color: var(--color-on-surface);
  }
  .search-input:focus { border-color: var(--color-primary); }
  .filter-select {
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.4375rem 0.625rem;
    font-family: var(--font-body);
    font-size: 0.875rem;
    background: #fff;
    color: var(--color-on-surface);
    outline: none;
    cursor: pointer;
  }
  .filter-select:focus { border-color: var(--color-primary); }

  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--grid-gap);
  }
  .album-cover {
    width: 100%;
    aspect-ratio: 4/3;
    overflow: hidden;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--color-surface-container);
    flex-shrink: 0;
  }
  .cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-outline);
  }
  .album-card-body { padding: 0.875rem 1rem 0.625rem; }
  .album-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; }
  .tag-chip {
    background: var(--color-surface-container);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 0.125rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }
  .tag-chip:hover { background: var(--color-primary-fixed); color: var(--color-primary); }
  .album-card-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .empty-state {
    padding: 3rem;
    text-align: center;
    background: #fff;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font: inherit;
    padding: 0;
    text-decoration: underline;
  }
</style>
