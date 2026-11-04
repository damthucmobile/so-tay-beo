import { GoogleGenAI } from '@google/genai';
import {
  ChatCompletionOptions,
  DEFAULT_GEMINI_MODEL,
  FALLBACK_GEMINI_MODELS,
  GenerateJsonOptions,
  GenerateTextOptions,
  ImageAnalysisOptions,
  AIResponse,
} from './types';

/**
 * Khởi tạo client Google Gen AI với API Key từ môi trường hoặc key truyền vào
 */
export function getGeminiServerClient(customApiKey?: string): GoogleGenAI {
  const apiKey =
    customApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Chưa cấu hình GEMINI_API_KEY trong file .env hoặc biến môi trường hệ thống. Vui lòng thêm GEMINI_API_KEY vào .env.local.'
    );
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Định dạng thông báo lỗi Gemini thân thiện với người dùng
 */
function formatGeminiErrorMessage(err: any): string {
  const msg = typeof err === 'string' ? err : err?.message || '';
  if (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('limit exceeded')
  ) {
    return 'Hạn ngạch miễn phí của mô hình này hôm nay đã tạm thời chạm giới hạn của Google. Hệ thống đã thử chuyển sang mô hình dự phòng nhưng tất cả đều đang quá tải. Bạn có thể thử lại sau ít phút hoặc cài đặt API Key cá nhân trong mục "Cài đặt Key".';
  }
  if (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high demand')
  ) {
    return 'Máy chủ Google Gemini đang quá tải tạm thời do lượng người dùng cao. Vui lòng thử gửi lại sau vài giây.';
  }
  return msg || 'Lỗi xử lý yêu cầu từ Gemini AI.';
}

/**
 * Thực thi gọi Gemini với cơ chế tự động chuyển sang mô hình dự phòng (Fallback) khi gặp 429 hoặc 503
 */
async function executeWithModelFallback<R>(
  requestedModel: string | undefined,
  apiKey: string | undefined,
  fn: (ai: GoogleGenAI, model: string) => Promise<R>
): Promise<{ result: R; modelUsed: string }> {
  const ai = getGeminiServerClient(apiKey);
  const primaryModel =
    requestedModel ||
    process.env.NEXT_PUBLIC_GEMINI_MODEL ||
    DEFAULT_GEMINI_MODEL;

  // Danh sách model ưu tiên thử lần lượt: [primaryModel, ...các fallback khác]
  const modelsToTry = [
    primaryModel,
    ...FALLBACK_GEMINI_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const result = await fn(ai, model);
      return { result, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || '';
      const isRetryable =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('quota') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('404') ||
        errMsg.includes('NOT_FOUND');

      if (isRetryable) {
        console.warn(
          `[Gemini AI] Model '${model}' gặp lỗi (${errMsg.slice(0, 120)}...), đang tự động chuyển sang model dự phòng tiếp theo...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * 1. Sinh văn bản thông thường (Text Generation)
 */
export async function generateTextServer(
  options: GenerateTextOptions
): Promise<AIResponse<string>> {
  try {
    const { result: response, modelUsed } = await executeWithModelFallback(
      options.model,
      options.apiKey,
      async (ai, model) => {
        return await ai.models.generateContent({
          model,
          contents: options.prompt,
          config: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens,
            systemInstruction: options.systemInstruction,
          },
        });
      }
    );

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (err: any) {
    console.error('Lỗi Gemini generateTextServer:', err);
    return {
      success: false,
      error: formatGeminiErrorMessage(err),
    };
  }
}

/**
 * 2. Sinh dữ liệu có cấu trúc JSON (Structured JSON Output)
 */
export async function generateJsonServer<T = any>(
  options: GenerateJsonOptions<T>
): Promise<AIResponse<T>> {
  try {
    let systemInstruction = options.systemInstruction || '';
    if (options.schemaDescription) {
      systemInstruction += `\nĐảm bảo định dạng JSON trả về tuân thủ cấu trúc sau: ${options.schemaDescription}`;
    }

    const config: any = {
      responseMimeType: 'application/json',
      temperature: options.temperature ?? 0.2, // Nhiệt độ thấp để cấu trúc JSON chuẩn xác
      systemInstruction: systemInstruction.trim() || undefined,
    };

    if (options.responseSchema) {
      config.responseSchema = options.responseSchema;
    }

    const { result: response, modelUsed } = await executeWithModelFallback(
      options.model,
      options.apiKey,
      async (ai, model) => {
        return await ai.models.generateContent({
          model,
          contents: options.prompt,
          config,
        });
      }
    );

    const rawText = response.text || '{}';
    let parsedData: T;

    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Trường hợp phản hồi có bọc ```json ... ```
      const cleaned = rawText
        .replace(/^```json/m, '')
        .replace(/^```/m, '')
        .replace(/```$/m, '')
        .trim();
      parsedData = JSON.parse(cleaned);
    }

    return {
      success: true,
      data: parsedData,
      modelUsed,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (err: any) {
    console.error('Lỗi Gemini generateJsonServer:', err);
    return {
      success: false,
      error: formatGeminiErrorMessage(err),
    };
  }
}

/**
 * 3. Hội thoại đa lượt (Multi-turn Chat)
 */
export async function chatServer(
  options: ChatCompletionOptions
): Promise<AIResponse<string>> {
  try {
    // Chuẩn hóa lịch sử hội thoại cho SDK bao gồm hình ảnh và tệp đính kèm
    const contents = options.messages.map((m) => {
      const parts: any[] = [];

      // 1. Xử lý tệp đính kèm nếu có (ảnh, PDF, tài liệu, file code)
      if (m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (!att.data && !att.textContent) continue;

          const isImage = att.type?.startsWith('image/');
          const isPdf = att.type === 'application/pdf';
          const isAudio = att.type?.startsWith('audio/');
          const isVideo = att.type?.startsWith('video/');

          if (isImage || isPdf || isAudio || isVideo) {
            // Chuẩn hóa chuỗi Base64
            const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type || (isImage ? 'image/jpeg' : 'application/pdf'),
                data: cleanBase64,
              },
            });
          } else if (
            att.isText ||
            att.type?.startsWith('text/') ||
            att.type?.includes('json') ||
            att.type?.includes('csv') ||
            att.type?.includes('xml')
          ) {
            // Tệp văn bản / code / dữ liệu text
            let textData = att.textContent;
            if (!textData && att.data) {
              if (att.data.startsWith('data:')) {
                try {
                  const b64 = att.data.split(',')[1];
                  textData = Buffer.from(b64, 'base64').toString('utf-8');
                } catch {
                  textData = att.data;
                }
              } else {
                textData = att.data;
              }
            }
            parts.push({
              text: `[Tệp đính kèm: ${att.name}]\n\`\`\`\n${textData || ''}\n\`\`\``,
            });
          } else {
            // Các định dạng tệp khác
            const cleanBase64 = att.data.replace(/^data:[^;]+;base64,/, '');
            parts.push({
              inlineData: {
                mimeType: att.type || 'application/octet-stream',
                data: cleanBase64,
              },
            });
          }
        }
      }

      // 2. Nội dung văn bản của tin nhắn
      if (m.content && m.content.trim()) {
        parts.push({ text: m.content });
      } else if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: m.role === 'model' ? 'model' : 'user',
        parts,
      };
    });

    const { result: response, modelUsed } = await executeWithModelFallback(
      options.model,
      options.apiKey,
      async (ai, model) => {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens,
            systemInstruction: options.systemInstruction,
          },
        });
      }
    );

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (err: any) {
    console.error('Lỗi Gemini chatServer:', err);
    return {
      success: false,
      error: formatGeminiErrorMessage(err),
    };
  }
}

/**
 * 4. Phân tích hình ảnh (Multimodal Analysis)
 */
export async function analyzeImageServer(
  options: ImageAnalysisOptions
): Promise<AIResponse<string>> {
  try {
    // Làm sạch chuỗi Base64
    const cleanBase64 = options.imageBase64.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ''
    );

    const contents = [
      {
        role: 'user',
        parts: [
          { text: options.prompt },
          {
            inlineData: {
              mimeType: options.mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ];

    const { result: response, modelUsed } = await executeWithModelFallback(
      options.model,
      options.apiKey,
      async (ai, model) => {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            temperature: options.temperature ?? 0.4,
            maxOutputTokens: options.maxOutputTokens,
            systemInstruction: options.systemInstruction,
          },
        });
      }
    );

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount,
        responseTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
      },
    };
  } catch (err: any) {
    console.error('Lỗi Gemini analyzeImageServer:', err);
    return {
      success: false,
      error: formatGeminiErrorMessage(err),
    };
  }
}

