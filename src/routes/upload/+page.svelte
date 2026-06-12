<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let files = $state<FileList | null>(null);
  let uploading = $state(false);
  let results = $state<{ name: string; ok: boolean; msg: string }[]>([]);
  let done = $state(false);

  let album = $derived((data as any).album);

  async function upload() {
    if (!files?.length) return;
    uploading = true;
    results = [];
    done = false;

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('albumId', album.id);
      fd.append('title', file.name.replace(/\.[^.]+$/, ''));

      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
      if (res.ok) {
        results = [...results, { name: file.name, ok: true, msg: 'uploaded' }];
      } else {
        const body = await res.json().catch(() => ({}));
        results = [...results, { name: file.name, ok: false, msg: (body as any).message ?? 'failed' }];
      }
    }

    uploading = false;
    done = true;
  }
</script>

<div class="container">
  <div class="page-header">
    <p class="eyebrow">Uploading to</p>
    <h1>{album.title}</h1>
  </div>

  <div class="upload-card card">
    <label class="upload-zone" class:has-files={!!files?.length} class:uploading>
      <input type="file" accept="image/*" multiple bind:files disabled={uploading} class="file-input" />
      {#if uploading}
        <span class="upload-icon">⏳</span>
        <span class="upload-label">Uploading…</span>
      {:else if files?.length}
        <span class="upload-icon">📁</span>
        <span class="upload-label">{files.length} file{files.length > 1 ? 's' : ''} selected</span>
        <span class="upload-hint">Click to change selection</span>
      {:else}
        <span class="upload-icon">↑</span>
        <span class="upload-label">Drop photos here or click to browse</span>
        <span class="upload-hint">JPEG, PNG, WEBP — multiple files supported</span>
      {/if}
    </label>

    {#if files?.length && !uploading && !done}
      <div class="upload-footer">
        <button class="btn btn-primary" onclick={upload}>
          Upload {files.length} photo{files.length > 1 ? 's' : ''}
        </button>
      </div>
    {/if}
  </div>

  {#if results.length}
    <div class="results-list">
      {#each results as r}
        <div class="result-item {r.ok ? 'ok' : 'err'}">
          <span class="result-icon">{r.ok ? '✓' : '✗'}</span>
          <span class="result-name">{r.name}</span>
          <span class="result-msg meta">{r.msg}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if done}
    <div class="done-banner">
      <span>Upload complete.</span>
      <a href="/{album.profiles.username}/{album.id}" class="btn btn-primary btn-sm">View album →</a>
    </div>
  {/if}
</div>

<style>
  .page-header { margin-bottom: 1.5rem; }
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-outline);
    font-family: var(--font-mono);
    margin: 0;
  }
  .page-header h1 { margin-top: 0.125rem; }

  .upload-card { overflow: visible; }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 3rem 2rem;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    text-align: center;
    position: relative;
  }
  .upload-zone:hover, .upload-zone.has-files { border-color: var(--color-primary); background: var(--color-primary-fixed); }
  .upload-zone.uploading { pointer-events: none; opacity: 0.7; }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
  .upload-icon { font-size: 2.5rem; line-height: 1; }
  .upload-label { font-family: var(--font-display); font-weight: 600; font-size: 1rem; color: var(--color-on-surface); }
  .upload-hint { font-size: 0.8125rem; color: var(--color-outline); }

  .upload-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
  }

  .results-list { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.375rem; }
  .result-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
  }
  .result-item.ok { background: #d6f5e3; color: #0a5a2f; }
  .result-item.err { background: var(--color-error-container); color: #7f0012; }
  .result-name { flex: 1; font-weight: 500; }

  .done-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.5rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    font-weight: 500;
  }
</style>
