import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

const EMAIL = `e2e_social_${Date.now()}@example.com`;
const PASSWORD = 'testpass123';

test.beforeAll(async () => {
  await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { preferred_username: `social_${Date.now()}` } });
});

test.afterAll(async () => {
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find(u => u.email === EMAIL);
  if (user) await admin.auth.admin.deleteUser(user.id);
});

test('like and comment on a photo', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', EMAIL);
  await page.fill('input[name=password]', PASSWORD);
  await page.click('button:has-text("Login")');
  await page.waitForURL('/');

  await page.goto('/albums/new');
  await page.fill('input[type=text]', 'Social Test Album');
  await page.click('button:has-text("Create Album")');
  await page.waitForURL(/\/upload\?albumId=/);
  await page.setInputFiles('input[type=file]', path.join(process.cwd(), 'tests/fixtures/test.jpg'));
  await page.click('button:has-text("Upload")');
  await expect(page.locator('text=View album')).toBeVisible({ timeout: 15_000 });
  await page.click('text=View album');

  await page.locator('a img').first().click();
  await page.waitForURL(/localhost:5173\/[^/]+\/[^/]+\/[^/]+/);

  await page.click('button:has-text("Like")');
  await expect(page.locator('button:has-text("Unlike")')).toBeVisible({ timeout: 10_000 });

  await page.fill('textarea', 'Great photo!');
  await page.click('button:has-text("Comment")');
  await expect(page.locator('text=Great photo!')).toBeVisible({ timeout: 10_000 });
});
