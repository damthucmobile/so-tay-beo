// core/cloudflare/r2Service.ts
import {
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Client, getCloudflareR2Config } from './r2Client';
import {
  PresignedUploadOptions,
  PresignedUploadResult,
  UploadBufferOptions,
  R2FileInfo,
  MediaFolder,
} from './types';

export class R2Service {
  /**
   * Kiểm tra xem Cloudflare R2 đã được cấu hình đầy đủ biến môi trường chưa
   */
  public static isConfigured(): boolean {
    const config = getCloudflareR2Config();
    return Boolean(config.accountId && config.accessKeyId && config.secretAccessKey);
  }

  /**
   * Tạo File Key chuẩn hóa và duy nhất trong bucket (phân chia theo folder/năm/tháng/timestamp)
   */
  public static buildFileKey(
    filename: string,
    folder: MediaFolder = 'images',
    userId?: string
  ): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Làm sạch tên file, loại bỏ khoảng trắng và ký tự đặc biệt
    const cleanFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9\.\-_]/g, '_')
      .replace(/_+/g, '_');
    
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueName = `${now.getTime()}_${randomSuffix}_${cleanFilename}`;

    if (userId) {
      return `${folder}/${userId}/${year}/${month}/${uniqueName}`;
    }
    return `${folder}/${year}/${month}/${uniqueName}`;
  }

  /**
   * Lấy đường dẫn xem công khai (Public CDN URL) của file
   */
  public static getPublicUrl(fileKey: string): string {
    const config = getCloudflareR2Config();
    if (!config.publicDomain) {
      // Fallback nếu chưa gắn custom domain
      return `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com/${fileKey}`;
    }
    return `${config.publicDomain}/${fileKey}`;
  }

  /**
   * Tạo Presigned URL để Trình duyệt (Client) upload thẳng file lớn/video lên R2
   * Không qua server Next.js => Tiết kiệm 100% băng thông server và tránh timeout
   */
  public static async createPresignedUploadUrl(
    options: PresignedUploadOptions
  ): Promise<PresignedUploadResult> {
    const client = getR2Client();
    const config = getCloudflareR2Config();

    if (!client) {
      throw new Error(
        'Cloudflare R2 chưa được cấu hình. Vui lòng thêm CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY vào file .env.local'
      );
    }

    const fileKey = this.buildFileKey(options.filename, options.folder, options.userId);
    const expiresIn = options.expiresIn || 3600; // 1 giờ

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey,
      ContentType: options.contentType,
      Metadata: options.metadata || {},
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    const publicUrl = this.getPublicUrl(fileKey);

    return {
      uploadUrl,
      fileKey,
      publicUrl,
      expiresIn,
    };
  }

  /**
   * Upload trực tiếp từ Server (dành cho serverless function, tệp Excel, thumbnail tạo từ server)
   */
  public static async uploadBuffer(options: UploadBufferOptions): Promise<R2FileInfo> {
    const client = getR2Client();
    const config = getCloudflareR2Config();

    if (!client) {
      throw new Error('Cloudflare R2 chưa được cấu hình biến môi trường.');
    }

    const fileKey = this.buildFileKey(options.filename, options.folder, options.userId);

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey,
      Body: options.buffer,
      ContentType: options.contentType,
      Metadata: options.metadata || {},
    });

    const res = await client.send(command);

    return {
      key: fileKey,
      publicUrl: this.getPublicUrl(fileKey),
      etag: res.ETag,
    };
  }

  /**
   * Lấy thông tin chi tiết của file trên R2 (dung lượng, contentType, ngày tạo)
   */
  public static async getFileInfo(fileKey: string): Promise<R2FileInfo | null> {
    const client = getR2Client();
    const config = getCloudflareR2Config();
    if (!client) return null;

    try {
      const command = new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: fileKey,
      });

      const res = await client.send(command);
      return {
        key: fileKey,
        publicUrl: this.getPublicUrl(fileKey),
        size: res.ContentLength,
        contentType: res.ContentType,
        lastModified: res.LastModified,
        etag: res.ETag,
      };
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Xóa một file khỏi Cloudflare R2
   */
  public static async deleteFile(fileKey: string): Promise<boolean> {
    const client = getR2Client();
    const config = getCloudflareR2Config();
    if (!client) return false;

    try {
      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: fileKey,
      });

      await client.send(command);
      return true;
    } catch (err) {
      console.error(`[R2Service] Lỗi khi xóa file ${fileKey}:`, err);
      return false;
    }
  }

  /**
   * Xóa hàng loạt file (Bulk delete)
   */
  public static async deleteFiles(fileKeys: string[]): Promise<boolean> {
    const client = getR2Client();
    const config = getCloudflareR2Config();
    if (!client || fileKeys.length === 0) return false;

    try {
      const command = new DeleteObjectsCommand({
        Bucket: config.bucketName,
        Delete: {
          Objects: fileKeys.map((Key) => ({ Key })),
        },
      });

      await client.send(command);
      return true;
    } catch (err) {
      console.error('[R2Service] Lỗi khi xóa nhiều file:', err);
      return false;
    }
  }

  /**
   * Liệt kê danh sách file theo thư mục/tiền tố
   */
  public static async listFiles(prefix?: string, maxKeys: number = 100): Promise<R2FileInfo[]> {
    const client = getR2Client();
    const config = getCloudflareR2Config();
    if (!client) return [];

    try {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const res = await client.send(command);
      if (!res.Contents) return [];

      return res.Contents.map((item) => ({
        key: item.Key || '',
        publicUrl: this.getPublicUrl(item.Key || ''),
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
      }));
    } catch (err) {
      console.error('[R2Service] Lỗi liệt kê file:', err);
      return [];
    }
  }
}
