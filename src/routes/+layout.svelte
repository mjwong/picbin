<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="wordmark">picbin</a>
    <nav class="nav-links">
      {#if data.user}
        <a href="/albums/new" class="btn btn-ghost btn-sm">+ New Album</a>
        <a href="/settings" class="nav-link">Settings</a>
        <form method="POST" action="/login?/logout" style="display:contents">
          <button type="submit" class="nav-link nav-link-btn">Logout</button>
        </form>
      {:else}
        <a href="/login" class="nav-link">Login</a>
        <a href="/register" class="btn btn-primary btn-sm">Sign up</a>
      {/if}
    </nav>
  </div>
</header>

<main class="site-main">
  {@render children()}
</main>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(250, 248, 255, 0.92);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--color-border);
  }
  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 3.5rem;
  }
  .wordmark {
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.03em;
    text-decoration: none;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .nav-link {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    color: var(--color-on-surface-variant);
    border-radius: var(--radius);
    transition: color 0.15s, background 0.15s;
    text-decoration: none;
  }
  .nav-link:hover { color: var(--color-on-surface); background: var(--color-surface-container-low); text-decoration: none; }
  .nav-link-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-weight: 400;
  }
  .site-main {
    padding: 2rem 0 4rem;
  }
</style>
