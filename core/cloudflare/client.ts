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

  // Sử dụng endpoint nội bộ /api/media/upload để loại bỏ 100% lỗi CORS
  // Đồng thời sử dụng XMLHttpRequest để hiển thị thanh đo tiến trình % tải lên
  return new Promise<ClientUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    xhr.open('POST', '/api/media/upload', true);

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
      try {
        const response = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve({
            fileKey: response.fileKey,
            publicUrl: response.publicUrl,
          });
        } else {
          reject(
            new Error(
              response.error || `Tải file lên Cloudflare R2 thất bại với mã lỗi HTTP: ${xhr.status}`
            )
          );
        }
      } catch {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ fileKey: '', publicUrl: '' });
        } else {
          reject(new Error(`Tải tệp thất bại (HTTP ${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Lỗi kết nối khi gửi tệp lên máy chủ.'));
    };

    xhr.send(formData);
  });
}
