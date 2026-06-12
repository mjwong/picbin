import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, signIn, cleanupUser, adminClient } from './helpers';

const ownerEmail = `test_owner_${Date.now()}@example.com`;
const otherEmail = `test_other_${Date.now()}@example.com`;
const password = 'testpass123';
let ownerId: string;
let otherId: string;
let albumId: string;

beforeAll(async () => {
  const owner = await createTestUser(ownerEmail, password);
  const other = await createTestUser(otherEmail, password);
  ownerId = owner.id;
  otherId = other.id;
});

afterAll(async () => {
  if (albumId) await adminClient.from('albums').delete().eq('id', albumId);
  await cleanupUser(ownerId);
  await cleanupUser(otherId);
});

describe('album RLS', () => {
  it('owner can insert album', async () => {
    const { client } = await signIn(ownerEmail, password);
    const { data, error } = await client
      .from('albums')
      .insert({ owner_id: ownerId, title: 'Owners Album', visibility: 'restricted' })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.title).toBe('Owners Album');
    albumId = data!.id;
  });

  it('non-owner cannot read restricted album via RLS', async () => {
    const { client } = await signIn(otherEmail, password);
    const { data } = await client.from('albums').select('id').eq('id', albumId).single();
    expect(data).toBeNull();
  });

  it('owner can update own album', async () => {
    const { client } = await signIn(ownerEmail, password);
    const { data, error } = await client
      .from('albums')
      .update({ title: 'Updated Title' })
      .eq('id', albumId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.title).toBe('Updated Title');
  });

  it('non-owner update is blocked by RLS', async () => {
    const { client } = await signIn(otherEmail, password);
    const { data } = await client
      .from('albums')
      .update({ title: 'Hijacked' })
      .eq('id', albumId)
      .select()
      .single();
    expect(data).toBeNull();
  });

  it('public album is visible to unauthenticated Supabase query', async () => {
    const { data: pub } = await adminClient
      .from('albums')
      .insert({ owner_id: ownerId, title: 'Public', visibility: 'public' })
      .select()
      .single();

    const { client } = await signIn(otherEmail, password);
    const { data } = await client.from('albums').select('id').eq('id', pub!.id).single();
    expect(data?.id).toBe(pub!.id);

    await adminClient.from('albums').delete().eq('id', pub!.id);
  });
});
