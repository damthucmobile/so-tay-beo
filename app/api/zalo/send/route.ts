import { NextRequest, NextResponse } from 'next/server';
import { ZaloService } from '@/core/notifications/zaloService';
import { adminDb } from '@/core/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientId, phoneNumber, teacherName, periodInfo, customMessage } = body;

    let targetRecipientId = recipientId;

    // Nếu không có recipientId trực tiếp, tìm kiếm qua số điện thoại đã liên kết trong Firestore
    if (!targetRecipientId && phoneNumber && adminDb) {
      try {
        const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
        const mappingDoc = await adminDb.collection('zalo_user_mappings').doc(cleanPhone).get();
        if (mappingDoc.exists) {
          targetRecipientId = mappingDoc.data()?.zaloUserId;
        }
      } catch (dbErr) {
        console.warn('[Zalo Send] Lỗi tra cứu mapping SĐT:', dbErr);
      }
    }

    if (!targetRecipientId) {
      return NextResponse.json(
        {
          success: false,
          error: `Số điện thoại ${phoneNumber || ''} chưa liên kết với Zalo OA. Thầy/Cô vui lòng dùng Zalo quét mã QR của OA và nhắn tin số điện thoại này vào OA một lần trước!`,
          needLink: true,
        },
        { status: 400 }
      );
    }

    // Lấy Zalo Access Token từ biến môi trường
    const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN || '';

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
