// app/api/health/parse-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient } from '@/core/ai/geminiServer';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from '@/core/ai/types';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Bạn là Trợ lý Y tế & Chuyên gia Phân tích Dữ liệu Xét nghiệm Y khoa hàng đầu.
Nhiệm vụ của bạn là đọc và phân tích kỹ lưỡng tài liệu y tế (phiếu kết quả xét nghiệm máu, nước tiểu, sinh hóa, siêu âm, X-quang, điện tim, nội soi...) từ bất kỳ bệnh viện hay phòng khám nào tại Việt Nam hoặc quốc tế.

Yêu cầu xuất ra định dạng JSON CHÍNH XÁC theo cấu trúc sau (không kèm markdown \`\`\`json ngoài kết quả):
{
  "title": "Tên ngắn gọn của phiếu khám (VD: Phiếu kết quả xét nghiệm thường quy, Phiếu khám siêu âm tuyến giáp)",
  "recordDate": "YYYY-MM-DD (ngày khám hoặc ngày nhận mẫu xét nghiệm, định dạng chuẩn ISO)",
  "hospitalName": "Tên bệnh viện hoặc phòng khám (VD: Bệnh viện Đại học Y Hà Nội, BV Bạch Mai...)",
  "doctorName": "Tên bác sĩ chỉ định hoặc bác sĩ chuyên khoa ký tên",
  "patientName": "Họ và tên người bệnh",
  "patientYearOfBirth": 2000,
  "department": "Khoa phòng thực hiện (VD: Khoa Xét nghiệm, TT Chẩn đoán hình ảnh...)",
  "documentType": "general_health_check" | "blood_test" | "biochemistry_test" | "urinalysis" | "ultrasound" | "xray" | "ecg" | "endoscopy" | "other",
  "summaryDiagnosis": "Chẩn đoán lâm sàng hoặc kết luận tóm tắt chính của đợt khám",
  "metrics": [
    {
      "metricCode": "Mã chuẩn hóa (VD: GLUCOSE, RBC, HGB, HCT, MCV, MCH, MCHC, WBC, NEUT_PCT, LYM_PCT, PLT, UREA, CREATININE, EGFR, URIC_ACID, CHOLESTEROL, TRIGLYCERIDE, HDL_C, LDL_C, AST_GOT, ALT_GPT, GGT, ION_NA, ION_K, FT4, TSH, URI_PH, URI_SG, URI_PRO...)",
      "metricName": "Tên đầy đủ của chỉ số (VD: Định lượng Glucose [Máu], Số lượng hồng cầu (RBC))",
      "category": "blood_count" | "biochemistry" | "urinalysis" | "vitals" | "custom",
      "value": "Giá trị đo được dạng chuỗi (VD: '4.5', '2.15', '103', 'Âm tính')",
      "numericValue": 4.5,
      "unit": "Đơn vị (VD: 'mmol/L', 'µmol/L', 'T/L', 'g/L', 'U/L', '%')",
      "referenceRange": "Khoảng tham chiếu chuẩn ghi trong phiếu (VD: '4.1 - 5.6', '< 5.2', 'Âm tính')",
      "minNormal": 4.1,
      "maxNormal": 5.6,
      "status": "normal" | "low" | "high" | "abnormal",
      "notes": "Ghi chú thêm nếu chỉ số vượt ngưỡng hoặc có khuyến nghị"
    }
  ],
  "imagingFindings": [
    {
      "serviceName": "Tên dịch vụ (VD: Siêu âm tuyến giáp, XQ ngực thẳng, Điện tâm đồ thường, Nội soi tai mũi họng)",
      "description": "Mô tả chi tiết hình ảnh",
      "conclusion": "Kết luận của bác sĩ chuyên khoa",
      "classification": "Phân loại bệnh học nếu có (VD: TIRADS 2, Loại 2)",
      "doctor": "Bác sĩ thực hiện",
      "pacsUrl": "Đường dẫn tra cứu kết quả trực tuyến PACS nếu có trong phiếu"
    }
  ],
  "aiAnalysisNotes": "Đoạn văn ngắn (2-3 câu) tóm lược sức khỏe của người bệnh: các chỉ số nào đẹp/bình thường, chỉ số nào cần lưu ý hoặc điều chỉnh chế độ ăn uống sinh hoạt."
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileBase64, mimeType, fileName, rawText, files } = body;

    const fileList: Array<{ fileBase64: string; mimeType: string; fileName?: string }> = [];
    if (Array.isArray(files) && files.length > 0) {
      fileList.push(...files);
    } else if (fileBase64 && mimeType) {
      fileList.push({ fileBase64, mimeType, fileName });
    }

    if (fileList.length === 0 && !rawText) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp nội dung tệp hoặc văn bản kết quả khám.' },
        { status: 400 }
      );
    }

    const customApiKey = req.headers.get('x-gemini-api-key');
    const ai = getGeminiServerClient(customApiKey || undefined);

    const parts: any[] = [];

    // Duyệt qua tất cả các file được gửi lên (ảnh các trang, pdf...)
    for (const f of fileList) {
      if (!f.fileBase64 || !f.mimeType) continue;
      const cleanBase64 = f.fileBase64.replace(/^data:[^;]+;base64,/, '');

      if (
        f.mimeType === 'application/pdf' ||
        f.mimeType.startsWith('image/')
      ) {
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: cleanBase64,
          },
        });
      } else {
        // Tệp văn bản
        try {
          const textDecoded = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          parts.push({
            text: `[Nội dung tệp ${f.fileName || 'tài liệu'}]:\n${textDecoded}`,
          });
        } catch {
          parts.push({
            text: `[Dữ liệu text ${f.fileName}]:\n${rawText || ''}`,
          });
        }
      }
    }

    if (rawText && !parts.some((p) => p.text)) {
      parts.push({
        text: `[Văn bản kết quả khám bệnh]:\n${rawText}`,
      });
    }

    parts.push({
      text: 'Hãy đọc toàn bộ dữ liệu tài liệu y tế ở trên (nếu có nhiều trang hoặc nhiều ảnh của cùng một đợt khám, hãy tổng hợp đầy đủ tất cả chỉ số xét nghiệm, kết luận chẩn đoán hình ảnh và đánh giá từ mọi trang) và trích xuất thành JSON chuẩn xác theo đúng cấu trúc đã chỉ định.',
    });

    // Thử gọi các model Gemini
    const modelsToTry = [
      DEFAULT_GEMINI_MODEL,
      ...FALLBACK_GEMINI_MODELS.filter((m) => m !== DEFAULT_GEMINI_MODEL),
    ];

    let lastError: any = null;
    let extractedJsonText = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.1, // Cực kỳ chính xác cho dữ liệu y tế
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          extractedJsonText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Medical Parser] Model ${model} gặp lỗi:`, err?.message);
        continue;
      }
    }

    if (!extractedJsonText) {
      throw lastError || new Error('Không thể phân tích tài liệu y tế qua AI.');
    }

    // Làm sạch JSON
    let cleanJson = extractedJsonText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: parsedData,
      fileName,
    });
  } catch (error: any) {
    console.error('Error in /api/health/parse-document:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Lỗi xử lý tài liệu y tế.',
      },
      { status: 500 }
    );
  }
}
