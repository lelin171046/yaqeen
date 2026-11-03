import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const cloudName = env.CLOUDINARY_CLOUD_NAME;
const apiKey = env.CLOUDINARY_API_KEY;
const apiSecret = env.CLOUDINARY_API_SECRET;

const configured = Boolean(cloudName && apiKey && apiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export function isCloudinaryConfigured(): boolean {
  return configured;
}

export interface UploadedAsset {
  url: string;
  publicId: string;
}

export type UploadedImage = UploadedAsset;

function uploadBuffer(
  buffer: Buffer,
  resourceType: 'image' | 'video',
  folder: string,
): Promise<UploadedAsset> {
  if (!configured) {
    throw new AppError(
      503,
      'Uploads are not configured. Add Cloudinary credentials in the API environment.',
      'UPLOAD_NOT_CONFIGURED',
    );
  }

  return new Promise<UploadedAsset>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        transformation:
          resourceType === 'image'
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(
            new AppError(502, 'Upload failed. Please try again.', 'UPLOAD_FAILED', {
              providerMessage: error?.message,
            }),
          );
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}

export function uploadImageBuffer(
  buffer: Buffer,
  folder = 'yaqeen/products',
): Promise<UploadedAsset> {
  return uploadBuffer(buffer, 'image', folder);
}

export function uploadVideoBuffer(
  buffer: Buffer,
  folder = 'yaqeen/products/videos',
): Promise<UploadedAsset> {
  return uploadBuffer(buffer, 'video', folder);
}

export async function deleteCloudinaryAsset(
  publicId: string,
  resourceType: 'image' | 'video' = 'image',
): Promise<void> {
  if (!configured || !publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await deleteCloudinaryAsset(publicId, 'image');
}
