// app/api/media/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/core/cloudflare';

/**
 * API cấp Presigned Upload URL cho Client tải ảnh/video/tệp trực tiếp lên Cloudflare R2
 */
export async function POST(req: NextRequest) {
  try {
    if (!R2Service.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cloudflare R2 chưa được cấu hình. Vui lòng thêm CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY vào file biến môi trường.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { filename, contentType, folder, metadata, userId } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin filename hoặc contentType.' },
        { status: 400 }
      );
    }

    const presigned = await R2Service.createPresignedUploadUrl({
      filename,
      contentType,
      folder: folder || 'images',
      userId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      ...presigned,
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 Presign Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi khi tạo liên kết tải lên Cloudflare R2' },
      { status: 500 }
    );
  }
}
