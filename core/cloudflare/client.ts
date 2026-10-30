// core/cloudflare/client.ts
/**
 * Tiện ích tải tệp trực tiếp từ trình duyệt (Client-side) lên Cloudflare R2
 * Sử dụng Presigned URL để upload trực tiếp, có thanh đo % tiến trình (progress)
 */

import { MediaFolder, DirectClientUploadProgress } from './types';

export interface ClientUploadOptions {
  folder?: MediaFolder;
  onProgress?: (progress: DirectClientUploadProgress) => void;
  metadata?: Record<string, string>;
}

export interface ClientUploadResult {
  fileKey: string;
  publicUrl: string;
}

/**
 * Upload một File (ảnh, video, tài liệu) trực tiếp từ trình duyệt lên Cloudflare R2
 */
export async function uploadFileToR2(
  file: File,
  options: ClientUploadOptions = {}
): Promise<ClientUploadResult> {
  const { folder = 'images', onProgress, metadata } = options;

  // 1. Gọi API nội bộ của Next.js để xin cấp mã Presigned Upload URL
  const presignRes = await fetch('/api/media/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      folder,
      metadata,
    }),
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Không thể lấy liên kết tải lên từ máy chủ Cloudflare R2.');
  }

  const { uploadUrl, fileKey, publicUrl } = await presignRes.json();

  // 2. Upload trực tiếp file lên Cloudflare R2 (qua XMLHttpRequest để theo dõi % tiến độ)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Tải file lên Cloudflare R2 thất bại với mã lỗi HTTP: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Lỗi kết nối mạng khi tải tệp lên Cloudflare R2.'));
    };

    xhr.send(file);
  });

  return {
    fileKey,
    publicUrl,
  };
}
