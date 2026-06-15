<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);

  let title = $state('');
  let description = $state('');
  let visibility = $state<'public' | 'restricted'>('public');
  let grantUsername = $state('');
  let errorMsg = $state('');
  let newTag = $state('');

  $effect(() => {
    title = d.album.title;
    description = d.album.description ?? '';
    visibility = d.album.visibility;
  });

  let albumUrl = $derived(`/${d.album.profiles.username}/${d.album.id}`);

  async function saveAlbum() {
    const res = await fetch(`/api/albums/${d.album.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, visibility }),
    });
    if (!res.ok) { errorMsg = 'Save failed'; return; }
    invalidateAll();
  }

  async function deleteAlbum() {
    if (!confirm('Delete this album and all photos? This cannot be undone.')) return;
    const res = await fetch(`/api/albums/${d.album.id}`, { method: 'DELETE' });
    if (res.ok) goto(`/${d.album.profiles.username}`);
    else errorMsg = 'Delete failed';
  }

  async function grantUser() {
    if (!grantUsername.trim()) return;
    const res = await fetch(`/api/albums/${d.album.id}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: grantUsername.trim() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorMsg = body.message ?? 'User not found';
      return;
    }
    grantUsername = '';
    invalidateAll();
  }

  async function revokeUser(userId: string) {
    await fetch(`/api/albums/${d.album.id}/shares/${userId}`, { method: 'DELETE' });
    invalidateAll();
  }

  async function createLink() {
    await fetch(`/api/albums/${d.album.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    invalidateAll();
  }

  async function revokeLink(linkId: string) {
    await fetch(`/api/albums/${d.album.id}/links/${linkId}`, { method: 'DELETE' });
    invalidateAll();
  }

  function shareUrl(token: string) {
    return `${window.location.origin}${albumUrl}?token=${token}`;
  }

  async function addTag() {
    const t = newTag.trim().toLowerCase();
    if (!t) return;
    await fetch(`/api/albums/${d.album.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: t }),
    });
    newTag = '';
    invalidateAll();
  }

  async function removeTag(tag: string) {
    await fetch(`/api/albums/${d.album.id}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    invalidateAll();
  }
</script>

<div class="container">
  <div class="settings-header">
    <div>
      <a href={albumUrl} class="back-link">← Back to album</a>
      <h1>Album Settings</h1>
    </div>
  </div>

  {#if errorMsg}
    <div class="alert alert-error">{errorMsg}</div>
  {/if}

  <!-- Details -->
  <section class="settings-section card">
    <h2 class="section-title">Details</h2>
    <div class="field">
      <label for="title">Title</label>
      <input id="title" type="text" bind:value={title} />
    </div>
    <div class="field">
      <label for="desc">Description</label>
      <textarea id="desc" bind:value={description} rows="3"></textarea>
    </div>
    <fieldset>
      <legend>Visibility</legend>
      <label><input type="radio" bind:group={visibility} value="public" /> <span>Public</span></label>
      <label><input type="radio" bind:group={visibility} value="restricted" /> <span>Restricted</span></label>
    </fieldset>
    <div class="section-footer">
      <button class="btn btn-primary btn-sm" onclick={saveAlbum}>Save Changes</button>
    </div>
  </section>

  <!-- User Access -->
  <section class="settings-section card">
    <h2 class="section-title">User Access</h2>
    <p>Grant access to this album by username.</p>
    <div class="grant-row">
      <div class="field" style="flex:1;margin:0">
        <label for="grant">Username</label>
        <input id="grant" type="text" bind:value={grantUsername} placeholder="username" />
      </div>
      <button class="btn btn-primary btn-sm" onclick={grantUser} disabled={!grantUsername.trim()}>Grant</button>
    </div>

    {#if d.shares.length}
      <ul class="access-list">
        {#each d.shares as share}
          <li class="access-item">
            <span class="access-avatar">{((share as any).profiles?.username ?? '?').charAt(0).toUpperCase()}</span>
            <span class="access-name">{(share as any).profiles?.username}</span>
            <button class="btn btn-ghost btn-sm" onclick={() => revokeUser(share.user_id)}>Revoke</button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-hint">No users granted access yet.</p>
    {/if}
  </section>

  <!-- Share Links -->
  <section class="settings-section card">
    <div class="section-title-row">
      <h2 class="section-title">Share Links</h2>
      <button class="btn btn-ghost btn-sm" onclick={createLink}>+ Create Link</button>
    </div>
    <p>Anyone with a link can view this album.</p>

    {#if d.links.length}
      <ul class="links-list">
        {#each d.links as link}
          <li class="link-item">
            <input type="text" value={shareUrl(link.token)} readonly class="link-url" />
            <div class="link-meta">
              {#if link.expires_at}
                <span class="meta">Expires {new Date(link.expires_at).toLocaleDateString()}</span>
              {:else}
                <span class="meta">No expiry</span>
              {/if}
              <button class="btn btn-ghost btn-sm" onclick={() => revokeLink(link.id)}>Revoke</button>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="empty-hint">No share links created yet.</p>
    {/if}
  </section>

  <!-- Tags -->
  <section class="settings-section card">
    <h2 class="section-title">Tags</h2>
    <p class="empty-hint" style="margin-bottom:0.75rem">Tags help you filter albums in your library.</p>
    <div class="tags-row">
      {#each d.tags as tag}
        <span class="chip">
          {tag}
          <button class="chip-btn" onclick={() => removeTag(tag)} aria-label="Remove">×</button>
        </span>
      {/each}
    </div>
    <div class="tag-add-row">
      <input
        class="tag-input-field"
        type="text"
        bind:value={newTag}
        placeholder="Add tag…"
        onkeydown={(e) => e.key === 'Enter' && addTag()}
      />
      <button class="btn btn-ghost btn-sm" onclick={addTag} disabled={!newTag.trim()}>Add</button>
    </div>
  </section>

  <!-- Danger Zone -->
  <section class="settings-section danger-zone card">
    <h2 class="section-title danger-title">Danger Zone</h2>
    <div class="danger-row">
      <div>
        <p style="margin:0;font-weight:500">Delete Album</p>
        <p class="danger-hint">Permanently delete this album and all its photos. Cannot be undone.</p>
      </div>
      <button class="btn btn-danger btn-sm" onclick={deleteAlbum}>Delete Album</button>
    </div>
  </section>
</div>

<style>
  .settings-header { margin-bottom: 1.5rem; }
  .back-link { font-size: 0.875rem; color: var(--color-on-surface-variant); }
  .back-link:hover { color: var(--color-primary); }
  .settings-header h1 { margin-top: 0.25rem; }

  .settings-section {
    padding: 1.5rem;
    margin-bottom: 1.25rem;
  }
  .section-title { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
  .section-title-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.5rem; }
  .section-footer { display: flex; justify-content: flex-end; margin-top: 1rem; }

  fieldset { margin-bottom: 0; }

  .grant-row { display: flex; align-items: flex-end; gap: 0.75rem; margin-bottom: 1rem; }

  .access-list { list-style: none; padding: 0; margin: 0.75rem 0 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .access-item { display: flex; align-items: center; gap: 0.625rem; }
  .access-avatar {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--radius-full);
    background: var(--color-surface-container);
    color: var(--color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: var(--font-display);
  }
  .access-name { flex: 1; font-size: 0.9375rem; }
  .empty-hint { font-size: 0.875rem; color: var(--color-outline); margin: 0.5rem 0 0; }

  .links-list { list-style: none; padding: 0; margin: 0.75rem 0 0; display: flex; flex-direction: column; gap: 0.75rem; }
  .link-item { display: flex; flex-direction: column; gap: 0.375rem; }
  .link-url {
    width: 100%;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.375rem 0.625rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--color-on-surface-variant);
    background: var(--color-surface-muted);
    outline: none;
  }
  .link-meta { display: flex; align-items: center; justify-content: space-between; }

  .tags-row { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; min-height: 1.5rem; }
  .tag-add-row { display: flex; gap: 0.5rem; align-items: center; }
  .tag-input-field {
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.375rem 0.625rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    outline: none;
    width: 160px;
    color: var(--color-on-surface);
    background: #fff;
  }
  .tag-input-field:focus { border-color: var(--color-primary); }

  .danger-zone { border-color: #ffdad6; }
  .danger-title { color: var(--color-error); }
  .danger-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .danger-hint { font-size: 0.8125rem; color: var(--color-on-surface-variant); margin: 0.25rem 0 0; }
</style>
