// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU COMMON CORE AI GEMINI (SỔ TAY BÉO)
// ==============================================================================

export type GeminiModelId =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | (string & {});

export const DEFAULT_GEMINI_MODEL: GeminiModelId = 'gemini-2.5-flash';

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
