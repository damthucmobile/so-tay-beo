import { GoogleGenAI } from '@google/genai';
import {
  ChatCompletionOptions,
  DEFAULT_GEMINI_MODEL,
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
 * 1. Sinh văn bản thông thường (Text Generation)
 */
export async function generateTextServer(
  options: GenerateTextOptions
): Promise<AIResponse<string>> {
  try {
    const ai = getGeminiServerClient(options.apiKey);
    const model = options.model || DEFAULT_GEMINI_MODEL;

    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens,
        systemInstruction: options.systemInstruction,
      },
    });

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed: model,
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
      error: err?.message || 'Không thể tạo nội dung từ Gemini AI.',
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
    const ai = getGeminiServerClient(options.apiKey);
    const model = options.model || DEFAULT_GEMINI_MODEL;

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

    const response = await ai.models.generateContent({
      model,
      contents: options.prompt,
      config,
    });

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
      modelUsed: model,
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
      error: err?.message || 'Không thể tạo dữ liệu JSON từ Gemini AI.',
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
    const ai = getGeminiServerClient(options.apiKey);
    const model = options.model || DEFAULT_GEMINI_MODEL;

    // Chuẩn hóa lịch sử hội thoại cho SDK
    const contents = options.messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxOutputTokens,
        systemInstruction: options.systemInstruction,
      },
    });

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed: model,
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
      error: err?.message || 'Lỗi xử lý tin nhắn chat từ Gemini AI.',
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
    const ai = getGeminiServerClient(options.apiKey);
    const model = options.model || DEFAULT_GEMINI_MODEL;

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

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: options.temperature ?? 0.4,
        maxOutputTokens: options.maxOutputTokens,
        systemInstruction: options.systemInstruction,
      },
    });

    const text = response.text || '';

    return {
      success: true,
      data: text,
      modelUsed: model,
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
      error: err?.message || 'Không thể phân tích ảnh bằng Gemini AI.',
    };
  }
}
