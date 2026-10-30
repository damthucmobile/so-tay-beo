// core/cloudflare/types.ts
/**
 * Types & Interfaces cho Cloudflare R2 Storage Service
 * Dành cho lưu trữ Media (Hình ảnh, Video, Tệp đính kèm) trong Sổ Tay Béo
 */

export type MediaFolder = 'images' | 'videos' | 'attachments' | 'avatars' | 'notes' | 'timetables';

export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string; // Ví dụ: 'https://media.sotaybeo.vn' hoặc 'https://pub-xxx.r2.dev'
}

export interface PresignedUploadOptions {
  filename: string;
  contentType: string;
  folder?: MediaFolder;
  userId?: string;
  expiresIn?: number; // Mặc định: 3600 giây (1 giờ)
  metadata?: Record<string, string>;
}

export interface PresignedUploadResult {
  uploadUrl: string;    // Direct PUT URL để client upload thẳng lên R2 (không qua backend)
  fileKey: string;      // Key lưu trữ trong bucket (vd: images/2026/10/xyz-photo.jpg)
  publicUrl: string;    // URL công khai để xem/tải ảnh/video từ CDN Cloudflare
  expiresIn: number;    // Thời gian hết hạn của uploadUrl (giây)
}

export interface UploadBufferOptions {
  buffer: Buffer | Uint8Array;
  filename: string;
  contentType: string;
  folder?: MediaFolder;
  userId?: string;
  metadata?: Record<string, string>;
}

export interface R2FileInfo {
  key: string;
  publicUrl: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}

export interface DirectClientUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
