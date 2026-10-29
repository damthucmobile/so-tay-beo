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
   * Lấy token hiện tại từ Firestore (ưu tiên) hoặc fallback sang .env
   */
  public static async getStoredTokens(): Promise<{ accessToken: string; refreshToken: string; expiresAt?: number }> {
    try {
      const { adminDb } = await import('@/core/firebase/admin');
      if (adminDb) {
        const docSnap = await adminDb.collection('system_configs').doc('zalo_tokens').get();
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data?.accessToken && data?.refreshToken) {
            return {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresAt: data.expiresAt,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[ZaloService] Không thể đọc token từ Firestore, fallback env:', err);
    }

    return {
      accessToken: process.env.ZALO_OA_ACCESS_TOKEN || '',
      refreshToken: process.env.ZALO_OA_REFRESH_TOKEN || '',
    };
  }

  /**
   * Lưu cặp token mới vào Firestore để xoay vòng tự động vĩnh viễn
   */
  public static async saveTokensToStorage(accessToken: string, refreshToken: string, expiresIn: number = 90000): Promise<void> {
    try {
      const { adminDb } = await import('@/core/firebase/admin');
      if (adminDb) {
        await adminDb.collection('system_configs').doc('zalo_tokens').set({
          accessToken,
          refreshToken,
          expiresAt: Date.now() + (expiresIn - 300) * 1000, // trừ 5 phút dự phòng
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log('[ZaloService] Đã lưu cặp Access Token & Refresh Token mới vào Firestore thành công!');
      }
    } catch (err) {
      console.error('[ZaloService] Lỗi khi lưu token vào Firestore:', err);
    }
  }

  /**
   * Tự động làm mới Access Token bằng Refresh Token và lưu lại token mới vào Firestore
   */
  public static async refreshAccessToken(): Promise<string | null> {
    const appId = process.env.ZALO_APP_ID;
    const secretKey = process.env.ZALO_APP_SECRET;

    const stored = await this.getStoredTokens();
    const refreshToken = stored.refreshToken || process.env.ZALO_OA_REFRESH_TOKEN;

    if (!appId || !secretKey || !refreshToken) {
      console.warn('[ZaloService] Thiếu ZALO_APP_ID, ZALO_APP_SECRET hoặc ZALO_OA_REFRESH_TOKEN');
      return null;
    }

    try {
      const res = await fetch('https://oauth.zaloapp.com/v4/oa/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          secret_key: secretKey,
        },
        body: new URLSearchParams({
          app_id: appId,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        console.log('[ZaloService] Đổi token thành công từ Zalo API!');
        // Zalo trả về access_token VÀ refresh_token mới (xoay vòng)
        const newRefreshToken = data.refresh_token || refreshToken;
        const expiresIn = Number(data.expires_in) || 90000;

        await this.saveTokensToStorage(data.access_token, newRefreshToken, expiresIn);
        return data.access_token;
      }

      console.warn('[ZaloService] Zalo từ chối cấp token mới:', data);
      return null;
    } catch (e) {
      console.error('[ZaloService] Lỗi khi gọi refresh token:', e);
      return null;
    }
  }

  /**
   * Lấy token còn hạn (tự động refresh nếu sắp hết hạn)
   */
  public static async getValidAccessToken(): Promise<string> {
    const tokens = await this.getStoredTokens();
    const now = Date.now();

    // Nếu token đã có hạn dùng và đã hết hạn ➔ Tự động làm mới
    if (tokens.expiresAt && now >= tokens.expiresAt) {
      console.log('[ZaloService] Token trong Firestore sắp/đã hết hạn, đang tự động làm mới...');
      const newToken = await this.refreshAccessToken();
      if (newToken) return newToken;
    }

    return tokens.accessToken || (await this.refreshAccessToken()) || '';
  }

  /**
   * Gửi tin nhắn văn bản từ Zalo OA đến người dùng (đã quan tâm OA hoặc đã tương tác)
   */
  public static async sendMessage(
    accessToken: string = '',
    payload: ZaloSendMessagePayload
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    let currentToken = accessToken || (await this.getValidAccessToken());
    if (!currentToken) {
      return { success: false, error: 'Thiếu Zalo OA Access Token hợp lệ. Vui lòng kiểm tra lại cấu hình Zalo.' };
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

      let response = await fetch(this.OA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: currentToken,
        },
        body: JSON.stringify(bodyPayload),
      });

      let resJson = await response.json();

      // Nếu token hết hạn (-216), thử tự động làm mới token và gửi lại một lần nữa
      if (resJson.error === -216) {
        console.log('[ZaloService] Token hết hạn (-216), đang thử tự động làm mới token...');
        const refreshedToken = await this.refreshAccessToken();
        if (refreshedToken) {
          response = await fetch(this.OA_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: refreshedToken,
            },
            body: JSON.stringify(bodyPayload),
          });
          resJson = await response.json();
        }
      }

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
