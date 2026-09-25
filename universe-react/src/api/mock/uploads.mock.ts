/**
 * Mock Uploads API — simulates image upload endpoints for development.
 *
 * The "upload" is the same client-side compression the product forms already
 * use (lib/image.js); the returned data URL stands in for the URL a real
 * backend would return from POST /uploads/images. Success here means the
 * local compression worked — which is exactly why the REAL adapter (and the
 * contract) insist on backend-confirmed success.
 */
import type { UploadedFile } from '../types';
import type { UploadsApi } from '../services/uploads';
import { withMockLatency } from './mockLatency';
import { ApiError } from '../errors';
import { logApi } from '../logger';
import { fileToCompressedDataUrl } from '../../lib/image';

export class MockUploadsApi implements UploadsApi {
  async uploadImage(file: File): Promise<UploadedFile> {
    logApi('POST', '/uploads/images');
    return withMockLatency((async () => {
      try {
        const url = await fileToCompressedDataUrl(file);
        return { url, name: file.name, size: file.size };
      } catch (error) {
        throw new ApiError({
          message: error instanceof Error ? error.message : 'Could not process that image.',
          status: 422,
          code: 'VALIDATION_ERROR',
          fieldErrors: { image: error instanceof Error ? error.message : 'Invalid image' },
        });
      }
    })());
  }
}
