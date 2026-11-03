'use client';

import { useState, useCallback } from 'react';
import { gemini } from '../geminiClient';
import { BaseAIOptions, ChatMessage } from '../types';

export interface UseGeminiAIOptions extends BaseAIOptions {
  initialMessages?: ChatMessage[];
}

export function useGeminiAI(defaultOptions: UseGeminiAIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    defaultOptions.initialMessages || []
  );

  /**
   * 1. Sinh văn bản
   */
  const generateText = useCallback(
    async (prompt: string, overrideOptions?: BaseAIOptions): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await gemini.generateText(prompt, {
          ...defaultOptions,
          ...overrideOptions,
        });

        if (res.success && res.data) {
          setResult(res.data);
          return res.data;
        } else {
          const err = res.error || 'Lỗi sinh nội dung AI.';
          setError(err);
          return null;
        }
      } catch (e: any) {
        const err = e?.message || 'Lỗi không xác định khi gọi AI.';
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [defaultOptions]
  );

  /**
   * 2. Sinh dữ liệu JSON có cấu trúc
   */
  const generateJSON = useCallback(
    async <T = any>(
      prompt: string,
      schemaDescription?: string,
      overrideOptions?: BaseAIOptions
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await gemini.generateJSON<T>(prompt, schemaDescription, {
          ...defaultOptions,
          ...overrideOptions,
        });

        if (res.success && res.data) {
          return res.data;
        } else {
          setError(res.error || 'Lỗi sinh dữ liệu JSON.');
          return null;
        }
      } catch (e: any) {
        setError(e?.message || 'Lỗi không xác định khi gọi AI.');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [defaultOptions]
  );

  /**
   * 3. Gửi tin nhắn tiếp theo trong cuộc trò chuyện (Multi-turn chat)
   */
  const sendMessage = useCallback(
    async (userContent: string, overrideOptions?: BaseAIOptions): Promise<string | null> => {
      if (!userContent.trim()) return null;

      const newUserMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userContent.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [...chatMessages, newUserMsg];
      setChatMessages(updatedHistory);
      setIsLoading(true);
      setError(null);

      try {
        const res = await gemini.chat(updatedHistory, {
          ...defaultOptions,
          ...overrideOptions,
        });

        if (res.success && res.data) {
          const newModelMsg: ChatMessage = {
            id: `model_${Date.now()}`,
            role: 'model',
            content: res.data,
            timestamp: new Date().toISOString(),
          };
          setChatMessages((prev) => [...prev, newModelMsg]);
          return res.data;
        } else {
          const err = res.error || 'AI không thể phản hồi.';
          setError(err);
          return null;
        }
      } catch (e: any) {
        const err = e?.message || 'Lỗi kết nối AI chat.';
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [chatMessages, defaultOptions]
  );

  /**
   * Xóa lịch sử trò chuyện
   */
  const clearMessages = useCallback(() => {
    setChatMessages([]);
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    chatMessages,
    generateText,
    generateJSON,
    sendMessage,
    clearMessages,
    setChatMessages,
  };
}
