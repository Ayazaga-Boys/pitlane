export const CF_IMAGE_VARIANTS = [
  { name: 'thumb', width: 120, height: 120, fit: 'cover', usage: 'avatar_preview' },
  { name: 'feed', width: 640, height: 480, fit: 'contain', usage: 'feed_card' },
  { name: 'full', width: 1920, height: 1080, fit: 'contain', usage: 'fullscreen' },
  { name: 'square', width: 400, height: 400, fit: 'cover', usage: 'community_cover' },
] as const;

export function getMediaDeliveryConfig() {
  return {
    cloudflare_images_account_hash: process.env.CF_IMAGES_ACCOUNT_HASH ?? null,
    cloudflare_stream_cdn_base: process.env.CF_STREAM_CDN_BASE ?? null,
    image_variants: CF_IMAGE_VARIANTS,
  };
}

export function buildCloudflareImageUrl(input: {
  accountHash: string;
  imageId: string;
  variant: string;
}): string {
  return `https://imagedelivery.net/${input.accountHash}/${input.imageId}/${input.variant}`;
}
