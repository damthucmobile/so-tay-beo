// features/health/types.ts

export type HealthCategory =
  | 'vitals' // Chỉ số sinh tồn & Thể chất (Cân nặng, Huyết áp, Nhịp tim, SpO2, BMI)
  | 'blood_count' // Huyết học & Công thức máu (RBC, WBC, PLT, Hb, HCT...)
  | 'biochemistry' // Sinh hóa máu (Đường huyết, Men gan, Chức năng thận, Mỡ máu, Điện giải, Tuyến giáp)
  | 'urinalysis' // Nước tiểu 10 thông số (pH, Tỷ trọng, Protein, Glucose, Bạch cầu...)
  | 'imaging_functional' // Thăm dò chức năng & Chẩn đoán hình ảnh (Điện tim, Siêu âm, X-Quang, Nội soi)
  | 'custom'; // Chỉ số sức khỏe tùy biến khác

export type MetricStatus = 'normal' | 'low' | 'high' | 'abnormal' | 'warning';

export interface HealthMetricValue {
  id: string;
  metricCode: string; // e.g. "WEIGHT", "BP_SYS", "GLUCOSE", "CHOLESTEROL", "WBC"
  metricName: string; // e.g. "Định lượng Glucose [Máu]", "Cân nặng"
  category: HealthCategory;
  value: number | string; // 4.5 hoặc "120/80" hoặc "Nhịp xoang đều 68 ck/p"
  numericValue?: number; // Giá trị số phục vụ vẽ biểu đồ xu hướng
  unit?: string; // mmol/L, mg/dL, kg, mmHg, G/L, %
  referenceRange?: string; // e.g. "4.1 - 5.6", "136 - 145", "< 5.2"
  minNormal?: number;
  maxNormal?: number;
  status: MetricStatus; // 'normal' | 'low' | 'high' | 'abnormal'
  measuredAt: string; // ISO date 'YYYY-MM-DD' hoặc 'YYYY-MM-DDTHH:mm:ss'
  notes?: string;
  sourceDocId?: string; // ID hồ sơ khám nếu được import từ tài liệu
  checkupSessionId?: string; // ID đợt khám tổng thể tương ứng
  hospitalName?: string;
  doctorName?: string;
}

export interface HealthRecordDocument {
  id: string;
  userId: string;
  title: string; // e.g. "Khám sức khỏe định kỳ - BV Đại Học Y Hà Nội"
  recordDate: string; // YYYY-MM-DD
  hospitalName?: string; // Bệnh viện Đại học Y Hà Nội, v.v.
  doctorName?: string;
  patientName?: string;
  patientYearOfBirth?: number | string;
  department?: string; // Khoa Xét nghiệm, Chẩn đoán hình ảnh, v.v.
  checkupSessionId?: string; // ID đợt khám tổng thể
  documentType:
    | 'general_health_check'
    | 'blood_test'
    | 'biochemistry_test'
    | 'urinalysis'
    | 'ultrasound'
    | 'xray'
    | 'ecg'
    | 'endoscopy'
    | 'other';
  summaryDiagnosis?: string; // Chẩn đoán / Kết luận của bác sĩ
  metrics: HealthMetricValue[];
  imagingFindings?: Array<{
    serviceName: string; // Siêu âm tuyến giáp, Chụp XQ ngực thẳng...
    description: string;
    conclusion: string;
    classification?: string; // e.g. "TIRADS 2", "Loại 2"
    doctor?: string;
    pacsUrl?: string;
  }>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  extractedRawText?: string;
  aiAnalysisNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckupSession {
  id: string;
  userId: string;
  title: string; // e.g. "Khám sức khỏe tổng quát định kỳ 2026"
  checkupDate: string; // YYYY-MM-DD
  hospitalName: string; // Bệnh viện Đại học Y Hà Nội, Vinmec, Bạch Mai...
  doctorName?: string; // Bác sĩ kết luận
  healthClassification?: string; // Loại 1, Loại 2, Loại 3...
  clinicalConclusion?: string; // Tóm tắt kết luận tổng quát của bác sĩ
  familyHistory?: string; // Tiền sử gia đình (VD: Bố tiểu đường)
  specialtiesSummary?: {
    internalMedicine?: string; // Khám Nội: Tuần hoàn, Hô hấp, Tiêu hóa...
    surgery?: string; // Khám Ngoại: Nhân giáp, thoát vị...
    ophthalmology?: string; // Khám Mắt: Thị lực không kính, có kính, khúc xạ...
    dental?: string; // Răng hàm mặt: Sâu răng, cao răng, viêm lợi...
    ent?: string; // Tai Mũi Họng: Viêm mũi dị ứng, amydan...
    dermatology?: string; // Da liễu: Bình thường
  };
  notes?: string;
  recordsCount?: number;
  metricsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MetricDefinition {
  code: string;
  name: string;
  category: HealthCategory;
  defaultUnit: string;
  defaultMin?: number;
  defaultMax?: number;
  referenceText: string;
  description: string;
  clinicalSignificance?: string; // Ý nghĩa lâm sàng
  isCommonVital?: boolean; // Hiển thị ở thẻ chỉ số sinh tồn chính
}

// ==============================================================================
// ĐỊNH NGHĨA PHÂN HỆ DINH DƯỠNG & THỰC ĐƠN (NUTRITION & MEAL PLANNER)
// ==============================================================================

export type NutritionGoal =
  | 'weight_loss' // Giảm cân, thâm hụt calo lành mạnh
  | 'maintain' // Duy trì cân nặng & sức khỏe toàn diện
  | 'muscle_gain' // Tăng cơ, giàu đạm nạc
  | 'lower_glucose' // Hạ đường huyết / Kiểm soát đái tháo đường (Low-GI)
  | 'lower_cholesterol' // Hạ mỡ máu / Giảm LDL & Triglyceride
  | 'lower_uric_acid' // Hạ Axit Uric / Phòng ngừa Gout (Low-Purine)
  | 'liver_detox' // Hạ men gan / Giảm tải thải độc gan
  | 'heart_health'; // Huyết áp ổn định / Chế độ ăn DASH giảm muối

export type DietaryPreference =
  | 'traditional_vn' // Món cơm nhà truyền thống Việt Nam
  | 'eat_clean' // Eat Clean (nguyên bản, hấp/luộc, ít gia vị)
  | 'low_carb' // Ít tinh bột nhanh
  | 'vegetarian' // Ăn chay linh hoạt (rau củ, đậu nành, nấm)
  | 'mediterranean'; // Địa Trung Hải (cá béo, dầu oliu, hạt)

export interface MealItem {
  id: string;
  name: string; // VD: "Ức gà xào ớt chuông", "Canh mồng tơi nấu tôm tươi"
  portion: string; // VD: "1 bát con (150g)", "1 đĩa nhỏ"
  calories: number; // kcal
  carbs: number; // gam
  protein: number; // gam
  fat: number; // gam
  healthBenefit: string; // Lý do y khoa: "Giàu chất xơ hòa tan giúp giảm cholesterol"
  recipeTips?: string; // Gợi ý chế biến: "Hấp hoặc luộc, không nêm thêm bột ngọt"
}

export interface DailyMealPlan {
  dayOfWeek: number; // 1 (Thứ 2) -> 7 (Chủ nhật)
  dayName: string; // "Thứ Hai", "Thứ Ba"...
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks?: MealItem[];
  dayCalories: number;
}

export interface MealPlan {
  id: string;
  userId: string;
  title: string; // VD: "Thực đơn 7 ngày Hạ Axit Uric & Giảm mỡ máu"
  checkupSessionId?: string; // Liên kết đợt khám sức khỏe đã truyền cảm hứng
  goal: NutritionGoal;
  preference: DietaryPreference;
  targetCalories: number;
  targetWaterMl: number;
  macroRatio: {
    carbsPct: number;
    proteinPct: number;
    fatPct: number;
  };
  days: DailyMealPlan[];
  dosAndDonts: {
    recommendedFoods: string[]; // Thực phẩm vàng nên ăn
    avoidFoods: string[]; // Vùng cấm cần tránh
    medicalAdvice: string[]; // Khuyên dùng từ chuyên gia dinh dưỡng lâm sàng
  };
  aiAnalysisSummary: string; // Đoạn tóm tắt nhận định của AI
  createdAt: string;
  updatedAt: string;
}

export interface NutritionProfile {
  userId: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  tdee?: number; // Total Daily Energy Expenditure
  bmr?: number; // Basal Metabolic Rate
  primaryGoal: NutritionGoal;
  preference: DietaryPreference;
  allergies?: string[];
  excludedFoods?: string[];
  targetCalories: number;
  targetWaterMl: number;
  updatedAt: string;
}

export interface DailyWaterLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  targetMl: number;
  updatedAt: string;
}

