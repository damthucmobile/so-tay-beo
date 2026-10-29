// app/api/zalo/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Zalo OA Webhook Handler
 * Nhận sự kiện từ Zalo khi người dùng:
 * 1. Bấm "Quan tâm" (Follow) Zalo OA
 * 2. Gửi tin nhắn đến Zalo OA (User-initiated chat để liên kết SĐT)
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('[Zalo Webhook Received Event]:', JSON.stringify(data, null, 2));

    const eventName = data.event_name;
    const senderId = data.sender?.id || data.user_id_by_app;
    const rawText = data.message?.text?.trim() || '';

    // Xử lý sự kiện người dùng gửi tin nhắn để liên kết số điện thoại
    if ((eventName === 'user_send_text' || eventName === 'user_received_message') && senderId && rawText) {
      // Chuẩn hóa văn bản: loại bỏ khoảng trắng, dấu chấm, dấu gạch nối
      const cleanText = rawText.replace(/[\s\.\-]+/g, '');
      const phoneMatch = cleanText.match(/(?:0|\+?84)(\d{9})/);

      if (phoneMatch) {
        // Chuẩn hóa về định dạng 10 chữ số bắt đầu bằng 0 (ví dụ: 0389793148)
        const detectedPhone = '0' + phoneMatch[1];
        console.log(`[Zalo Webhook] Phát hiện yêu cầu liên kết: Zalo UID ${senderId} <-> SĐT ${detectedPhone}`);

        try {
          const { adminDb } = await import('@/core/firebase/admin');
          if (adminDb) {
            await adminDb.collection('zalo_user_mappings').doc(detectedPhone).set(
              {
                phoneNumber: detectedPhone,
                zaloUserId: senderId,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
            console.log(`[Zalo Webhook] Đã lưu liên kết thành công vào Firestore: ${detectedPhone}`);

            // Gửi tin nhắn xác nhận tự động lại cho người dùng trên Zalo
            try {
              const { ZaloService } = await import('@/core/notifications/zaloService');
              const zaloAccessToken = process.env.ZALO_OA_ACCESS_TOKEN || '';
              await ZaloService.sendMessage(zaloAccessToken, {
                recipientId: senderId,
                messageText: `✅ [SỔ TAY BÉO]\nĐã liên kết thành công số điện thoại ${detectedPhone}!\n\nKể từ bây giờ, Thầy/Cô sẽ nhận được thông báo lịch dạy trực tiếp qua tin nhắn Zalo này. Chúc Thầy/Cô có ngày giảng dạy hiệu quả!`,
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
            } catch (replyErr) {
              console.warn('[Zalo Webhook] Lỗi gửi tin phản hồi xác nhận:', replyErr);
            }
          }
        } catch (dbErr) {
          console.error('[Zalo Webhook] Lỗi lưu Firestore:', dbErr);
        }
      }
    }

    // Luôn trả về 200 OK cho Zalo Platform
    return NextResponse.json({ error: 0, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('[Zalo Webhook Error]:', error);
    return NextResponse.json({ error: -1, message: error?.message || 'Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Dùng để verify webhook URL trên Zalo Developer Console (hỗ trợ cả challenge param nếu có)
  const challenge = req.nextUrl.searchParams.get('challenge');
  if (challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({
    status: 'Zalo Webhook Active',
    timestamp: new Date().toISOString(),
  });
}

