import {
  AIResponse,
  ChatCompletionOptions,
  GenerateJsonOptions,
  GenerateTextOptions,
  ImageAnalysisOptions,
} from './types';

const USER_API_KEY_STORAGE = 'so_tay_beo_custom_gemini_api_key';
const USER_MODEL_STORAGE = 'so_tay_beo_custom_gemini_model';

/**
 * Lấy Custom API Key người dùng tự nhập (nếu có)
 */
export function getCustomUserApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_API_KEY_STORAGE);
}

/**
 * Lưu Custom API Key người dùng tự nhập
 */
export function setCustomUserApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  if (!apiKey.trim()) {
    localStorage.removeItem(USER_API_KEY_STORAGE);
  } else {
    localStorage.setItem(USER_API_KEY_STORAGE, apiKey.trim());
  }
}

/**
 * Lấy Mô hình AI người dùng tự chọn (nếu có)
 */
export function getCustomUserModel(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_MODEL_STORAGE);
}

/**
 * Lưu Mô hình AI người dùng tự chọn
 */
export function setCustomUserModel(model: string): void {
  if (typeof window === 'undefined') return;
  if (!model.trim()) {
    localStorage.removeItem(USER_MODEL_STORAGE);
  } else {
    localStorage.setItem(USER_MODEL_STORAGE, model.trim());
  }
}

/**
 * Common Client Helper gọi qua Server API route `/api/ai/gemini`
 */
async function callGeminiApi<T = any>(
  action: string,
  payload: Record<string, any>
): Promise<AIResponse<T>> {
  try {
    const customKey = payload.apiKey || getCustomUserApiKey();
    const customModel = payload.model || getCustomUserModel();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (customKey) {
      headers['x-gemini-api-key'] = customKey;
    }

    const finalPayload: Record<string, any> = {
      action,
      ...payload,
    };

    if (customModel && !payload.model) {
      finalPayload.model = customModel;
    }

    const res = await fetch('/api/ai/gemini', {
      method: 'POST',
      headers,
      body: JSON.stringify(finalPayload),
    });

    if (res.status === 413) {
      return {
        success: false,
        error: 'Dung lượng tệp hoặc tin nhắn quá lớn (vượt quá giới hạn 4.5MB của máy chủ). Vui lòng gửi ảnh dung lượng nhỏ hơn hoặc giảm bớt số lượng ảnh.',
      };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const rawText = await res.text().catch(() => '');
      console.warn(`[GeminiClient] Server returned non-JSON response (${res.status}):`, rawText.slice(0, 200));
      return {
        success: false,
        error: res.status === 504
          ? 'Máy chủ AI xử lý quá thời gian chờ (timeout). Vui lòng thử lại.'
          : `Máy chủ AI phản hồi không hợp lệ (mã lỗi: ${res.status}). Vui lòng thử lại sau ít giây.`,
      };
    }

    const data: AIResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Gemini Client Call Error (${action}):`, err);
    return {
      success: false,
      error: err?.message || 'Không thể kết nối đến máy chủ AI.',
    };
  }
}

/**
 * Common Gemini Service - Đối tượng chính dùng chung cho toàn bộ ứng dụng
 */
export const gemini = {
  /**
   * Sinh văn bản từ prompt
   * @example
   * const res = await gemini.generateText('Tóm tắt lịch dạy tuần này cho tôi');
   */
  async generateText(
    prompt: string,
    options: Partial<GenerateTextOptions> = {}
  ): Promise<AIResponse<string>> {
    return callGeminiApi<string>('generate-text', {
      prompt,
      ...options,
    });
  },

  /**
   * Sinh dữ liệu JSON có cấu trúc (Strongly Typed)
   * @example
   * interface LessonPlan { topic: string; objectives: string[] }
   * const res = await gemini.generateJSON<LessonPlan>('Soạn mục tiêu bài học số 5', '{ topic: string, objectives: string[] }');
   */
  async generateJSON<T = any>(
    prompt: string,
    schemaDescription?: string,
    options: Partial<GenerateJsonOptions<T>> = {}
  ): Promise<AIResponse<T>> {
    return callGeminiApi<T>('generate-json', {
      prompt,
      schemaDescription,
      ...options,
    });
  },

  /**
   * Hội thoại nhiều lượt (Chatbot / Trợ lý ảo)
   * @example
   * const res = await gemini.chat([
   *   { role: 'user', content: 'Chào bạn, tôi là giáo viên Toán' },
   *   { role: 'model', content: 'Chào Thầy/Cô, tôi có thể hỗ trợ gì cho bộ môn Toán ạ?' },
   *   { role: 'user', content: 'Gợi ý cho tôi 3 bài toán vui lớp 6' }
   * ]);
   */
  async chat(
    messages: ChatCompletionOptions['messages'],
    options: Partial<ChatCompletionOptions> = {}
  ): Promise<AIResponse<string>> {
    return callGeminiApi<string>('chat', {
      messages,
      ...options,
    });
  },

  /**
   * Phân tích hình ảnh (Multimodal Vision)
   * @example
   * const res = await gemini.analyzeImage(base64Data, 'Đọc và trích xuất bảng thời khóa biểu trong ảnh');
   */
  async analyzeImage(
    imageBase64: string,
    prompt: string,
    options: Partial<ImageAnalysisOptions> = {}
  ): Promise<AIResponse<string>> {
    return callGeminiApi<string>('analyze-image', {
      imageBase64,
      prompt,
      ...options,
    });
  },
};
