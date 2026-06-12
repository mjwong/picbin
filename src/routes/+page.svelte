<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<h1>Recent Public Albums</h1>

{#if data.albums.length === 0}
  <p>No albums yet. <a href="/register">Create an account</a> to get started.</p>
{:else}
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem">
    {#each data.albums as album}
      {@const owner = (album as any).profiles}
      <a href="/{owner.username}/{album.id}" style="text-decoration:none;color:inherit;border:1px solid #eee;padding:1rem;border-radius:4px;display:block">
        <strong>{album.title}</strong><br>
        <small>by {owner.display_name ?? owner.username}</small>
      </a>
    {/each}
  </div>
{/if}
