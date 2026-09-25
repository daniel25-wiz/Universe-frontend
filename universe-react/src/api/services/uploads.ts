/**
 * Uploads API contract + factory.
 *
 * Keeps multipart/form-data file uploads SEPARATE from the JSON request
 * family: `uploadImage()` posts FormData through HttpClient.upload() and its
 * success is defined ONLY by the backend response — a rendered local preview
 * is never treated as a completed upload.
 *
 * Product/seller image fields remain URL strings in the JSON contract
 * (http(s) URL, or a small data URL for the mock). Real deployments should
 * upload the file here first and attach the returned URL to the product or
 * profile payload — see docs/API_CONTRACT.md -> Uploads.
 */
import type { UploadedFile } from '../types';
import { apiConfig } from '../config';
import { MockUploadsApi } from '../mock/uploads.mock';
import { RealUploadsApi } from '../real/uploads.api';

export interface UploadsApi {
  /**
   * Upload one image file. Resolves with the backend-stored URL, or rejects
   * with ApiError when the backend rejects/limits the file.
   */
  uploadImage(file: File): Promise<UploadedFile>;
}

export const uploadsApi: UploadsApi =
  apiConfig.mode === 'real' ? new RealUploadsApi() : new MockUploadsApi();
