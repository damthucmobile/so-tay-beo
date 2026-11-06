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
    name: 'Mô hình Tiêu chuẩn',
    badge: 'Khuyên dùng',
    description: 'Thế hệ mới nhất: cực nhanh, phản hồi thông minh, sâu sắc và tối ưu',
    recommended: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Mô hình Siêu tốc',
    badge: 'Tiết kiệm tài nguyên',
    description: 'Tốc độ xử lý siêu nhanh, tiết kiệm tối đa hạn mức gọi dịch vụ hàng ngày',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Mô hình Cân bằng',
    badge: 'Ổn định',
    description: 'Mô hình tiêu chuẩn ổn định cho các tác vụ hỏi đáp thông thường',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Mô hình Nâng cao',
    badge: 'Tư duy chuyên sâu',
    description: 'Khả năng suy luận logic chuyên sâu cho phân tích dữ liệu phức tạp',
  },
];

export interface ChatAttachment {
  id: string;
  name: string;
  type: string; // MIME type (image/png, image/jpeg, application/pdf, etc.)
  size: number; // bytes
  data: string; // Base64 Data URL hoặc raw Base64 (tùy chọn khi gọi API trực tiếp)
  url?: string; // Cloudflare R2 Public/CDN URL vĩnh viễn
  fileKey?: string; // Cloudflare R2 storage key
  previewUrl?: string; // Preview URL cho hình ảnh
  isText?: boolean;
  textContent?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp?: string;
  attachments?: ChatAttachment[];
}

export interface AIChatSession {
  id: string;
  userId?: string;
  title: string;
  scope?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  pinned?: boolean;
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
