import { describe, it, expect } from 'vitest';
import { canViewAlbum } from '../../src/lib/server/access';

function mockSupabase(album: any, share: any, link: any) {
  return {
    from: (table: string) => ({
      select: (_cols: string) => ({
        eq: (_col: string, _val: any) => ({
          eq: (_col2: string, _val2: any) => ({
            single: async () => ({
              data: table === 'album_shares' ? share : link,
            }),
          }),
          single: async () => ({ data: album }),
        }),
      }),
    }),
  } as any;
}

describe('canViewAlbum', () => {
  it('allows public album with no auth', async () => {
    const sb = mockSupabase({ owner_id: 'owner', visibility: 'public' }, null, null);
    expect(await canViewAlbum(sb, 'a1', null, null)).toBe(true);
  });

  it('allows album owner', async () => {
    const sb = mockSupabase({ owner_id: 'u1', visibility: 'restricted' }, null, null);
    expect(await canViewAlbum(sb, 'a1', 'u1', null)).toBe(true);
  });

  it('allows user with share grant', async () => {
    const sb = mockSupabase(
      { owner_id: 'owner', visibility: 'restricted' },
      { album_id: 'a1' },
      null
    );
    expect(await canViewAlbum(sb, 'a1', 'u2', null)).toBe(true);
  });

  it('allows valid non-expired share link', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const sb = mockSupabase(
      { owner_id: 'owner', visibility: 'restricted' },
      null,
      { id: 'l1', expires_at: future }
    );
    expect(await canViewAlbum(sb, 'a1', null, 'tok')).toBe(true);
  });

  it('allows share link with no expiry', async () => {
    const sb = mockSupabase(
      { owner_id: 'owner', visibility: 'restricted' },
      null,
      { id: 'l1', expires_at: null }
    );
    expect(await canViewAlbum(sb, 'a1', null, 'tok')).toBe(true);
  });

  it('denies expired share link', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const sb = mockSupabase(
      { owner_id: 'owner', visibility: 'restricted' },
      null,
      { id: 'l1', expires_at: past }
    );
    expect(await canViewAlbum(sb, 'a1', null, 'tok')).toBe(false);
  });

  it('denies unauthenticated user on restricted album', async () => {
    const sb = mockSupabase({ owner_id: 'owner', visibility: 'restricted' }, null, null);
    expect(await canViewAlbum(sb, 'a1', null, null)).toBe(false);
  });

  it('returns false when album not found', async () => {
    const sb = mockSupabase(null, null, null);
    expect(await canViewAlbum(sb, 'missing', null, null)).toBe(false);
  });
});
