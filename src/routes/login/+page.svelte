<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<div class="container">
  <div class="auth-card card">
    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-subtitle">Sign in to your Picbin account</p>

    {#if form?.error}
      <div class="alert alert-error">{form.error}</div>
    {/if}

    <form method="POST" action="?/login" use:enhance>
      <div class="field">
        <label for="email">Email address</label>
        <input id="email" type="email" name="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" name="password" required autocomplete="current-password" />
      </div>
      <button type="submit" class="btn btn-primary btn-full">Login</button>
    </form>

    <div class="divider"></div>

    <form method="POST" action="?/google" use:enhance>
      <button type="submit" class="btn btn-ghost btn-full">Continue with Google</button>
    </form>

    <p class="auth-footer">
      Don't have an account? <a href="/register">Sign up</a>
    </p>
  </div>
</div>

<style>
  .auth-card {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem 2.5rem;
  }
  .auth-title {
    font-size: 1.75rem;
    margin-bottom: 0.25rem;
  }
  .auth-subtitle {
    margin-bottom: 1.75rem;
    font-size: 0.9375rem;
  }
  .btn-full { width: 100%; justify-content: center; }
  .auth-footer {
    text-align: center;
    font-size: 0.875rem;
    margin: 1rem 0 0;
  }
</style>
