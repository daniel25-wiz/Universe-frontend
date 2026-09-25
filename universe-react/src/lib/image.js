/**
 * Client-side image processing for product uploads.
 *
 * The mock backend stores images as data URLs, so uploads are compressed in
 * the browser (downscale + JPEG re-encode) before being persisted — the same
 * technique real frontends use to cut upload sizes before hitting an API.
 */

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB source limit
const MAX_OUTPUT_CHARS = 500_000; // keep the compressed data URL reasonable

/**
 * Size the product-image pipeline aims for. The seller's photo is compressed
 * into ONE ~70KB WebP file, and that single file is used by BOTH the
 * marketplace card and the product detail view — no separate card/detail or
 * HD/zoom variants are produced, and the original file is discarded.
 */
export const PRODUCT_IMAGE_TARGET_BYTES = 70 * 1024;

/** Source limit mirrored by POST /uploads/images (the backend enforces its own). */
export const MAX_SOURCE_IMAGE_BYTES = MAX_INPUT_BYTES;

/** Longest-edge cap for the stored product image (card + detail share it). */
const PRODUCT_IMAGE_MAX_DIM = 1280;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Read a File as a data URL WITHOUT re-encoding it. Used by the mock upload
 * adapter for files that were already compressed by the product form.
 */
export function fileToDataUrl(file) {
  if (!file) throw new Error('No file selected.');
  return readAsDataUrl(file);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a valid image.'));
    img.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      type,
      quality,
    );
  });
}

/**
 * Convert an image File to a compressed JPEG data URL, downscaled so its
 * longest edge is at most `maxDim` px.
 */
export async function fileToCompressedDataUrl(file, { maxDim = 900, quality = 0.75 } = {}) {
  if (!file) throw new Error('No file selected.');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Image must be 5MB or smaller.');

  const sourceUrl = await readAsDataUrl(file);
  let image;
  try {
    image = await loadImage(sourceUrl);
  } catch {
    throw new Error('That file is not a valid image.');
  }

  const scale = Math.min(1, maxDim / Math.max(image.width || 1, image.height || 1));
  const width = Math.max(1, Math.round((image.width || maxDim) * scale));
  const height = Math.max(1, Math.round((image.height || maxDim) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support image processing.');
  ctx.drawImage(image, 0, 0, width, height);

  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  // Second pass at a lower quality if the first is still too big.
  if (dataUrl.length > MAX_OUTPUT_CHARS) {
    dataUrl = canvas.toDataURL('image/jpeg', 0.5);
  }
  if (dataUrl.length > MAX_OUTPUT_CHARS) {
    throw new Error('Image is still too large after compression — try a smaller file.');
  }
  return dataUrl;
}

/**
 * Compress one selected photo into a SINGLE ~70KB WebP file.
 *
 * Used by the product form at SUBMIT time (never while the seller is still
 * filling the form in). The same returned file backs BOTH the product card and
 * the product detail view — no separate card/detail or HD/zoom variants are
 * produced — and the original selection is discarded as soon as the compressed
 * file exists, so the seller's full-resolution photo is never uploaded.
 *
 * Quality is stepped down first, then the pixel dimensions, until the encoded
 * WebP fits `targetBytes`. Browsers that cannot encode WebP fall back to JPEG.
 *
 * @returns a File ready to POST to /uploads/images.
 */
export async function fileToProductImageFile(file, {
  targetBytes = PRODUCT_IMAGE_TARGET_BYTES,
  maxDim = PRODUCT_IMAGE_MAX_DIM,
} = {}) {
  if (!file) throw new Error('No image selected.');
  if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Image must be 5MB or smaller.');

  // Decode straight from an object URL and revoke it immediately after — the
  // original file is never re-read once we have the pixels.
  const objectUrl = URL.createObjectURL(file);
  let image;
  try {
    image = await loadImage(objectUrl);
  } catch {
    throw new Error('That file is not a valid image.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const scale = Math.min(1, maxDim / Math.max(image.width || 1, image.height || 1));
  let width = Math.max(1, Math.round((image.width || maxDim) * scale));
  let height = Math.max(1, Math.round((image.height || maxDim) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not support image processing.');
  ctx.drawImage(image, 0, 0, width, height);

  const qualities = [0.82, 0.7, 0.6, 0.5, 0.42];
  let mimeType = 'image/webp';
  let blob = await canvasToBlob(canvas, mimeType, qualities[0]);
  if (blob.type !== 'image/webp') {
    // The browser ignored the WebP request (it silently returns PNG then) —
    // JPEG is the next best single-file format.
    mimeType = 'image/jpeg';
    blob = await canvasToBlob(canvas, mimeType, qualities[0]);
  }

  for (const quality of qualities.slice(1)) {
    if (blob.size <= targetBytes) break;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }

  // Quality alone was not enough — shrink the pixels and re-encode. The canvas
  // is cleared by resizing, so the source image is drawn again each round.
  let attempts = 0;
  while (blob.size > targetBytes && attempts < 4) {
    attempts += 1;
    const shrink = Math.max(0.55, Math.sqrt(targetBytes / blob.size));
    width = Math.max(1, Math.round(width * shrink));
    height = Math.max(1, Math.round(height * shrink));
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    blob = await canvasToBlob(canvas, mimeType, qualities[qualities.length - 1]);
  }

  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `product-image.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
