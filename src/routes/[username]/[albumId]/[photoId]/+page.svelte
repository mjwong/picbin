<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);

  let newComment = $state('');
  let newTag = $state('');

  function thumbUrl(path: string) {
    return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
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
</script>

<div class="container">
  <div class="detail-layout">
    <!-- Photo pane -->
    <div class="photo-pane">
      <div class="photo-frame">
        <img src={thumbUrl(d.photo.thumb_800_path)} alt={d.photo.title ?? ''} />
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
        {#if d.photo.description}<p class="photo-desc">{d.photo.description}</p>{/if}

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
          <a href={d.signedUrl} download class="btn btn-ghost btn-sm download-btn">↓ Download original</a>
        {/if}
      </div>

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

  .like-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .download-btn { margin-top: 0.75rem; display: inline-flex; }

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
</style>
