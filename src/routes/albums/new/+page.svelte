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

<div class="container">
  <div class="form-card card">
    <h1>New Album</h1>
    <p>Create an album to start sharing your photos.</p>

    {#if errorMsg}
      <div class="alert alert-error">{errorMsg}</div>
    {/if}

    <form onsubmit={submit}>
      <div class="field">
        <label for="title">Title</label>
        <input id="title" type="text" bind:value={title} required placeholder="My Album" />
      </div>
      <div class="field">
        <label for="desc">Description</label>
        <textarea id="desc" bind:value={description} rows="3" placeholder="Optional description…"></textarea>
      </div>

      <fieldset>
        <legend>Visibility</legend>
        <label>
          <input type="radio" bind:group={visibility} value="public" />
          <span><strong>Public</strong> — anyone can view</span>
        </label>
        <label>
          <input type="radio" bind:group={visibility} value="restricted" />
          <span><strong>Restricted</strong> — only people you share with</span>
        </label>
      </fieldset>

      <div class="form-footer">
        <button type="submit" class="btn btn-primary" disabled={submitting || !title.trim()}>
          {submitting ? 'Creating…' : 'Create Album'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .form-card {
    max-width: 540px;
    margin: 0 auto;
    padding: 2rem 2.5rem;
  }
  .form-card h1 { margin-bottom: 0.25rem; }
  .form-card > p { margin-bottom: 1.5rem; }
  fieldset { margin-bottom: 1.5rem; }
  .form-footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
</style>
