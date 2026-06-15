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
        <a href="/{data.user.user_metadata?.preferred_username}" class="nav-user">
          {#if (data as any).profile?.avatar_url}
            <img src={(data as any).profile.avatar_url} alt="avatar" class="nav-avatar" />
          {:else}
            <span class="nav-avatar nav-avatar-letter">
              {((data as any).profile?.display_name ?? data.user.user_metadata?.preferred_username ?? '?').charAt(0).toUpperCase()}
            </span>
          {/if}
          <span class="nav-display-name">
            {(data as any).profile?.display_name ?? data.user.user_metadata?.preferred_username}
          </span>
        </a>
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
  .nav-user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.625rem 0.25rem 0.25rem;
    border-radius: var(--radius-full);
    text-decoration: none;
    transition: background 0.15s;
  }
  .nav-user:hover { background: var(--color-surface-container-low); }
  .nav-avatar {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    flex-shrink: 0;
  }
  .nav-avatar-letter {
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-display-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-on-surface);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .site-main {
    padding: 2rem 0 4rem;
  }
</style>
