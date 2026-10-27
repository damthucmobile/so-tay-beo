// app/api/zalo/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZaloService } from '@/core/notifications/zaloService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientId, teacherName, periodInfo, customMessage } = body;

    // Lấy Zalo Access Token từ biến môi trường (hoặc cấu hình)
    const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN || '';

    if (!zaloAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Chưa cấu hình ZALO_OA_ACCESS_TOKEN trong file .env.local',
          isSandbox: true,
        },
        { status: 400 }
      );
    }

    if (!recipientId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu Zalo User ID của người nhận' },
        { status: 400 }
      );
    }

    const messageText = customMessage || (
      periodInfo
        ? ZaloService.formatTeachingReminderMessage(teacherName || 'Thầy/Cô', periodInfo)
        : `🔔 Sổ Tay Béo: Thông báo lịch giảng dạy mới dành cho ${teacherName || 'Thầy/Cô'}.`
    );

    const result = await ZaloService.sendMessage(zaloAccessToken, {
      recipientId,
      messageText,
      buttons: [
        {
          title: 'Xem Thời Khóa Biểu',
          type: 'oa.open.url',
          payload: {
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://sotaybeo.vn/?tab=teaching_schedule',
          },
        },
      ],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Lỗi xử lý gửi tin Zalo' },
      { status: 500 }
    );
  }
}
