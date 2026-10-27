// core/notifications/zaloService.ts
/**
 * Zalo Official Account (OA) Integration Service
 * Hỗ trợ gửi tin nhắn Zalo OA miễn phí (CSKH / Transaction) không cần Giấy phép ĐKKD
 */

export interface ZaloSendMessagePayload {
  recipientId: string; // Zalo User ID (user_id_by_app)
  messageText: string;
  buttons?: Array<{
    title: string;
    type: 'oa.open.url' | 'oa.query.show';
    payload: {
      url?: string;
    };
  }>;
}

export class ZaloService {
  private static OA_API_URL = 'https://openapi.zalo.me/v3.0/oa/message/cs';

  /**
   * Gửi tin nhắn văn bản từ Zalo OA đến người dùng (đã quan tâm OA hoặc đã tương tác)
   */
  public static async sendMessage(
    accessToken: string,
    payload: ZaloSendMessagePayload
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!accessToken) {
      return { success: false, error: 'Thiếu Zalo OA Access Token' };
    }

    try {
      const bodyPayload = {
        recipient: {
          user_id: payload.recipientId,
        },
        message: {
          text: payload.messageText,
          attachment: payload.buttons && payload.buttons.length > 0 ? {
            type: 'template',
            payload: {
              template_type: 'buttons',
              elements: [
                {
                  title: 'Xem Thời Khóa Biểu',
                  subtitle: 'Bấm để mở Sổ Tay Béo trên điện thoại',
                  buttons: payload.buttons,
                },
              ],
            },
          } : undefined,
        },
      };

      const response = await fetch(this.OA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: accessToken,
        },
        body: JSON.stringify(bodyPayload),
      });

      const resJson = await response.json();
      if (resJson.error === 0) {
        return { success: true, data: resJson.data };
      } else {
        return { 
          success: false, 
          error: `[Zalo API Error ${resJson.error}]: ${resJson.message}` 
        };
      }
    } catch (err: any) {
      console.error('[ZaloService] Error calling Zalo OA API:', err);
      return { success: false, error: err?.message || 'Lỗi kết nối Zalo API' };
    }
  }

  /**
   * Tạo nội dung tin nhắn nhắc lịch dạy học định dạng đẹp cho Zalo
   */
  public static formatTeachingReminderMessage(
    teacherName: string,
    periodInfo: {
      session: string;
      period: number;
      className: string;
      subject: string;
      startTime: string;
    }
  ): string {
    return `🔔 [SỔ TAY BÉO - NHẮC LỊCH DẠY]\n` +
           `Kính gửi Thầy/Cô: ${teacherName}\n` +
           `--------------------------------\n` +
           `⏰ Sắp đến giờ vào tiết (${periodInfo.session} - Tiết ${periodInfo.period})\n` +
           `🏫 Lớp dạy: ${periodInfo.className}\n` +
           `📚 Môn học: ${periodInfo.subject}\n` +
           `⏱️ Giờ vào tiết: ${periodInfo.startTime}\n` +
           `--------------------------------\n` +
           `Chúc Thầy/Cô có buổi dạy thành công và nhiều niềm vui!`;
  }
}
