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
    const senderId = data.sender?.id; // user_id_by_app của Zalo
    const messageText = data.message?.text?.trim() || '';

    // Xử lý sự kiện người dùng gửi tin nhắn để liên kết số điện thoại
    if (eventName === 'user_send_text' && senderId) {
      // Người dùng gửi số điện thoại, ví dụ: "0987654321" hoặc "LK 0987654321"
      const phoneMatch = messageText.match(/0\d{9}/);
      if (phoneMatch) {
        const detectedPhone = phoneMatch[0];
        console.log(`[Zalo Webhook] Lưu liên kết: Zalo UID ${senderId} <-> SĐT ${detectedPhone}`);
        try {
          const { adminDb } = await import('@/core/firebase/admin');
          if (adminDb) {
            await adminDb.collection('zalo_user_mappings').doc(detectedPhone).set({
              phoneNumber: detectedPhone,
              zaloUserId: senderId,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (dbErr) {
          console.error('[Zalo Webhook] Lỗi lưu Firestore:', dbErr);
        }
      }
    }

    // Luôn trả về 200 OK cho Zalo Platform
    return NextResponse.json({ error: 0, message: 'Webhook received successfully' });
  } catch (error: any) {
    console.error('[Zalo Webhook Error]:', error);
    return NextResponse.json({ error: -1, message: error?.message || 'Error' }, { status: 500 });
  }
}

export async function GET() {
  // Dùng để verify webhook URL trên Zalo Developer Console
  return NextResponse.json({ status: 'Zalo Webhook Active' });
}
