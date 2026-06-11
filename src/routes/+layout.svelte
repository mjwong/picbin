<script lang="ts">
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<nav>
  <a href="/">Picbin</a>
  {#if data.user}
    <a href="/albums/new">New Album</a>
    <a href="/settings">Settings</a>
    <form method="POST" action="/login?/logout">
      <button type="submit">Logout</button>
    </form>
  {:else}
    <a href="/login">Login</a>
    <a href="/register">Register</a>
  {/if}
</nav>

<main>
  {@render children()}
</main>

<style>
  nav { display: flex; gap: 1rem; padding: 1rem; border-bottom: 1px solid #eee; align-items: center; }
  nav a { text-decoration: none; color: inherit; }
  main { padding: 1rem; }
</style>
