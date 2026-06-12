<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const profile = (data as any).profile;
</script>

<h1>Profile Settings</h1>

{#if form?.error}<p style="color:red">{form.error}</p>{/if}
{#if form?.success}<p style="color:green">Saved!</p>{/if}

<form method="POST" action="?/update" use:enhance>
  <label>Display Name<br>
    <input type="text" name="display_name" value={profile.display_name ?? ''} />
  </label><br><br>
  <label>Bio<br>
    <textarea name="bio" rows="4">{profile.bio ?? ''}</textarea>
  </label><br><br>
  <p>Username: <strong>{profile.username}</strong> (cannot be changed)</p>
  <button type="submit">Save</button>
</form>
