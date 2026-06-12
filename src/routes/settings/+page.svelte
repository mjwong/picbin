<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let profile = $derived((data as any).profile);
</script>

<div class="container">
  <div class="form-card card">
    <h1>Profile Settings</h1>
    <p class="meta username-hint">@{profile.username} — username cannot be changed</p>

    {#if form?.error}
      <div class="alert alert-error">{form.error}</div>
    {/if}
    {#if form?.success}
      <div class="alert alert-success">Profile saved.</div>
    {/if}

    <form method="POST" action="?/update" use:enhance>
      <div class="field">
        <label for="display_name">Display Name</label>
        <input id="display_name" type="text" name="display_name" value={profile.display_name ?? ''} placeholder="Your name" />
      </div>
      <div class="field">
        <label for="bio">Bio</label>
        <textarea id="bio" name="bio" rows="4" placeholder="Tell people about yourself…">{profile.bio ?? ''}</textarea>
      </div>
      <div class="form-footer">
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  </div>
</div>

<style>
  .form-card {
    max-width: 540px;
    margin: 0 auto;
    padding: 2rem 2.5rem;
  }
  .form-card h1 { margin-bottom: 0.25rem; }
  .username-hint { margin-bottom: 1.5rem; }
  .form-footer { margin-top: 0.5rem; display: flex; justify-content: flex-end; }
</style>
