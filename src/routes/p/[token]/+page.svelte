<script lang="ts">
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);

  function thumbUrl(path: string) {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
  }

  async function downloadOriginal() {
    if (!d.signedUrl) return;
    const res = await fetch(d.signedUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = d.photo.title ?? 'photo';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>{d.photo.title ?? 'Shared Photo'} — picbin</title>
</svelte:head>

<div class="container">
  <div class="share-layout">
    <div class="photo-pane">
      <div class="photo-frame">
        <img src={thumbUrl(d.photo.thumb_800_path)} alt={d.photo.title ?? ''} />
      </div>
    </div>

    <aside class="sidebar">
      <div class="sidebar-section">
        <p class="shared-by meta">Shared by <a href="/{d.photo.profiles.username}">@{d.photo.profiles.username}</a></p>
        <h1 class="photo-title">{d.photo.title ?? 'Untitled'}</h1>
        {#if d.photo.description}
          <p class="photo-desc">{d.photo.description}</p>
        {/if}
        {#if d.photo.albums}
          <p class="album-ref meta">From album: <a href="/{d.photo.profiles.username}/{d.photo.albums.id}?token={d.token}">{d.photo.albums.title}</a></p>
        {/if}
      </div>

      {#if d.signedUrl}
        <div class="sidebar-section">
          <button class="btn btn-primary download-btn" onclick={downloadOriginal}>
            ↓ Download Original
          </button>
          <p class="download-hint meta">High-resolution original file</p>
        </div>
      {/if}

      {#if d.photo.exif_data}
        <div class="sidebar-section">
          <h3 class="section-label">Metadata</h3>
          <dl class="exif-grid">
            {#each Object.entries(d.photo.exif_data) as [key, val]}
              {#if val !== null}
                <dt class="meta exif-key">{key}</dt>
                <dd class="meta exif-val">{val}</dd>
              {/if}
            {/each}
          </dl>
        </div>
      {/if}
    </aside>
  </div>
</div>

<style>
  .share-layout {
    display: grid;
    grid-template-columns: 1fr var(--sidebar-w);
    gap: 2rem;
    align-items: start;
  }
  @media (max-width: 768px) {
    .share-layout { grid-template-columns: 1fr; }
  }

  .photo-frame {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-deep);
    border: 1px solid var(--color-border);
  }
  .photo-frame img { display: block; width: 100%; height: auto; }

  .sidebar { display: flex; flex-direction: column; gap: 0; }
  .sidebar-section {
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    background: #fff;
  }
  .sidebar-section:first-child { border-top: 1px solid var(--color-border); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .sidebar-section:last-child { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }

  .shared-by { margin-bottom: 0.375rem; }
  .photo-title { font-size: 1.25rem; margin-bottom: 0.375rem; }
  .photo-desc { font-size: 0.9375rem; margin-bottom: 0; }
  .album-ref { margin: 0.5rem 0 0; }

  .download-btn { width: 100%; justify-content: center; }
  .download-hint { margin: 0.5rem 0 0; text-align: center; }

  .section-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-outline);
    margin-bottom: 0.75rem;
    font-family: var(--font-mono);
  }
  .exif-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.75rem; margin: 0; }
  .exif-key { color: var(--color-outline); }
  .exif-val { color: var(--color-on-surface); }
</style>
