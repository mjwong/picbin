import sharp from 'sharp';

export interface ProcessedImage {
  thumb800: Buffer;
  thumb300: Buffer;
  metadata: sharp.Metadata;
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const [thumb800, thumb300, metadata] = await Promise.all([
    sharp(input)
      .resize(800, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer(),
    sharp(input)
      .resize(300, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer(),
    sharp(input).metadata(),
  ]);

  return { thumb800, thumb300, metadata };
}
