/**
 * Real Uploads API — multipart/form-data image uploads through the separate
 * HttpClient.upload() path. Success is defined ONLY by the backend response:
 * a locally-rendered preview is never treated as an uploaded image.
 */
import type { UploadedFile } from '../types';
import type { UploadsApi } from '../services/uploads';
import { ApiError } from '../errors';
import { httpClient } from './client';
import { isRecord, toNumber, toText } from '../normalize';

/** Documented endpoint: POST /uploads/images (multipart). */
const UPLOAD_IMAGE_PATH = '/uploads/images';

/** Client-side guards mirrored in the contract (backend enforces its own). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class RealUploadsApi implements UploadsApi {
  async uploadImage(file: File): Promise<UploadedFile> {
    if (!file.type.startsWith('image/')) {
      throw new ApiError({
        message: 'Only image files are allowed.',
        status: 0,
        code: 'VALIDATION_ERROR',
        fieldErrors: { image: 'Only image files are allowed' },
      });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ApiError({
        message: 'Image must be 5MB or smaller.',
        status: 0,
        code: 'VALIDATION_ERROR',
        fieldErrors: { image: 'Image must be 5MB or smaller' },
      });
    }

    const formData = new FormData();
    formData.append('image', file, file.name);

    const raw = await httpClient.upload<unknown>(UPLOAD_IMAGE_PATH, formData);
    const url = isRecord(raw) ? toText(raw.url) ?? toText(raw.file) ?? toText(raw.path) : null;
    if (!url) {
      // The backend answered 2xx without a stored URL — the image did NOT
      // reach storage in a usable way. Never fake a success.
      throw new ApiError({
        message: 'The upload could not be confirmed. Please try again.',
        status: 0,
        code: 'UNKNOWN_ERROR',
      });
    }
    return {
      url,
      name: isRecord(raw) ? toText(raw.name) : null,
      size: isRecord(raw) ? toNumber(raw.size) : null,
    };
  }
}
