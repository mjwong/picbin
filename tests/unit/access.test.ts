import { describe, it, expect } from 'vitest';
import { canViewAlbum } from '../../src/lib/server/access';

function mockSupabase(result: boolean | null) {
  return {
    rpc: (_fn: string, _args: any) => Promise.resolve({ data: result }),
  } as any;
}

describe('canViewAlbum', () => {
  it('returns true when rpc returns true', async () => {
    expect(await canViewAlbum(mockSupabase(true), 'a1', 'u1', null)).toBe(true);
  });

  it('returns false when rpc returns false', async () => {
    expect(await canViewAlbum(mockSupabase(false), 'a1', null, null)).toBe(false);
  });

  it('returns false when rpc returns null', async () => {
    expect(await canViewAlbum(mockSupabase(null), 'a1', null, null)).toBe(false);
  });
});
