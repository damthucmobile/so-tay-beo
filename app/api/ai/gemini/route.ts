import { NextRequest, NextResponse } from 'next/server';
import {
  generateTextServer,
  generateJsonServer,
  chatServer,
  analyzeImageServer,
} from '@/core/ai/geminiServer';
import { AIActionType } from '@/core/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action: AIActionType = body.action || 'generate-text';
    const customApiKey = req.headers.get('x-gemini-api-key') || body.apiKey;

    switch (action) {
      case 'generate-text': {
        const { prompt, model, temperature, maxOutputTokens, systemInstruction } = body;
        if (!prompt) {
          return NextResponse.json(
            { success: false, error: 'Thiếu tham số prompt.' },
            { status: 400 }
          );
        }
        const result = await generateTextServer({
          prompt,
          model,
          temperature,
          maxOutputTokens,
          systemInstruction,
          apiKey: customApiKey,
        });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
      }

      case 'generate-json': {
        const { prompt, schemaDescription, responseSchema, model, systemInstruction } = body;
        if (!prompt) {
          return NextResponse.json(
            { success: false, error: 'Thiếu tham số prompt.' },
            { status: 400 }
          );
        }
        const result = await generateJsonServer({
          prompt,
          schemaDescription,
          responseSchema,
          model,
          systemInstruction,
          apiKey: customApiKey,
        });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
      }

      case 'chat': {
        const { messages, model, temperature, maxOutputTokens, systemInstruction } = body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Danh sách tin nhắn messages không hợp lệ.' },
            { status: 400 }
          );
        }
        const result = await chatServer({
          messages,
          model,
          temperature,
          maxOutputTokens,
          systemInstruction,
          apiKey: customApiKey,
        });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
      }

      case 'analyze-image': {
        const { prompt, imageBase64, mimeType, model, systemInstruction } = body;
        if (!prompt || !imageBase64) {
          return NextResponse.json(
            { success: false, error: 'Thiếu prompt hoặc ảnh imageBase64.' },
            { status: 400 }
          );
        }
        const result = await analyzeImageServer({
          prompt,
          imageBase64,
          mimeType,
          model,
          systemInstruction,
          apiKey: customApiKey,
        });
        return NextResponse.json(result, { status: result.success ? 200 : 500 });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Hành động action '${action}' không được hỗ trợ.` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    console.error('API Gemini Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Lỗi xử lý yêu cầu AI trên máy chủ.',
      },
      { status: 500 }
    );
  }
}
