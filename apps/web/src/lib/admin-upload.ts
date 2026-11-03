import { api } from '@/lib/api';
import type { UploadedAssetDto } from '@/lib/types';

export async function uploadProductImage(file: File): Promise<UploadedAssetDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ image: UploadedAssetDto }>(
    '/admin/uploads/image',
    formData,
  );

  return response.data.image;
}

export async function uploadProductVideo(file: File): Promise<UploadedAssetDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ video: UploadedAssetDto }>(
    '/admin/uploads/video',
    formData,
  );

  return response.data.video;
}
