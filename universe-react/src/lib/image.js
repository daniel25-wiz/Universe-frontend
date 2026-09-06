/**
 * Client-side image processing for product uploads.
 *
 * The mock backend stores images as data URLs, so uploads are compressed in
 * the browser (downscale + JPEG re-encode) before being persisted — the same
 * technique real frontends use to cut upload sizes before hitting an API.
 */

const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5MB source limit
const MAX_OUTPUT_CHARS = 500_000; // keep the compressed data URL reasonable

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a valid image.'));
    img.src = src;
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
