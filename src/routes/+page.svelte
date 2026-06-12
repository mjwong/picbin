<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="container">
  <div class="page-header">
    <h1>Recent Albums</h1>
    <p>Discover public photography from the community.</p>
  </div>

  {#if data.albums.length === 0}
    <div class="empty-state">
      <p>No albums yet. <a href="/register">Create an account</a> to get started.</p>
    </div>
  {:else}
    <div class="album-grid">
      {#each data.albums as album}
        {@const owner = (album as any).profiles}
        <a href="/{owner.username}/{album.id}" class="album-card">
          <div class="album-card-title">{album.title}</div>
          <div class="album-card-meta">by {owner.display_name ?? owner.username}</div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .page-header { margin-bottom: 2rem; }
  .page-header h1 { margin-bottom: 0.25rem; }
  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--grid-gap);
  }
  .empty-state {
    padding: 3rem;
    text-align: center;
    background: #fff;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-lg);
  }
</style>
