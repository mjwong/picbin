<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { PUBLIC_SUPABASE_URL } from '$env/static/public';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const d = data as any;

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

<img src={thumbUrl(d.photo.thumb_800_path)} alt={d.photo.title ?? ''} style="max-width:100%" />

{#if d.signedUrl}
  <p><a href={d.signedUrl} download>Download original</a></p>
{/if}

<h2>{d.photo.title ?? 'Untitled'}</h2>
{#if d.photo.description}<p>{d.photo.description}</p>{/if}

<!-- Likes -->
<p>
  {d.likeCount} {d.likeCount === 1 ? 'like' : 'likes'}
  {#if data.user}
    <button onclick={toggleLike}>{d.userLiked ? '♥ Unlike' : '♡ Like'}</button>
  {/if}
</p>

<!-- Tags -->
<div>
  {#each d.tags as tag}
    <span style="background:#eee;padding:2px 8px;border-radius:12px;margin-right:4px">
      {tag}
      {#if d.isOwner}
        <button onclick={() => removeTag(tag)} style="border:none;background:none;cursor:pointer">×</button>
      {/if}
    </span>
  {/each}
  {#if d.isOwner}
    <input type="text" bind:value={newTag} placeholder="add tag" style="width:100px" />
    <button onclick={addTag}>Add</button>
  {/if}
</div>

<!-- EXIF -->
{#if d.photo.exif_data}
  <details style="margin-top:1rem">
    <summary>EXIF / Metadata</summary>
    <table>
      {#each Object.entries(d.photo.exif_data) as [key, val]}
        {#if val !== null}
          <tr><td><strong>{key}</strong></td><td>{val}</td></tr>
        {/if}
      {/each}
    </table>
  </details>
{/if}

<!-- Comments -->
<section style="margin-top:2rem">
  <h3>Comments</h3>
  {#each d.comments as c}
    <div style="border-bottom:1px solid #eee;padding:0.5rem 0">
      <strong>{(c as any).profiles?.username ?? 'unknown'}</strong>: {c.body}
      {#if data.user?.id === c.user_id || d.isOwner}
        <button onclick={() => deleteComment(c.id)} style="float:right;background:none;border:none;cursor:pointer;color:#999">delete</button>
      {/if}
    </div>
  {/each}

  {#if data.user}
    <div style="margin-top:1rem">
      <textarea bind:value={newComment} placeholder="Add a comment…" rows="2" style="width:100%"></textarea>
      <button onclick={addComment} disabled={!newComment.trim()}>Comment</button>
    </div>
  {/if}
</section>
