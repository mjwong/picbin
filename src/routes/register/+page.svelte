<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<h1>Create Account</h1>

{#if form?.error}
  <p style="color:red">{form.error}</p>
{/if}

{#if form?.success}
  <p>Check your email to confirm your account.</p>
{:else}
  <form method="POST" action="?/register" use:enhance>
    <label>Username<br><input type="text" name="username" pattern="[a-z0-9_]{3,30}" required /></label><br>
    <label>Email<br><input type="email" name="email" required /></label><br>
    <label>Password<br><input type="password" name="password" minlength="8" required /></label><br>
    <button type="submit">Create Account</button>
  </form>
  <p><a href="/login">Already have an account?</a></p>
{/if}
