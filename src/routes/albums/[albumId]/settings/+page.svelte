<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let d = $derived(data as any);

  let title = $state(d.album.title);
  let description = $state(d.album.description ?? '');
  let visibility = $state(d.album.visibility);
  let grantUsername = $state('');
  let errorMsg = $state('');

  const albumUrl = `/${d.album.profiles.username}/${d.album.id}`;

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
</script>

<h1>Album Settings: {d.album.title}</h1>
<a href={albumUrl}>← Back to album</a>

{#if errorMsg}<p style="color:red">{errorMsg}</p>{/if}

<section>
  <h2>Details</h2>
  <label>Title<br><input type="text" bind:value={title} /></label><br><br>
  <label>Description<br><textarea bind:value={description} rows="3"></textarea></label><br><br>
  <fieldset>
    <legend>Visibility</legend>
    <label><input type="radio" bind:group={visibility} value="public" /> Public</label>
    <label><input type="radio" bind:group={visibility} value="restricted" /> Restricted</label>
  </fieldset>
  <br>
  <button onclick={saveAlbum}>Save Changes</button>
</section>

<section style="margin-top:2rem">
  <h2>User Access</h2>
  <p>Grant access by username:</p>
  <input type="text" bind:value={grantUsername} placeholder="username" />
  <button onclick={grantUser}>Grant</button>

  {#if d.shares.length}
    <ul>
      {#each d.shares as share}
        <li>
          {(share as any).profiles?.username}
          <button onclick={() => revokeUser(share.user_id)}>Revoke</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No users granted access yet.</p>
  {/if}
</section>

<section style="margin-top:2rem">
  <h2>Share Links</h2>
  <button onclick={createLink}>Create Share Link</button>

  {#if d.links.length}
    <ul>
      {#each d.links as link}
        <li>
          <input type="text" value={shareUrl(link.token)} readonly style="width:400px" />
          {#if link.expires_at}
            <span> (expires {new Date(link.expires_at).toLocaleDateString()})</span>
          {/if}
          <button onclick={() => revokeLink(link.id)}>Revoke</button>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No share links created yet.</p>
  {/if}
</section>

<section style="margin-top:2rem;border-top:2px solid red;padding-top:1rem">
  <h2>Danger Zone</h2>
  <button onclick={deleteAlbum} style="background:red;color:white">Delete Album</button>
</section>
