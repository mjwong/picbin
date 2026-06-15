<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  import { browser } from '$app/environment';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let profile = $derived((data as any).profile);
  let avatarPreview = $state<string | null>(null);

  const SLIDESHOW_KEY = 'picbin_slideshow_interval';
  let slideshowInterval = $state(
    browser ? Number(localStorage.getItem(SLIDESHOW_KEY) ?? 4) || 4 : 4
  );
  let slideshowSaved = $state(false);

  function saveSlideshowInterval() {
    const v = Math.max(1, Math.min(10, Math.round(slideshowInterval)));
    slideshowInterval = v;
    localStorage.setItem(SLIDESHOW_KEY, String(v));
    slideshowSaved = true;
    setTimeout(() => { slideshowSaved = false; }, 2000);
  }

  function onAvatarChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) avatarPreview = URL.createObjectURL(file);
  }
</script>

<div class="container">
  <div class="form-card card">
    <h1>Profile Settings</h1>
    <p class="meta username-hint">@{profile.username} — username cannot be changed</p>

    <!-- Avatar -->
    <div class="avatar-section">
      <div class="avatar-preview">
        {#if avatarPreview || profile.avatar_url}
          <img src={avatarPreview ?? profile.avatar_url} alt="Avatar" class="avatar-img" />
        {:else}
          <div class="avatar-placeholder">{(profile.display_name ?? profile.username).charAt(0).toUpperCase()}</div>
        {/if}
      </div>
      <div class="avatar-right">
        <p class="avatar-label">Profile photo</p>
        {#if (form as any)?.avatarError}
          <p class="alert alert-error">{(form as any).avatarError}</p>
        {/if}
        {#if (form as any)?.avatarSuccess}
          <p class="alert alert-success">Avatar updated.</p>
        {/if}
        <form method="POST" action="?/uploadAvatar" enctype="multipart/form-data" use:enhance>
          <label class="btn btn-ghost btn-sm avatar-pick-btn">
            Choose photo
            <input type="file" name="avatar" accept="image/*" class="hidden-input" onchange={onAvatarChange} />
          </label>
          <button type="submit" class="btn btn-primary btn-sm" disabled={!avatarPreview}>Upload</button>
        </form>
      </div>
    </div>

    <hr class="divider" />

    {#if (form as any)?.error}
      <div class="alert alert-error">{(form as any).error}</div>
    {/if}
    {#if (form as any)?.success}
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

    <hr class="divider" />

    <div class="slideshow-section">
      <h2 class="ss-label">Slideshow</h2>
      <div class="ss-row">
        <label for="ss-interval" class="ss-field-label">Interval (seconds)</label>
        <input
          id="ss-interval"
          type="number"
          min="1"
          max="10"
          step="1"
          class="ss-input"
          bind:value={slideshowInterval}
          onkeydown={(e) => e.key === 'Enter' && saveSlideshowInterval()}
        />
        <button class="btn btn-primary btn-sm" onclick={saveSlideshowInterval}>Save</button>
        {#if slideshowSaved}<span class="ss-saved">Saved</span>{/if}
      </div>
      <p class="meta ss-hint">How long each photo is shown before advancing. Default: 4 seconds.</p>
    </div>
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

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .avatar-preview {
    flex-shrink: 0;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-primary);
    border: 2px solid var(--color-border);
  }
  .avatar-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-on-primary);
  }
  .avatar-right { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
  .avatar-label { font-size: 0.875rem; font-weight: 600; margin: 0; }
  .avatar-pick-btn { position: relative; cursor: pointer; }
  .hidden-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }
  .avatar-right form { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

  .divider { border: none; border-top: 1px solid var(--color-border); margin: 1.5rem 0; }

  .slideshow-section { margin-top: 0; }
  .ss-label { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; }
  .ss-row { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
  .ss-field-label { font-size: 0.875rem; color: var(--color-on-surface-variant); white-space: nowrap; }
  .ss-input {
    width: 5rem;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius);
    padding: 0.375rem 0.5rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    outline: none;
    text-align: center;
    color: var(--color-on-surface);
  }
  .ss-input:focus { border-color: var(--color-primary); }
  .ss-saved { font-size: 0.8125rem; color: #1a6e3c; font-weight: 500; }
  .ss-hint { margin-top: 0.5rem; }
</style>
