// app/api/health/parse-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient } from '@/core/ai/geminiServer';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from '@/core/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Cho phép phân tích OCR tài liệu y tế tối đa 60 giây

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
      "metricCode": "Mã chuẩn hóa (VD: GLUCOSE, RBC, HGB, HCT, MCV, MCH, MCHC, WBC, NEUT_PCT, LYM_PCT, PLT, UREA, CREATININE, EGFR, URIC_ACID, CHOLESTEROL, TRIGLYCERIDE, HDL_C, LDL_C, AST_GOT, ALT_GPT, GGT, ION_NA, ION_K, FT4, TSH, URI_PH, URI_SG, URI_PRO, US_ABDOMEN, US_THYROID, XRAY_CHEST, ECG_RHYTHM, ENT_ENDOSCOPY, US_CARDIAC...)",
      "metricName": "Tên đầy đủ của chỉ số hoặc dịch vụ (VD: Định lượng Glucose [Máu], Số lượng hồng cầu (RBC), Siêu âm ổ bụng tổng quát, Điện tâm đồ ECG, Chụp X-quang ngực thẳng, Nội soi tai mũi họng)",
      "category": "blood_count" | "biochemistry" | "urinalysis" | "imaging_functional" | "vitals" | "custom",
      "value": "Giá trị đo được dạng chuỗi (VD: '4.5', '2.15', '103', 'Âm tính', 'Hình ảnh siêu âm ổ bụng không thấy bất thường', 'Nhịp xoang đều 72 ck/p')",
      "numericValue": 4.5,
      "unit": "Đơn vị (VD: 'mmol/L', 'µmol/L', 'T/L', 'g/L', 'U/L', '%', 'kết luận')",
      "referenceRange": "Khoảng tham chiếu chuẩn ghi trong phiếu (VD: '4.1 - 5.6', '< 5.2', 'Âm tính', 'Bình thường / Chưa thấy tổn thương')",
      "minNormal": 4.1,
      "maxNormal": 5.6,
      "status": "normal" | "low" | "high" | "abnormal" | "warning",
      "notes": "Ghi chú thêm nếu chỉ số vượt ngưỡng hoặc mô tả tổn thương"
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
}
LƯU Ý CỰC KỲ QUAN TRỌNG:
1. Nếu tài liệu là hoặc có bao gồm kết quả Siêu âm, X-quang, Điện tim (ECG), Nội soi, CT, MRI...:
   - Hãy điền chi tiết vào mảng imagingFindings
   - ĐỒNG THỜI tạo các phần tử tương ứng trong mảng metrics với category: 'imaging_functional' (value là kết luận của bác sĩ, unit là 'kết luận', referenceRange là 'Bình thường / Chưa thấy tổn thương', status là 'normal' hoặc 'warning' nếu phát hiện nang/nhân/sỏi/viêm/u/dày/tổn thương).
   - Tuyệt đối KHÔNG bỏ sót các kết quả CĐHA & Thăm dò chức năng.`;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let rawText = '';
    const fileList: Array<{ fileBase64: string; mimeType: string; fileName?: string }> = [];

    // 1. ƯU TIÊN: Xử lý dạng multipart/form-data (Binary stream, không bị phình 33% Base64)
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        rawText = (formData.get('rawText') as string) || '';

        const formFiles = formData.getAll('files') as (File | string)[];
        const singleFile = formData.get('file') as File | null;
        const allFiles: File[] = [];

        for (const item of formFiles) {
          if (item instanceof File && item.size > 0) {
            allFiles.push(item);
          }
        }
        if (singleFile instanceof File && singleFile.size > 0 && !allFiles.some((f) => f.name === singleFile.name && f.size === singleFile.size)) {
          allFiles.push(singleFile);
        }

        for (const file of allFiles) {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          fileList.push({
            fileBase64: base64,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name,
          });
        }
      } catch (formErr: any) {
        console.error('Lỗi phân giải FormData:', formErr);
        return NextResponse.json(
          {
            success: false,
            error: 'Dung lượng tệp vượt quá giới hạn hoặc định dạng FormData không hợp lệ.',
          },
          { status: 413 }
        );
      }
    } else {
      // 2. FALLBACK: Xử lý dạng JSON
      let body: any;
      try {
        body = await req.json();
      } catch (parseErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: 'Dung lượng yêu cầu quá lớn (413 Payload Too Large) hoặc cấu trúc dữ liệu không hợp lệ. Vui lòng tải từng ảnh hoặc giảm bớt số trang tài liệu.',
          },
          { status: 413 }
        );
      }

      const { fileBase64, mimeType, fileName, rawText: jsonRawText, files } = body || {};
      rawText = jsonRawText || '';

      if (Array.isArray(files) && files.length > 0) {
        fileList.push(...files);
      } else if (fileBase64 && mimeType) {
        fileList.push({ fileBase64, mimeType, fileName });
      }
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

    // Đảm bảo mọi kết quả CĐHA & Thăm dò trong imagingFindings luôn được đồng bộ vào metrics với category imaging_functional
    if (Array.isArray(parsedData.imagingFindings) && parsedData.imagingFindings.length > 0) {
      if (!Array.isArray(parsedData.metrics)) {
        parsedData.metrics = [];
      }
      parsedData.imagingFindings.forEach((img: any) => {
        const serviceName = (img.serviceName || '').trim();
        const exists = parsedData.metrics.some(
          (m: any) =>
            m.category === 'imaging_functional' &&
            (m.metricName || '').toLowerCase() === serviceName.toLowerCase()
        );
        if (!exists && serviceName) {
          let code = 'IMAGING_FINDING';
          const nameLower = serviceName.toLowerCase();
          if (nameLower.includes('ổ bụng') || nameLower.includes('bung')) code = 'US_ABDOMEN';
          else if (nameLower.includes('tuyến giáp') || nameLower.includes('giáp')) code = 'US_THYROID';
          else if (nameLower.includes('tai') || nameLower.includes('mũi') || nameLower.includes('họng') || nameLower.includes('tmh')) code = 'ENT_ENDOSCOPY';
          else if (nameLower.includes('xquang') || nameLower.includes('x-quang') || nameLower.includes('xq') || nameLower.includes('tim phổi') || nameLower.includes('ngực')) code = 'XRAY_CHEST';
          else if (nameLower.includes('điện tim') || nameLower.includes('điện tâm đồ') || nameLower.includes('ecg')) code = 'ECG_RHYTHM';
          else if (nameLower.includes('tim') && nameLower.includes('siêu âm')) code = 'US_CARDIAC';
          else if (nameLower.includes('nội soi')) code = 'ENDOSCOPY_EXAM';
          else if (nameLower.includes('siêu âm')) code = 'ULTRASOUND_EXAM';

          const conLower = (img.conclusion || img.description || '').toLowerCase();
          const hasAbnormal =
            conLower.includes('bất thường') ||
            conLower.includes('viêm') ||
            conLower.includes('sỏi') ||
            conLower.includes('nang') ||
            conLower.includes('nhân') ||
            conLower.includes('u ') ||
            conLower.includes('khối');

          parsedData.metrics.push({
            metricCode: code,
            metricName: serviceName,
            category: 'imaging_functional',
            value: img.conclusion || img.description || 'Đã thực hiện',
            unit: 'kết luận',
            referenceRange: 'Bình thường / Chưa thấy tổn thương',
            status: hasAbnormal ? 'warning' : 'normal',
            notes: img.description || (img.classification ? `Phân loại: ${img.classification}` : undefined),
          });
        }
      });
    }

    const combinedFileNames = fileList.map((f) => f.fileName).filter(Boolean).join(', ');

    return NextResponse.json({
      success: true,
      data: parsedData,
      fileName: combinedFileNames || undefined,
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
