import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestUser, signIn, cleanupUser, adminClient } from './helpers';

const ownerEmail = `share_owner_${Date.now()}@example.com`;
const viewerEmail = `share_viewer_${Date.now()}@example.com`;
const password = 'testpass123';
let ownerId: string;
let viewerId: string;
let albumId: string;

beforeAll(async () => {
  const owner = await createTestUser(ownerEmail, password);
  const viewer = await createTestUser(viewerEmail, password);
  ownerId = owner.id;
  viewerId = viewer.id;

  const { data } = await adminClient
    .from('albums')
    .insert({ owner_id: ownerId, title: 'Restricted', visibility: 'restricted' })
    .select()
    .single();
  albumId = data!.id;
});

afterAll(async () => {
  await adminClient.from('albums').delete().eq('id', albumId);
  await cleanupUser(ownerId);
  await cleanupUser(viewerId);
});

describe('album share RLS', () => {
  it('viewer cannot see restricted album without grant', async () => {
    const { client } = await signIn(viewerEmail, password);
    const { data } = await client.from('albums').select('id').eq('id', albumId).single();
    expect(data).toBeNull();
  });

  it('viewer can see album after admin inserts share row', async () => {
    await adminClient.from('album_shares').insert({ album_id: albumId, user_id: viewerId });

    const { client } = await signIn(viewerEmail, password);
    const { data } = await client.from('albums').select('id').eq('id', albumId).single();
    expect(data?.id).toBe(albumId);
  });

  it('access revoked after share row deleted', async () => {
    await adminClient.from('album_shares').delete()
      .eq('album_id', albumId).eq('user_id', viewerId);

    const { client } = await signIn(viewerEmail, password);
    const { data } = await client.from('albums').select('id').eq('id', albumId).single();
    expect(data).toBeNull();
  });
});
