// core/cloudflare/r2Client.ts
import { S3Client } from '@aws-sdk/client-s3';
import { CloudflareR2Config } from './types';

/**
 * Đọc cấu hình Cloudflare R2 từ biến môi trường
 */
export function getCloudflareR2Config(): CloudflareR2Config {
  return {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'so-tay-beo-media',
    publicDomain: (process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '').replace(/\/+$/, ''),
  };
}

let cachedS3Client: S3Client | null = null;

/**
 * Khởi tạo singleton S3Client tương thích 100% với Cloudflare R2
 */
export function getR2Client(): S3Client | null {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  const config = getCloudflareR2Config();

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    return null;
  }

  // Cloudflare R2 S3 Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

  cachedS3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedS3Client;
}
