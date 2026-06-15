<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);

  let newComment = $state('');
  let newTag = $state('');
  let rotating = $state(false);
  let editingDesc = $state(false);
  let descDraft = $state('');

  function startEditDesc() {
    descDraft = d.photo.description ?? '';
    editingDesc = true;
  }

  async function saveDesc() {
    await fetch(`/api/photos/${d.photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: descDraft.trim() || null }),
    });
    editingDesc = false;
    invalidateAll();
  }

  function cancelDesc() {
    editingDesc = false;
  }

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

  async function toggleLike() {
    await fetch(`/api/photos/${d.photo.id}/likes`, { method: 'POST' });
    invalidateAll();
  }

  async function addComment() {
    if (!newComment.trim()) return;
    await fetch(`/api/photos/${d.photo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment.trim() }),
    });
    newComment = '';
    invalidateAll();
  }

  async function addTag() {
    if (!newTag.trim()) return;
    await fetch(`/api/photos/${d.photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addTag: newTag.trim().toLowerCase() }),
    });
    newTag = '';
    invalidateAll();
  }

  async function removeTag(tag: string) {
    await fetch(`/api/photos/${d.photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removeTag: tag }),
    });
    invalidateAll();
  }

  async function deleteComment(id: string) {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    invalidateAll();
  }

  let shareErr = $state('');

  async function createShareLink() {
    shareErr = '';
    const res = await fetch(`/api/photos/${d.photo.id}/share-links`, { method: 'POST' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      shareErr = body.message ?? `Error ${res.status}`;
      return;
    }
    invalidateAll();
  }

  async function setCover() {
    await fetch(`/api/albums/${d.photo.album_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cover_photo_id: d.photo.id }),
    });
  }

  async function rotatePhoto() {
    rotating = true;
    const res = await fetch(`/api/photos/${d.photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotate: 90 }),
    });
    if (res.ok) await invalidateAll();
    rotating = false;
  }

  async function revokeShareLink(linkId: string) {
    await fetch(`/api/photos/${d.photo.id}/share-links/${linkId}`, { method: 'DELETE' });
    invalidateAll();
  }

  function shareUrl(token: string) {
    return `${window.location.origin}/p/${token}`;
  }

  function navUrl(id: string) {
    return `/${$page.params.username}/${$page.params.albumId}/${id}${d.token ? `?token=${d.token}` : ''}`;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'ArrowLeft' && d.prevId) goto(navUrl(d.prevId));
    if (e.key === 'ArrowRight' && d.nextId) goto(navUrl(d.nextId));
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="container">
  <div class="detail-layout">
    <!-- Photo pane -->
    <div class="photo-pane">
      <div class="photo-nav">
        {#if d.prevId}
          <a href="/{$page.params.username}/{$page.params.albumId}/{d.prevId}{d.token ? `?token=${d.token}` : ''}" class="nav-arrow" aria-label="Previous photo">‹</a>
        {:else}
          <span class="nav-arrow disabled"></span>
        {/if}
        <div class="photo-frame">
          <img src={thumbUrl(d.photo.thumb_800_path)} alt={d.photo.title ?? ''} />
        </div>
        {#if d.nextId}
          <a href="/{$page.params.username}/{$page.params.albumId}/{d.nextId}{d.token ? `?token=${d.token}` : ''}" class="nav-arrow" aria-label="Next photo">›</a>
        {:else}
          <span class="nav-arrow disabled"></span>
        {/if}
      </div>

      <!-- Tags -->
      {#if d.tags.length || d.isOwner}
        <div class="tags-row">
          {#each d.tags as tag}
            <span class="chip">
              {tag}
              {#if d.isOwner}
                <button class="chip-btn" onclick={() => removeTag(tag)} aria-label="Remove tag">×</button>
              {/if}
            </span>
          {/each}
          {#if d.isOwner}
            <div class="tag-input-row">
              <input class="tag-input" type="text" bind:value={newTag} placeholder="add tag…" />
              <button class="btn btn-ghost btn-sm" onclick={addTag} disabled={!newTag.trim()}>Add</button>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-section">
        <h2 class="photo-title">{d.photo.title ?? 'Untitled'}</h2>
        {#if d.isOwner}
          {#if editingDesc}
            <textarea
              class="desc-editor"
              bind:value={descDraft}
              rows="4"
              placeholder="Add a description…"
              autofocus
            ></textarea>
            <div class="desc-actions">
              <button class="btn btn-primary btn-sm" onclick={saveDesc}>Save</button>
              <button class="btn btn-ghost btn-sm" onclick={cancelDesc}>Cancel</button>
            </div>
          {:else}
            <div class="desc-view" onclick={startEditDesc} title="Click to edit">
              {#if d.photo.description}
                <p class="photo-desc">{d.photo.description}</p>
              {:else}
                <p class="desc-placeholder">Add a description…</p>
              {/if}
            </div>
          {/if}
        {:else}
          {#if d.photo.description}<p class="photo-desc">{d.photo.description}</p>{/if}
        {/if}

        <!-- Like -->
        <div class="like-row">
          {#if data.user}
            <button class="btn {d.userLiked ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick={toggleLike}>
              {d.userLiked ? '♥ Unlike' : '♡ Like'}
            </button>
          {/if}
          <span class="meta">{d.likeCount} {d.likeCount === 1 ? 'like' : 'likes'}</span>
        </div>

        {#if d.signedUrl}
          <button class="btn btn-ghost btn-sm download-btn" onclick={downloadOriginal}>↓ Download original</button>
        {/if}
        {#if d.isOwner}
          <button class="btn btn-ghost btn-sm rotate-btn" onclick={rotatePhoto} disabled={rotating}>
            {rotating ? 'Rotating…' : '↻ Rotate 90°'}
          </button>
          <button class="btn btn-ghost btn-sm rotate-btn" onclick={setCover}>
            ◉ Set as album cover
          </button>
        {/if}
      </div>

      <!-- Share links (owner only) -->
      {#if d.isOwner}
        <div class="sidebar-section">
          <div class="section-title-row">
            <h3 class="section-label">Share Links</h3>
            <button class="btn btn-ghost btn-sm" onclick={createShareLink}>+ Create</button>
          </div>
          <p class="share-hint meta">Anyone with a link can view and download this photo.</p>
          {#if shareErr}<p class="share-err">{shareErr}</p>{/if}

          {#if d.shareLinks.length}
            <ul class="share-links-list">
              {#each d.shareLinks as link}
                <li class="share-link-item">
                  <input type="text" value={shareUrl(link.token)} readonly class="link-url" onclick={(e) => (e.target as HTMLInputElement).select()} />
                  <button class="btn btn-ghost btn-sm" onclick={() => revokeShareLink(link.id)}>Revoke</button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}

      <!-- EXIF -->
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

      <!-- Comments -->
      <div class="sidebar-section">
        <h3 class="section-label">Comments</h3>

        {#if d.comments.length === 0}
          <p class="empty-comments">No comments yet.</p>
        {:else}
          <div class="comments-list">
            {#each d.comments as c}
              <div class="comment">
                <div class="comment-header">
                  <span class="comment-author">{(c as any).profiles?.username ?? 'unknown'}</span>
                  <span class="meta comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
                  {#if data.user?.id === c.user_id || d.isOwner}
                    <button class="delete-btn" onclick={() => deleteComment(c.id)} aria-label="Delete">×</button>
                  {/if}
                </div>
                <p class="comment-body">{c.body}</p>
              </div>
            {/each}
          </div>
        {/if}

        {#if data.user}
          <div class="comment-form">
            <textarea class="comment-textarea" bind:value={newComment} placeholder="Add a comment…" rows="2"></textarea>
            <button class="btn btn-primary btn-sm" onclick={addComment} disabled={!newComment.trim()}>Comment</button>
          </div>
        {/if}
      </div>
    </aside>
  </div>
</div>

<style>
  .detail-layout {
    display: grid;
    grid-template-columns: 1fr var(--sidebar-w);
    gap: 2rem;
    align-items: start;
  }
  @media (max-width: 768px) {
    .detail-layout { grid-template-columns: 1fr; }
  }

  .photo-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .photo-nav .photo-frame { flex: 1; min-width: 0; }

  .nav-arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    background: var(--color-surface-container);
    border: 1px solid var(--color-border);
    color: var(--color-on-surface);
    font-size: 1.5rem;
    line-height: 1;
    text-decoration: none;
    transition: background 0.15s;
  }
  .nav-arrow:hover { background: var(--color-surface-container-high); }
  .nav-arrow.disabled { visibility: hidden; pointer-events: none; }

  .photo-frame {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-deep);
    border: 1px solid var(--color-border);
  }
  .photo-frame img { display: block; width: 100%; height: auto; }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin-top: 0.75rem;
    align-items: center;
  }
  .tag-input-row { display: flex; gap: 0.375rem; align-items: center; }
  .tag-input {
    border: none;
    border-bottom: 1.5px solid var(--color-border);
    background: transparent;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    padding: 0.125rem 0.25rem;
    outline: none;
    width: 90px;
    color: var(--color-on-surface);
  }
  .tag-input:focus { border-bottom-color: var(--color-primary); }

  /* Sidebar */
  .sidebar { display: flex; flex-direction: column; gap: 0; }
  .sidebar-section {
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    background: #fff;
  }
  .sidebar-section:first-child { border-top: 1px solid var(--color-border); border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .sidebar-section:last-child { border-radius: 0 0 var(--radius-lg) var(--radius-lg); }

  .photo-title { font-size: 1.25rem; margin-bottom: 0.375rem; }
  .photo-desc { font-size: 0.9375rem; margin-bottom: 0; }

  .desc-view {
    cursor: text;
    border-radius: var(--radius);
    padding: 0.25rem 0.375rem;
    margin: 0 -0.375rem;
    transition: background 0.12s;
  }
  .desc-view:hover { background: var(--color-surface-container-low); }
  .desc-placeholder { font-size: 0.9375rem; color: var(--color-outline); font-style: italic; margin: 0; }
  .desc-editor {
    width: 100%;
    border: 1.5px solid var(--color-primary);
    border-radius: var(--radius);
    padding: 0.5rem 0.625rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    resize: vertical;
    outline: none;
    color: var(--color-on-surface);
    margin-top: 0.25rem;
  }
  .desc-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

  .like-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .download-btn { margin-top: 0.75rem; display: inline-flex; }
  .rotate-btn { margin-top: 0.5rem; display: inline-flex; }

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

  .empty-comments { font-size: 0.875rem; color: var(--color-outline); }
  .comments-list { display: flex; flex-direction: column; gap: 0.875rem; margin-bottom: 1rem; }
  .comment-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.125rem; }
  .comment-author { font-size: 0.8125rem; font-weight: 600; color: var(--color-on-surface); }
  .comment-time { font-size: 0.6875rem; }
  .comment-body { margin: 0; font-size: 0.9375rem; color: var(--color-on-surface); }
  .delete-btn {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-outline);
    font-size: 1rem;
    line-height: 1;
    padding: 0;
  }
  .delete-btn:hover { color: var(--color-error); }

  .comment-form { display: flex; flex-direction: column; gap: 0.5rem; }
  .comment-textarea {
    width: 100%;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.5rem 0.625rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    resize: none;
    outline: none;
    color: var(--color-on-surface);
  }
  .comment-textarea:focus { border-color: var(--color-primary); }

  .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.25rem; }
  .share-hint { margin: 0 0 0.75rem; }
  .share-links-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .share-link-item { display: flex; align-items: center; gap: 0.5rem; }
  .share-err { font-size: 0.8125rem; color: var(--color-error); margin: 0.25rem 0 0; }
  .link-url {
    flex: 1;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.25rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--color-on-surface-variant);
    background: var(--color-surface-muted);
    outline: none;
    cursor: text;
    min-width: 0;
  }
</style>
