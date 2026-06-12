<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let files = $state<FileList | null>(null);
  let uploading = $state(false);
  let results = $state<{ name: string; ok: boolean; msg: string }[]>([]);
  let done = $state(false);

  const album = data.album as any;

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

<h1>Upload to "{album.title}"</h1>

<input type="file" accept="image/*" multiple bind:files disabled={uploading} />
<br><br>
<button onclick={upload} disabled={!files?.length || uploading}>
  {uploading ? 'Uploading…' : `Upload ${files?.length ?? 0} photo(s)`}
</button>

{#if results.length}
  <ul>
    {#each results as r}
      <li style="color:{r.ok ? 'green' : 'red'}">{r.name} — {r.msg}</li>
    {/each}
  </ul>
{/if}

{#if done}
  <p>
    <a href="/{album.profiles.username}/{album.id}">View album →</a>
  </p>
{/if}
