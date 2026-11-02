// app/api/media/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/core/cloudflare';
import { MediaFolder } from '@/core/cloudflare/types';

export const runtime = 'nodejs';
// Cho phép upload tệp ảnh/video lên tới 50MB
export const maxDuration = 60;

/**
 * API nhận upload trực tiếp từ Client qua FormData và đẩy lên Cloudflare R2
 * Tránh 100% lỗi CORS của trình duyệt khi upload trực tiếp vào endpoint R2
 */
export async function POST(req: NextRequest) {
  try {
    if (!R2Service.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cloudflare R2 chưa được cấu hình. Vui lòng kiểm tra file biến môi trường.',
        },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as MediaFolder) || 'travel';
    const userId = (formData.get('userId') as string) || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tệp gửi lên.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await R2Service.uploadBuffer({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      buffer,
      folder,
      userId,
    });

    return NextResponse.json({
      success: true,
      fileKey: uploaded.key,
      publicUrl: uploaded.publicUrl,
    });
  } catch (error: any) {
    console.error('[Cloudflare R2 Server Upload Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Lỗi khi lưu tệp lên Cloudflare R2.',
      },
      { status: 500 }
    );
  }
}
