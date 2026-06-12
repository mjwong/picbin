<script lang="ts">
  import { goto } from '$app/navigation';

  let title = $state('');
  let description = $state('');
  let visibility = $state<'public' | 'restricted'>('public');
  let errorMsg = $state('');
  let submitting = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    submitting = true;
    errorMsg = '';

    const res = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description.trim() || null, visibility }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorMsg = (body as any).message ?? 'Failed to create album';
      submitting = false;
      return;
    }

    const album = await res.json();
    goto(`/upload?albumId=${album.id}`);
  }
</script>

<h1>New Album</h1>

{#if errorMsg}<p style="color:red">{errorMsg}</p>{/if}

<form onsubmit={submit}>
  <label>Title<br><input type="text" bind:value={title} required /></label><br><br>
  <label>Description<br><textarea bind:value={description} rows="3"></textarea></label><br><br>
  <fieldset>
    <legend>Visibility</legend>
    <label><input type="radio" bind:group={visibility} value="public" /> Public — anyone can view</label><br>
    <label><input type="radio" bind:group={visibility} value="restricted" /> Restricted — only people you share with</label>
  </fieldset>
  <br>
  <button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Album'}</button>
</form>
