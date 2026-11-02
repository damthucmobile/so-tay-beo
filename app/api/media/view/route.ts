// app/api/media/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getCloudflareR2Config } from '@/core/cloudflare/r2Client';

/**
 * Route phục vụ xem và tải ảnh/video từ Cloudflare R2 an toàn & tối ưu cache
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Thiếu tham số key của file' }, { status: 400 });
    }

    const client = getR2Client();
    const config = getCloudflareR2Config();

    if (!client) {
      return NextResponse.json(
        { error: 'Cloudflare R2 chưa được cấu hình' },
        { status: 503 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    const s3Response = await client.send(command);

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 404 });
    }

    const contentType = s3Response.ContentType || 'application/octet-stream';
    const contentLength = s3Response.ContentLength;

    // Chuyển đổi stream từ AWS SDK sang web standard ReadableStream
    const stream = s3Response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    if (contentLength !== undefined) {
      headers.set('Content-Length', contentLength.toString());
    }
    // Cache trình duyệt 1 năm (fileKey là duy nhất theo timestamp)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (s3Response.ETag) {
      headers.set('ETag', s3Response.ETag);
    }

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'File không tồn tại trên Cloudflare R2' }, { status: 404 });
    }
    console.error('[Cloudflare R2 View Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Lỗi khi tải file từ Cloudflare R2' },
      { status: 500 }
    );
  }
}
