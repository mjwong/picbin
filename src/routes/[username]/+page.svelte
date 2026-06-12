<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const { profile, albums, isOwner } = data as any;
</script>

<h1>{profile.display_name ?? profile.username}</h1>
{#if profile.bio}<p>{profile.bio}</p>{/if}

{#if isOwner}
  <a href="/albums/new">+ New Album</a>
{/if}

<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;margin-top:1rem">
  {#each albums as album}
    <a href="/{profile.username}/{album.id}" style="text-decoration:none;color:inherit;border:1px solid #eee;padding:1rem;border-radius:4px;display:block">
      <strong>{album.title}</strong>
      <br><small>{album.visibility === 'restricted' ? '🔒 Restricted' : '🌐 Public'}</small>
    </a>
  {:else}
    <p>No albums yet.</p>
  {/each}
</div>
