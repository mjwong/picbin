<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let files = $state<File[]>([]);
  let dragging = $state(false);
  let uploading = $state(false);
  let results = $state<{ name: string; ok: boolean; msg: string }[]>([]);
  let done = $state(false);

  let album = $derived((data as any).album);

  function addFiles(incoming: FileList | File[]) {
    const images = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    files = [...files, ...images];
  }

  function onFileInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files) addFiles(input.files);
    input.value = '';
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }

  function onDragLeave(e: DragEvent) {
    if (!(e.currentTarget as Element).contains(e.relatedTarget as Node)) {
      dragging = false;
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  function removeFile(i: number) {
    files = files.filter((_, idx) => idx !== i);
  }

  async function upload() {
    if (!files.length) return;
    uploading = true;
    results = [];
    done = false;

    for (const file of files) {
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
    <!-- Drop zone -->
    <div
      class="upload-zone"
      class:dragging
      class:has-files={files.length > 0}
      class:uploading
      role="region"
      aria-label="Drop zone"
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
    >
      <label class="zone-label">
        <input type="file" accept="image/*" multiple disabled={uploading} class="file-input" onchange={onFileInput} />
        {#if uploading}
          <span class="upload-icon">⏳</span>
          <span class="upload-label">Uploading…</span>
        {:else if dragging}
          <span class="upload-icon">↓</span>
          <span class="upload-label">Drop to add photos</span>
        {:else}
          <span class="upload-icon">↑</span>
          <span class="upload-label">Drop photos here or <span class="browse-link">click to browse</span></span>
          <span class="upload-hint">JPEG, PNG, WEBP — drop multiple files</span>
        {/if}
      </label>
    </div>

    <!-- File list -->
    {#if files.length > 0 && !uploading}
      <ul class="file-list">
        {#each files as file, i}
          <li class="file-row">
            <span class="file-icon">🖼</span>
            <span class="file-name">{file.name}</span>
            <span class="meta file-size">{(file.size / 1024).toFixed(0)} KB</span>
            <button class="remove-btn" onclick={() => removeFile(i)} aria-label="Remove">×</button>
          </li>
        {/each}
      </ul>

      <div class="upload-footer">
        <span class="meta">{files.length} photo{files.length > 1 ? 's' : ''} ready</span>
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
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    transition: border-color 0.15s, background 0.15s;
  }
  .upload-zone.dragging { border-color: var(--color-primary); background: var(--color-primary-fixed); }
  .upload-zone.uploading { pointer-events: none; opacity: 0.7; }

  .zone-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 3rem 2rem;
    cursor: pointer;
    text-align: center;
    position: relative;
  }
  .zone-label:hover { background: var(--color-surface-container-low); border-radius: var(--radius-lg); }

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
  .browse-link { color: var(--color-primary); }
  .upload-hint { font-size: 0.8125rem; color: var(--color-outline); }

  .file-list {
    list-style: none;
    padding: 0;
    margin: 0;
    border-top: 1px solid var(--color-border);
    max-height: 240px;
    overflow-y: auto;
  }
  .file-row {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
    font-size: 0.875rem;
  }
  .file-row:last-child { border-bottom: none; }
  .file-icon { flex-shrink: 0; }
  .file-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--color-on-surface); }
  .file-size { flex-shrink: 0; }
  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-outline);
    font-size: 1.125rem;
    line-height: 1;
    padding: 0 0.125rem;
    flex-shrink: 0;
  }
  .remove-btn:hover { color: var(--color-error); }

  .upload-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
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
