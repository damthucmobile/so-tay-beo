// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU COMMON CORE AI GEMINI (SỔ TAY BÉO)
// ==============================================================================

export type GeminiModelId =
  | 'gemini-3.5-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-3.8-flash'
  | (string & {});

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-3.5-flash';

export const FALLBACK_GEMINI_MODELS: GeminiModelId[] = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];

export interface GeminiModelInfo {
  id: GeminiModelId;
  name: string;
  badge?: string;
  description: string;
  recommended?: boolean;
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Khuyên dùng',
    description: 'Thế hệ mới nhất: cực nhanh, phản hồi sâu sắc và hạn mức dồi dào',
    recommended: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    badge: 'Tiết kiệm Quota',
    description: 'Tốc độ siêu nhanh, tiết kiệm tối đa hạn mức gọi API hàng ngày',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Ổn định',
    description: 'Mô hình thế hệ 2.5 (chú ý: Free Tier giới hạn 20 lượt/ngày)',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Tư duy nâng cao',
    description: 'Khả năng suy luận logic chuyên sâu cho bài toán phức tạp',
  },
];

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp?: string;
}

export interface BaseAIOptions {
  model?: GeminiModelId;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
  apiKey?: string; // Tùy chọn override API key (BYOK)
}

export interface GenerateTextOptions extends BaseAIOptions {
  prompt: string;
}

export interface GenerateJsonOptions<T = any> extends BaseAIOptions {
  prompt: string;
  schemaDescription?: string;
  responseSchema?: Record<string, any>;
}

export interface ChatCompletionOptions extends BaseAIOptions {
  messages: ChatMessage[];
}

export interface ImageAnalysisOptions extends BaseAIOptions {
  prompt: string;
  imageBase64: string; // Base64 data không kèm hoặc kèm data:image/...;base64,
  mimeType?: string; // Mặc định 'image/jpeg' hoặc 'image/png'
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
  usage?: {
    promptTokens?: number;
    responseTokens?: number;
    totalTokens?: number;
  };
}

export type AIActionType =
  | 'generate-text'
  | 'generate-json'
  | 'chat'
  | 'analyze-image';
