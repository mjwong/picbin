<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  const usernamePattern = '[a-z0-9_]{3,30}';
</script>

<div class="container">
  <div class="auth-card card">
    <h1 class="auth-title">Create account</h1>
    <p class="auth-subtitle">Start sharing your photography on Picbin</p>

    {#if form?.error}
      <div class="alert alert-error">{form.error}</div>
    {/if}

    {#if form?.success}
      <div class="alert alert-success">
        Check your email to confirm your account.
      </div>
    {:else}
      <form method="POST" action="?/register" use:enhance>
        <div class="field">
          <label for="username">Username</label>
          <input id="username" type="text" name="username" pattern={usernamePattern} placeholder="lowercase letters, numbers, _" required />
        </div>
        <div class="field">
          <label for="email">Email address</label>
          <input id="email" type="email" name="email" required autocomplete="email" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" name="password" minlength="8" required autocomplete="new-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-full">Create Account</button>
      </form>

      <p class="auth-footer">
        Already have an account? <a href="/login">Login</a>
      </p>
    {/if}
  </div>
</div>

<style>
  .auth-card {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem 2.5rem;
  }
  .auth-title { font-size: 1.75rem; margin-bottom: 0.25rem; }
  .auth-subtitle { margin-bottom: 1.75rem; font-size: 0.9375rem; }
  .btn-full { width: 100%; justify-content: center; }
  .auth-footer { text-align: center; font-size: 0.875rem; margin: 1rem 0 0; }
</style>
