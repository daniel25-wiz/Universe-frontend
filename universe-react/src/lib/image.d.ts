/**
 * Type declarations for src/lib/image.js (browser image compression).
 */

/** Size the stored product image aims for (~70KB), shared by card + detail. */
export const PRODUCT_IMAGE_TARGET_BYTES: number;

/** Source limit mirrored by POST /uploads/images (5MB). */
export const MAX_SOURCE_IMAGE_BYTES: number;

export interface CompressOptions {
  /** Longest-edge cap in px (downscales larger images). */
  maxDim?: number;
  /** JPEG quality 0..1. */
  quality?: number;
}

export interface ProductImageOptions {
  /** Size the encoded WebP aims for, in bytes. Defaults to ~70KB. */
  targetBytes?: number;
  /** Longest-edge cap in px (downscales larger images). */
  maxDim?: number;
}

/**
 * Convert an image File to a compressed JPEG data URL, downscaled so its
 * longest edge is at most `maxDim` px. Throws when the file is missing, not
 * an image, over 5MB, or still too large after compression.
 */
export function fileToCompressedDataUrl(
  file: File,
  options?: CompressOptions,
): Promise<string>;

/** Read a File as a data URL without re-encoding it. */
export function fileToDataUrl(file: File): Promise<string>;

/**
 * Compress one selected photo into a SINGLE ~70KB WebP File, used by BOTH the
 * product card and the product detail view (no card/detail or HD variants).
 * The original selection is discarded. Falls back to JPEG when WebP encoding
 * is unavailable. Throws when the file is missing, not an image, or over 5MB.
 */
export function fileToProductImageFile(
  file: File,
  options?: ProductImageOptions,
): Promise<File>;
