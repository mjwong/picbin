import { describe, it, expect } from 'vitest';
import { processImage } from '../../src/lib/server/image';

// 1×1 white JPEG generated via Sharp
const minimalJpeg = Buffer.from('/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpAB//Z', 'base64');

describe('processImage', () => {
  it('returns thumb800 Buffer', async () => {
    const result = await processImage(minimalJpeg);
    expect(result.thumb800).toBeInstanceOf(Buffer);
    expect(result.thumb800.length).toBeGreaterThan(0);
  });

  it('returns thumb300 Buffer', async () => {
    const result = await processImage(minimalJpeg);
    expect(result.thumb300).toBeInstanceOf(Buffer);
    expect(result.thumb300.length).toBeGreaterThan(0);
  });

  it('returns metadata with format jpeg', async () => {
    const result = await processImage(minimalJpeg);
    expect(result.metadata.format).toBe('jpeg');
  });

  it('thumb800 width ≤ 800', async () => {
    const result = await processImage(minimalJpeg);
    const sharp = (await import('sharp')).default;
    const meta = await sharp(result.thumb800).metadata();
    expect(meta.width!).toBeLessThanOrEqual(800);
  });

  it('thumb300 width ≤ 300', async () => {
    const result = await processImage(minimalJpeg);
    const sharp = (await import('sharp')).default;
    const meta = await sharp(result.thumb300).metadata();
    expect(meta.width!).toBeLessThanOrEqual(300);
  });

  it('rejects non-image buffer', async () => {
    await expect(processImage(Buffer.from('not an image'))).rejects.toThrow();
  });
});
