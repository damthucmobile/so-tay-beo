// app/api/health/generate-workout-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiServerClient } from '@/core/ai/geminiServer';
import { DEFAULT_GEMINI_MODEL, FALLBACK_GEMINI_MODELS } from '@/core/ai/types';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Bạn là Chuyên gia Y học Thể thao & Huấn luyện viên Thể chất (Sports Medicine & Conditioning Coach) hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là phân tích các chỉ số sức khỏe, bệnh học, mục tiêu thể chất và điều kiện tập luyện của người dùng để thiết kế một KẾ HOẠCH LỊCH TẬP THỂ CHẤT CÁ NHÂN HÓA 7 NGÀY (Thứ Hai đến Chủ Nhật).

YÊU CẦU ĐẶC BIỆT VỀ Y HỌC THỂ THAO VÀ AN TOÀN:
1. An toàn tim mạch & Huyết áp:
   - Nếu Huyết áp cao hoặc Tiền sử tim mạch: Tuyệt đối không thiết kế các bài tập nín thở gồng bụng quá mức (Valsalva). Ưu tiên Cardio hiếu khí Zone 2 (nhịp tim 60-70% max) và các bài kháng lực với tải trọng vừa phải, thở đều.
2. An toàn Cơ Xương Khớp & BMI:
   - Nếu BMI > 26 hoặc có ghi chú về khớp gối/cột sống: Tránh nhảy cao (Plyometrics, Jumping jacks nặng), ưu tiên bài ít va đập (Low-impact) như Đi bộ dốc, Đạp xe tĩnh, Bơi, Squat có điểm tựa, Cầu mông (Glute bridge).
3. Hỗ trợ Chuyển hóa & Bệnh lý nền:
   - Mỡ máu / Men gan / Đường huyết cao: Tăng cường các bài tập tác động vào các nhóm cơ lớn (Chân, Mông, Lưng) để kích thích thụ thể GLUT4 tiêu thụ glucose và oxy hóa axit béo tự do.
   - Axit Uric cao: Giữ cường độ tập ở mức vừa phải (RPE 6-7/10), tránh tập kiệt sức gây tích tụ axit lactic làm giảm bài tiết uric ở thận; nhắc nhở uống nước đều.
4. Cấu trúc mỗi buổi tập khoa học:
   - Khởi động (Warm-up): 5-7 phút làm ấm cơ, xoay khớp và nâng nhịp tim nhẹ nhàng.
   - Bài tập chính (Main): Các bài tập phù hợp với dụng cụ đã chọn, rõ ràng số hiệp (Sets), số lần (Reps) hoặc số giây (Duration), thời gian nghỉ (Rest).
   - Hạ nhiệt (Cool-down / Stretching): 5 phút dãn cơ tĩnh, thở sâu phục hồi hệ thần kinh phó giao cảm.
5. Cân bằng ngày nghỉ: Ít nhất 1-2 ngày nghỉ chủ động (Active Recovery / Mobility dãn cơ dưỡng sinh) trong tuần.

Yêu cầu xuất ra định dạng JSON CHÍNH XÁC theo cấu trúc sau (không kèm markdown \`\`\`json ngoài kết quả):
{
  "title": "Tên kế hoạch (VD: Lịch tập 7 ngày Giảm mỡ Zone 2 & Bảo vệ tim mạch)",
  "weeklyTargetCalories": 1600,
  "aiAnalysisSummary": "Đoạn văn ngắn (3-4 câu) phân tích thể trạng, chỉ số sinh học của người dùng và lý giải cơ chế phục hồi thể lực sau 2-4 tuần.",
  "safetyPrecautions": [
    "Lưu ý 1 về nhịp tim hoặc hô hấp",
    "Lưu ý 2 về bù nước khoáng và khởi động kỹ"
  ],
  "days": [
    {
      "dayOfWeek": 0,
      "dayName": "Thứ Hai",
      "sessionTitle": "Kháng lực thân trên & Cardio Zone 2",
      "focusMuscle": "Ngực, Vai, Tay sau & Tim mạch",
      "estimatedMinutes": 45,
      "estimatedCalories": 280,
      "intensity": "moderate",
      "isRestDay": false,
      "recoveryTips": "Uống 500ml nước ấm sau tập, dãn cơ ngực và vai.",
      "exercises": [
        {
          "id": "e_0_1",
          "name": "Xoay khớp & Khởi động tay không",
          "category": "warmup",
          "targetMuscle": "Toàn thân & Khớp",
          "sets": 1,
          "durationSeconds": 300,
          "restSeconds": 30,
          "formCues": "Xoay cổ tay, khuỷu tay, xoay vai và gập duỗi nhẹ nhàng",
          "medicalNotice": "Làm ấm dịch khớp trước khi bước vào bài chính"
        },
        {
          "id": "e_0_2",
          "name": "Chống đẩy có điểm tựa (Incline Push-ups)",
          "category": "main",
          "targetMuscle": "Ngực & Tay sau",
          "sets": 3,
          "reps": 12,
          "restSeconds": 60,
          "formCues": "Gồng nhẹ cơ bụng, hạ ngực chạm mép bàn/ghế, thở ra khi đẩy lên",
          "medicalNotice": "Không nín thở, giữ lưng thẳng tự nhiên"
        },
        {
          "id": "e_0_3",
          "name": "Đi bộ nhanh nhịp tim Zone 2",
          "category": "main",
          "targetMuscle": "Hệ tuần hoàn & Cơ đùi",
          "sets": 1,
          "durationSeconds": 1200,
          "restSeconds": 60,
          "formCues": "Bước dài vừa phải, đánh tay tự nhiên, tốc độ có thể nói chuyện ngắt quãng",
          "medicalNotice": "Duy trì nhịp tim ổn định giúp đốt mỡ tự do tối ưu"
        },
        {
          "id": "e_0_4",
          "name": "Dãn cơ ngực & Thở hồi tĩnh",
          "category": "cooldown",
          "targetMuscle": "Cơ ngực & Thần kinh",
          "sets": 1,
          "durationSeconds": 240,
          "restSeconds": 0,
          "formCues": "Tựa tay vào tường xoay nhẹ thân người dãn ngực, hít sâu thở chậm",
          "medicalNotice": "Giúp hạ nhịp tim về mức nghỉ"
        }
      ]
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      metrics = [],
      checkupSessions = [],
      profile = {},
      workoutGoal = 'general_fitness',
      fitnessLevel = 'beginner',
      equipment = ['bodyweight'],
      durationMinutes = 45,
      preferredDaysPerWeek = 4,
      limitations = [],
    } = body;

    // Chuẩn bị thông tin sức khỏe để gửi AI
    const metricsSummary = (metrics || [])
      .map((m: any) => `${m.metricName || m.metricCode}: ${m.value} ${m.unit || ''} (Tình trạng: ${m.status || 'bình thường'})`)
      .slice(0, 20)
      .join('\n');

    const promptUser = `
HÃY THIẾT KẾ KẾ HOẠCH LỊCH TẬP THỂ CHẤT 7 NGÀY CHO TÔI:

1. THÔNG TIN THỂ TRẠNG & SỨC KHỎE:
- Chiều cao / Cân nặng: ${profile?.heightCm ? `${profile.heightCm} cm` : 'Chưa rõ'} / ${profile?.weightKg ? `${profile.weightKg} kg` : 'Chưa rõ'}
- BMI: ${profile?.bmi || 'Chưa rõ'}
- Các chỉ số xét nghiệm hiện tại:
${metricsSummary || 'Không có chỉ số bất thường'}

2. MỤC TIÊU & ĐIỀU KIỆN TẬP LUYỆN:
- Mục tiêu chính: ${workoutGoal}
- Cấp độ thể lực: ${fitnessLevel}
- Dụng cụ sẵn có: ${Array.isArray(equipment) ? equipment.join(', ') : 'bodyweight'}
- Thời gian mỗi buổi: ${durationMinutes} phút
- Số ngày muốn tập trong tuần: ${preferredDaysPerWeek} ngày / tuần
- Hạn chế cơ thể / Vấn đề xương khớp: ${limitations.length > 0 ? limitations.join(', ') : 'Không có'}

Hãy trả về duy nhất định dạng JSON thuần hợp lệ (7 ngày đầy đủ từ Thứ Hai đến Chủ Nhật).`;

    const ai = getGeminiServerClient();
    const modelsToTry = [DEFAULT_GEMINI_MODEL, ...FALLBACK_GEMINI_MODELS];

    let rawText = '';
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${promptUser}` }],
            },
          ],
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        rawText = response.text || '';
        if (rawText.trim()) break;
      } catch (err) {
        lastError = err;
        console.warn(`Lỗi tạo lịch tập với model ${model}, thử fallback...`, err);
      }
    }

    if (!rawText.trim()) {
      throw lastError || new Error('Không thể kết nối với Gemini AI');
    }

    // Làm sạch markdown nếu có
    const cleanedJson = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    const parsedData = JSON.parse(cleanedJson);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Lỗi API generate-workout-plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý tạo lịch tập' },
      { status: 500 }
    );
  }
}
