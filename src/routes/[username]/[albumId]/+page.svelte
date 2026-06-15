<script lang="ts">
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);
  let album = $derived(d.album);
  let photos = $state(d.photos as any[]);
  let isOwner = $derived(d.isOwner);
  let token = $derived(d.token);
  let allTags = $derived(d.allTags as string[]);

  let tagFilter = $state('');
  let filteredPhotos = $derived(
    tagFilter ? photos.filter((p: any) => p.tags?.includes(tagFilter)) : photos
  );

  function thumbUrl(path: string) {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
  }

  // Slideshow
  let slideshowOpen = $state(false);
  let slideIndex = $state(0);
  let playing = $state(true);
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let fading = $state(false);

  function openSlideshow(startIndex = 0) {
    slideIndex = startIndex;
    playing = true;
    slideshowOpen = true;
  }

  function closeSlideshow() {
    slideshowOpen = false;
    playing = false;
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  function goTo(index: number) {
    fading = true;
    setTimeout(() => {
      slideIndex = index;
      fading = false;
    }, 220);
  }

  function prev() { goTo((slideIndex - 1 + photos.length) % photos.length); }
  function next() { goTo((slideIndex + 1) % photos.length); }

  function togglePlay() {
    playing = !playing;
  }

  function getSlideshowMs() {
    const v = browser ? Number(localStorage.getItem('picbin_slideshow_interval') ?? 4) || 4 : 4;
    return Math.max(1, Math.min(10, v)) * 1000;
  }

  $effect(() => {
    if (slideshowOpen && playing) {
      intervalId = setInterval(next, getSlideshowMs());
    } else {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });

  let deletingId = $state<string | null>(null);

  async function deletePhoto(photoId: string, e: Event) {
    e.preventDefault();
    if (!confirm('Delete this photo?')) return;
    deletingId = photoId;
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
    deletingId = null;
    // Remove from local list
    photos = photos.filter((p: any) => p.id !== photoId);
  }

  function onKeydown(e: KeyboardEvent) {
    if (!slideshowOpen) return;
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') closeSlideshow();
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  }
</script>

<svelte:window onkeydown={onKeydown} />

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

    <div class="album-actions">
      {#if photos.length > 0}
        <button class="btn btn-ghost btn-sm" onclick={() => openSlideshow(0)}>▶ Slideshow</button>
      {/if}
      {#if isOwner}
        <a href="/albums/{album.id}/settings" class="btn btn-ghost btn-sm">⚙ Settings</a>
        <a href="/upload?albumId={album.id}" class="btn btn-primary btn-sm">+ Upload</a>
      {/if}
    </div>
  </div>

  {#if allTags.length > 0}
    <div class="tag-filter-bar">
      <button class="tag-pill {!tagFilter ? 'active' : ''}" onclick={() => tagFilter = ''}>All</button>
      {#each allTags as tag}
        <button class="tag-pill {tagFilter === tag ? 'active' : ''}" onclick={() => tagFilter = tagFilter === tag ? '' : tag}>{tag}</button>
      {/each}
    </div>
  {/if}

  {#if photos.length === 0}
    <div class="empty-state">
      <p>No photos yet.{#if isOwner} <a href="/upload?albumId={album.id}">Upload the first photo</a>.{/if}</p>
    </div>
  {:else if filteredPhotos.length === 0}
    <div class="empty-state"><p>No photos tagged <strong>{tagFilter}</strong>.</p></div>
  {:else}
    <div class="photo-grid">
      {#each filteredPhotos as photo}
        <div class="photo-tile-wrap">
          <a href="/{album.profiles.username}/{album.id}/{photo.id}{token ? `?token=${token}` : ''}" class="photo-tile">
            <img src={thumbUrl(photo.thumb_300_path)} alt={photo.title ?? ''} />
            <div class="photo-tile-footer">
              {#if photo.title}<span class="photo-tile-label">{photo.title}</span>{/if}
              {#if photo.tags?.length}
                <div class="photo-tile-tags">
                  {#each photo.tags as tag}
                    <span class="photo-tag-chip" onclick={(e) => { e.preventDefault(); tagFilter = tag; }}>{tag}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </a>
          {#if isOwner}
            <button
              class="photo-delete-btn"
              onclick={(e) => deletePhoto(photo.id, e)}
              disabled={deletingId === photo.id}
              aria-label="Delete photo"
            >✕</button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Slideshow overlay -->
{#if slideshowOpen && photos.length > 0}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="slideshow-backdrop" onclick={closeSlideshow}>
    <div class="slideshow-ui" onclick={(e) => e.stopPropagation()}>
      <!-- Close -->
      <button class="ss-close" onclick={closeSlideshow} aria-label="Close">✕</button>

      <!-- Counter -->
      <div class="ss-counter">{slideIndex + 1} / {photos.length}</div>

      <!-- Image -->
      <div class="ss-img-wrap">
        <img
          src={thumbUrl(photos[slideIndex].thumb_800_path)}
          alt={photos[slideIndex].title ?? ''}
          class="ss-img"
          class:fading
        />
      </div>

      <!-- Title -->
      {#if photos[slideIndex].title}
        <div class="ss-title">{photos[slideIndex].title}</div>
      {/if}

      <!-- Controls -->
      <div class="ss-controls">
        <button class="ss-btn" onclick={prev} aria-label="Previous">‹</button>
        <button class="ss-btn ss-play" onclick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button class="ss-btn" onclick={next} aria-label="Next">›</button>
      </div>

      <!-- Progress dots -->
      <div class="ss-dots">
        {#each photos as _, i}
          <button
            class="ss-dot {i === slideIndex ? 'active' : ''}"
            onclick={() => goTo(i)}
            aria-label="Go to photo {i + 1}"
          ></button>
        {/each}
      </div>

      <!-- View full link -->
      <a
        href="/{album.profiles.username}/{album.id}/{photos[slideIndex].id}{token ? `?token=${token}` : ''}"
        class="ss-view-link"
      >View photo →</a>
    </div>
  </div>
{/if}

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
  .album-actions { display: flex; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }

  .photo-tile-wrap { position: relative; }
  .photo-delete-btn {
    position: absolute; top: 0.4rem; right: 0.4rem;
    background: rgba(0,0,0,0.55); color: #fff; border: none;
    border-radius: 50%; width: 1.6rem; height: 1.6rem;
    font-size: 0.75rem; cursor: pointer; opacity: 0;
    transition: opacity 0.15s; line-height: 1;
  }
  .photo-tile-wrap:hover .photo-delete-btn { opacity: 1; }
  .photo-delete-btn:hover { background: rgba(200,0,0,0.8); }

  .photo-tile {
    all: unset;
    cursor: pointer;
    display: block;
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--color-surface-container);
    border: 1px solid var(--color-border);
    transition: transform 0.15s, border-color 0.15s;
  }
  .photo-tile:hover { transform: translateY(-2px); border-color: var(--color-primary); }
  .photo-tile img { display: block; width: 100%; height: 180px; object-fit: cover; }
  .tag-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-bottom: 1.25rem;
  }
  .tag-pill {
    background: var(--color-surface-container);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 0.25rem 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .tag-pill:hover { border-color: var(--color-primary); color: var(--color-primary); }
  .tag-pill.active { background: var(--color-primary); border-color: var(--color-primary); color: var(--color-on-primary); }

  .photo-tile-footer { background: #fff; }
  .photo-tile-label {
    display: block;
    padding: 0.375rem 0.625rem 0.125rem;
    font-size: 0.8125rem;
    color: var(--color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .photo-tile-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem 0.5rem;
  }
  .photo-tag-chip {
    background: var(--color-surface-container);
    border: none;
    border-radius: var(--radius-full);
    padding: 0.0625rem 0.4rem;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    color: var(--color-on-surface-variant);
    cursor: pointer;
    transition: background 0.1s;
  }
  .photo-tag-chip:hover { background: var(--color-primary-fixed); color: var(--color-primary); }
  .empty-state {
    padding: 3rem;
    text-align: center;
    background: #fff;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }

  /* Slideshow */
  .slideshow-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slideshow-ui {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 900px;
    padding: 1rem;
  }
  .ss-close {
    position: absolute;
    top: 0;
    right: 1rem;
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
  }
  .ss-close:hover { color: #fff; }
  .ss-counter {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
  }
  .ss-img-wrap {
    width: 100%;
    max-height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ss-img {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
    border-radius: var(--radius);
    transition: opacity 0.22s ease;
  }
  .ss-img.fading { opacity: 0; }
  .ss-title {
    color: #fff;
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 600;
    text-align: center;
  }
  .ss-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .ss-btn {
    background: rgba(255,255,255,0.12);
    border: none;
    color: #fff;
    font-size: 2rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background 0.15s;
  }
  .ss-btn:hover { background: rgba(255,255,255,0.22); }
  .ss-play { font-size: 1.25rem; }
  .ss-dots {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 400px;
  }
  .ss-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s;
  }
  .ss-dot.active { background: #fff; }
  .ss-view-link {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.5);
    text-decoration: none;
  }
  .ss-view-link:hover { color: #fff; }
</style>
