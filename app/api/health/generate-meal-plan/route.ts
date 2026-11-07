// app/api/health/generate-meal-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient } from '@/core/ai/geminiServer';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from '@/core/ai/types';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Bạn là Chuyên gia Dinh dưỡng Lâm sàng & Bác sĩ Tiết chế Dinh dưỡng hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là phân tích các chỉ số sức khỏe, bệnh học, mục tiêu thể chất và sở thích ăn uống của người dùng để thiết kế một KẾ HOẠCH THỰC ĐƠN DINH DƯỠNG CÁ NHÂN HÓA 7 NGÀY (từ Thứ Hai đến Chủ Nhật).

YÊU CẦU ĐẶC BIỆT VỀ ẨM THỰC VÀ BỆNH HỌC:
1. Ẩm thực thuần Việt: Các món ăn phải là món cơm gia đình, món bún/miến/phở hoặc món thanh đạm quen thuộc với người Việt Nam, nguyên liệu dễ mua ở chợ/siêu thị, cách chế biến thực tế (luộc, hấp, xào ít dầu, canh thanh mát).
2. Tác động y khoa trực tiếp vào các chỉ số bất thường:
   - Nếu Uric Acid cao / Gout: Tuyệt đối tránh thịt đỏ, lòng mề, hải sản vỏ cứng, bia rượu; ưu tiên đạm trắng (ức gà, cá quả, đậu phụ), nhiều rau xanh (hạn chế măng tây, nấm), uống nhiều nước.
   - Nếu Mỡ máu / Cholesterol / Triglyceride cao: Tránh mỡ động vật, đồ chiên rán ngập dầu, da gà; tăng cường cá có omega-3 (cá hồi, cá thu, cá nục), dầu oliu, đậu bắp, rau mồng tơi, hạt chia.
   - If Đường huyết / Glucose / HbA1c cao: Chế độ Low-GI, hạn chế tinh bột trắng hấp thu nhanh, bánh kẹo ngọt; ưu tiên gạo lứt, yến mạch, khoai lang luộc, rau lá xanh.
   - Nếu Men gan cao (AST, ALT, GGT): Thức ăn dễ tiêu, nhiều chất chống oxy hóa (bông cải xanh, atiso, cà rốt, trà xanh, nước đỗ đen), tuyệt đối kiêng cồn.
   - Nếu Huyết áp cao: Chế độ DASH, giảm muối (<5g muối/ngày), tăng thực phẩm giàu Kali, Magie (chuối, rau chân vịt, khoai lang).
3. Mỗi món ăn phải có "healthBenefit" giải thích rõ ràng tại sao món này tốt cho chỉ số nào của bệnh nhân.

Yêu cầu xuất ra định dạng JSON CHÍNH XÁC theo cấu trúc sau (không kèm markdown \`\`\`json ngoài kết quả):
{
  "title": "Tên thực đơn (VD: Thực đơn 7 ngày Hạ Axit Uric & Kiểm soát Mỡ máu)",
  "targetCalories": 1800,
  "targetWaterMl": 2500,
  "macroRatio": {
    "carbsPct": 50,
    "proteinPct": 25,
    "fatPct": 25
  },
  "aiAnalysisSummary": "Đoạn văn ngắn (3-4 câu) phân tích thể trạng dựa trên các chỉ số của người dùng, giải thích chiến lược dinh dưỡng và dự báo cải thiện sau 2-4 tuần.",
  "dosAndDonts": {
    "recommendedFoods": [
      "Thực phẩm 1 (lý do)",
      "Thực phẩm 2 (lý do)"
    ],
    "avoidFoods": [
      "Vùng cấm 1 (tại sao nguy hiểm)",
      "Vùng cấm 2 (tại sao nguy hiểm)"
    ],
    "medicalAdvice": [
      "Lời khuyên về nhai kỹ, thời gian ăn",
      "Lời khuyên về uống nước và vận động"
    ]
  },
  "days": [
    {
      "dayOfWeek": 1,
      "dayName": "Thứ Hai",
      "dayCalories": 1820,
      "breakfast": [
        {
          "id": "b1_1",
          "name": "Cháo yến mạch ức gà xé phay & nấm hương",
          "portion": "1 tô vừa (300ml)",
          "calories": 380,
          "carbs": 45,
          "protein": 30,
          "fat": 8,
          "healthBenefit": "Yến mạch giàu beta-glucan giúp hạ mỡ máu và ổn định đường huyết buổi sáng",
          "recipeTips": "Không dùng nước hầm xương đậm đặc để tránh tăng purin"
        }
      ],
      "lunch": [
        {
          "id": "l1_1",
          "name": "Cơm gạo lứt (1 bát) + Cá quả hấp thì là + Canh rau ngót nấu thịt nạc",
          "portion": "1 phần cơm trưa đầy đủ",
          "calories": 650,
          "carbs": 75,
          "protein": 42,
          "fat": 12,
          "healthBenefit": "Cá quả lành tính, đạm tinh khiết ít purin, rau ngót giàu kali giúp thanh lọc",
          "recipeTips": "Hấp chín tới giữ nguyên vị ngọt tự nhiên, nêm muối nhạt"
        }
      ],
      "dinner": [
        {
          "id": "d1_1",
          "name": "Đậu phụ sốt cà chua tươi + Bông cải xanh luộc chấm vừng + Nửa bát cơm lứt",
          "portion": "1 phần cơm tối nhẹ",
          "calories": 520,
          "carbs": 50,
          "protein": 28,
          "fat": 14,
          "healthBenefit": "Bông cải xanh giàu sulforaphane hỗ trợ giải độc gan, bữa tối nhẹ giảm gánh nặng tiêu hóa",
          "recipeTips": "Dùng dầu đậu nành hoặc dầu oliu xào nhẹ cà chua"
        }
      ],
      "snacks": [
        {
          "id": "s1_1",
          "name": "1 quả ổi giòn (bỏ ruột) hoặc 1 hộp sữa chua không đường",
          "portion": "1 phần ăn phụ 15h30",
          "calories": 120,
          "carbs": 20,
          "protein": 5,
          "fat": 2,
          "healthBenefit": "Ổi giàu vitamin C hỗ trợ đào thải axit uric và tăng đề kháng",
          "recipeTips": "Ăn cách bữa chính ít nhất 2 tiếng"
        }
      ]
    }
    // ... ĐẦY ĐỦ CHO CẢ 7 NGÀY (Thứ Hai đến Chủ Nhật)
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      metrics = [],
      checkupTitle = '',
      clinicalConclusion = '',
      goal = 'maintain',
      preference = 'traditional_vn',
      allergies = [],
      excludedFoods = [],
      userStats = {},
    } = body;

    const customApiKey = req.headers.get('x-gemini-api-key');
    const ai = getGeminiServerClient(customApiKey || undefined);

    // Tóm tắt các chỉ số sinh học đưa vào context
    const metricsContext = metrics
      .map(
        (m: any) =>
          `- ${m.metricName || m.metricCode}: ${m.value} ${m.unit || ''} (Tham chiếu: ${m.referenceRange || 'N/A'}, Trạng thái: ${m.status || 'bình thường'})`
      )
      .join('\n');

    const promptMessage = `
Dưới đây là thông tin sức khỏe và yêu cầu của người dùng:

1. CHỈ SỐ XÉT NGHIỆM & SỨC KHỎE HIỆN TẠI:
${metricsContext || 'Chưa có chỉ số cụ thể, hãy thiết kế thực đơn nâng cao sức khỏe toàn diện.'}

2. THÔNG TIN ĐỢT KHÁM GẦN NHẤT:
- Tiêu đề đợt khám: ${checkupTitle || 'Khám sức khỏe tổng quát'}
- Chẩn đoán lâm sàng của bác sĩ: ${clinicalConclusion || 'Không có ghi nhận bất thường nghiêm trọng'}

3. THÔNG SỐ THỂ CHẤT:
- Chiều cao: ${userStats.heightCm ? `${userStats.heightCm} cm` : 'Chưa rõ'}
- Cân nặng: ${userStats.weightKg ? `${userStats.weightKg} kg` : 'Chưa rõ'}
- BMI: ${userStats.bmi ? userStats.bmi : 'Chưa rõ'}

4. MỤC TIÊU & SỞ THÍCH DINH DƯỠNG:
- Mục tiêu chính: ${goal} (VD: lower_uric_acid, lower_cholesterol, weight_loss, lower_glucose, liver_detox, heart_health, maintain)
- Phong cách ẩm thực mong muốn: ${preference} (VD: traditional_vn, eat_clean, low_carb, vegetarian, mediterranean)
- Dị ứng thực phẩm: ${allergies.length > 0 ? allergies.join(', ') : 'Không có'}
- Món không muốn ăn: ${excludedFoods.length > 0 ? excludedFoods.join(', ') : 'Không có'}

Hãy đóng vai Bác sĩ Dinh dưỡng Lâm sàng, thiết kế TOÀN BỘ THỰC ĐƠN 7 NGÀY (Thứ Hai đến Chủ Nhật) chi tiết từng bữa ăn chuẩn y khoa, thuần Việt, và trả về đúng định dạng JSON như đã chỉ định.`;

    const modelsToTry = [
      DEFAULT_GEMINI_MODEL,
      ...FALLBACK_GEMINI_MODELS.filter((m) => m !== DEFAULT_GEMINI_MODEL),
    ];

    let extractedJsonText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: promptMessage }],
            },
          ],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2, // Đảm bảo tính khoa học và ổn định
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          extractedJsonText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Meal Generator] Model ${model} gặp lỗi:`, err?.message);
        continue;
      }
    }

    if (!extractedJsonText) {
      throw lastError || new Error('Không nhận được phản hồi từ AI.');
    }

    // Làm sạch và parse JSON
    const cleanJson = extractedJsonText.replace(/```json\n?|\n?```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('[AI Meal Generator] Lỗi:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Có lỗi xảy ra khi tạo thực đơn bằng AI.',
      },
      { status: 500 }
    );
  }
}
