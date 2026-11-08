// core/utils/imageCompressor.ts
/**
 * Tiện ích nén và tối ưu hóa hình ảnh tài liệu y tế ở phía Client dạng Binary Blob.
 * Sử dụng Canvas.toBlob trực tiếp để đóng gói vào FormData mà không tốn 33% overhead của Base64.
 * Giữ nguyên độ sắc nét cao (tối đa 1920px, JPEG 0.82) tối ưu nhất cho OCR AI (Gemini Vision).
 */

export interface CompressionOptions {
  maxDimension?: number; // Chiều dài hoặc rộng tối đa (mặc định: 1920px)
  quality?: number; // Chất lượng nén JPEG từ 0.1 đến 1.0 (mặc định: 0.82)
  maxSizeBytes?: number; // Ngưỡng dung lượng mong muốn (mặc định: 1.2MB)
}

export interface CompressedFileResult {
  blob: Blob | File;
  size: number; // Dung lượng nhị phân thực tế (Bytes)
  mimeType: string;
  originalSize: number;
  isCompressed: boolean;
  previewUrl?: string;
  width?: number;
  height?: number;
  base64?: string; // Tùy chọn fallback
}

/**
 * Định dạng số bytes thành chuỗi hiển thị thân thiện (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Nén một file ảnh thông qua HTML Canvas và xuất ra Blob nhị phân
 */
async function compressImageOnCanvas(
  file: File,
  maxDimension: number,
  quality: number
): Promise<{ blob: Blob; size: number; width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Tính toán kích thước mới giữ nguyên tỉ lệ khung hình
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Trình duyệt không hỗ trợ Canvas 2D'));
        return;
      }

      // Tô nền trắng đề phòng PNG trong suốt bị đen nền khi xuất JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Kích hoạt thuật toán làm mượt hình ảnh chất lượng cao để chữ in y tế rõ nét
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Không thể nén ảnh sang Blob'));
            return;
          }
          const previewUrl = URL.createObjectURL(blob);
          resolve({
            blob,
            size: blob.size,
            width,
            height,
            previewUrl,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể tải hoặc xử lý tệp ảnh này'));
    };

    img.src = objectUrl;
  });
}

/**
 * Nén và chuẩn hóa tệp sang Binary Blob chuẩn bị đưa vào FormData gửi lên AI API
 * Tự động tối ưu ảnh chụp camera điện thoại (3-15MB) xuống ~300KB - 600KB giữ trọn độ nét.
 */
export async function processFileForAi(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedFileResult> {
  const {
    maxDimension = 1920,
    quality = 0.82,
    maxSizeBytes = 1.2 * 1024 * 1024, // 1.2MB
  } = options;

  // Nếu là tệp ảnh
  if (file.type.startsWith('image/')) {
    try {
      let result = await compressImageOnCanvas(file, maxDimension, quality);

      // Nếu sau lần 1 dung lượng vẫn lớn hơn ngưỡng mong muốn (> 1.2MB), nén lần 2 với chất lượng 0.72
      if (result.size > maxSizeBytes) {
        const pass2 = await compressImageOnCanvas(file, Math.min(maxDimension, 1600), 0.72);
        if (pass2.size < result.size) {
          // Giải phóng URL tạm của pass 1
          URL.revokeObjectURL(result.previewUrl);
          result = pass2;
        } else {
          URL.revokeObjectURL(pass2.previewUrl);
        }
      }

      return {
        blob: result.blob,
        size: result.size,
        mimeType: 'image/jpeg',
        originalSize: file.size,
        isCompressed: true,
        previewUrl: result.previewUrl,
        width: result.width,
        height: result.height,
      };
    } catch (err) {
      console.warn('Lỗi khi nén ảnh bằng Canvas, dùng fallback File gốc:', err);
    }
  }

  // Trường hợp PDF hoặc tệp văn bản khác: giữ nguyên file nhị phân gốc
  return {
    blob: file,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    originalSize: file.size,
    isCompressed: false,
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  };
}

/**
 * Nén ảnh thành chuỗi DataURL (Base64) dung lượng nhẹ (< 500KB)
 * Phục vụ gửi ảnh qua AI Chat mà không bị lỗi Vercel Payload Too Large (413).
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.8
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Trình duyệt không hỗ trợ Canvas 2D'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const clean = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const size = Math.floor((clean.length * 3) / 4);
      resolve({ dataUrl, size });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể tải hoặc xử lý tệp ảnh này'));
    };

    img.src = objectUrl;
  });
}

