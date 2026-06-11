<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<h1>Login</h1>

{#if form?.error}
  <p style="color:red">{form.error}</p>
{/if}

<form method="POST" action="?/login" use:enhance>
  <label>Email<br><input type="email" name="email" required /></label><br>
  <label>Password<br><input type="password" name="password" required /></label><br>
  <button type="submit">Login</button>
</form>

<br>

<form method="POST" action="?/google" use:enhance>
  <button type="submit">Continue with Google</button>
</form>

<p><a href="/register">Create an account</a></p>
