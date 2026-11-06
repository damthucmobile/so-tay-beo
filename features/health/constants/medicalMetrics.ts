// features/health/constants/medicalMetrics.ts
import { MetricDefinition } from '../types';

export const MEDICAL_METRIC_DEFINITIONS: MetricDefinition[] = [
  // ============================================================================
  // 1. CHỈ SỐ SINH TỒN & THỂ CHẤT HÀNG NGÀY (VITALS)
  // ============================================================================
  {
    code: 'WEIGHT',
    name: 'Cân nặng',
    category: 'vitals',
    defaultUnit: 'kg',
    defaultMin: 45,
    defaultMax: 80,
    referenceText: 'BMI 18.5 - 24.9',
    description: 'Trọng lượng cơ thể đo vào buổi sáng lúc bụng đói',
    isCommonVital: true,
  },
  {
    code: 'HEIGHT',
    name: 'Chiều cao',
    category: 'vitals',
    defaultUnit: 'cm',
    defaultMin: 140,
    defaultMax: 195,
    referenceText: '140 - 195 cm',
    description: 'Chiều cao đứng thẳng',
    isCommonVital: false,
  },
  {
    code: 'BMI',
    name: 'Chỉ số khối cơ thể (BMI)',
    category: 'vitals',
    defaultUnit: 'kg/m²',
    defaultMin: 18.5,
    defaultMax: 22.9, // Tiêu chuẩn người châu Á (IDI & WPRO)
    referenceText: '18.5 - 22.9',
    description: 'Đánh giá mức độ cân đối thể trạng (WHO/Châu Á)',
    isCommonVital: true,
  },
  {
    code: 'BP_SYS',
    name: 'Huyết áp tâm thu (Tối đa)',
    category: 'vitals',
    defaultUnit: 'mmHg',
    defaultMin: 90,
    defaultMax: 120,
    referenceText: '90 - 120 mmHg',
    description: 'Áp lực máu trong động mạch khi tim co bóp',
    isCommonVital: true,
  },
  {
    code: 'BP_DIA',
    name: 'Huyết áp tâm trương (Tối thiểu)',
    category: 'vitals',
    defaultUnit: 'mmHg',
    defaultMin: 60,
    defaultMax: 80,
    referenceText: '60 - 80 mmHg',
    description: 'Áp lực máu trong động mạch khi tim nghỉ',
    isCommonVital: true,
  },
  {
    code: 'HEART_RATE',
    name: 'Nhịp tim lúc nghỉ',
    category: 'vitals',
    defaultUnit: 'bpm',
    defaultMin: 60,
    defaultMax: 100,
    referenceText: '60 - 100 chu kỳ/phút',
    description: 'Số lần tim đập trong một phút ở trạng thái tĩnh',
    isCommonVital: true,
  },
  {
    code: 'SPO2',
    name: 'Độ bão hòa Oxy (SpO2)',
    category: 'vitals',
    defaultUnit: '%',
    defaultMin: 95,
    defaultMax: 100,
    referenceText: '95 - 100 %',
    description: 'Tỷ lệ hemoglobin có gắn oxy trong máu ngoại vi',
    isCommonVital: true,
  },
  {
    code: 'TEMP',
    name: 'Nhiệt độ cơ thể',
    category: 'vitals',
    defaultUnit: '°C',
    defaultMin: 36.1,
    defaultMax: 37.2,
    referenceText: '36.1 - 37.2 °C',
    description: 'Thân nhiệt đo tại nách hoặc trán',
    isCommonVital: false,
  },
  {
    code: 'BODY_FAT',
    name: 'Tỷ lệ mỡ cơ thể',
    category: 'vitals',
    defaultUnit: '%',
    defaultMin: 14,
    defaultMax: 24,
    referenceText: '14 - 24 % (Nam), 20 - 30 % (Nữ)',
    description: 'Tỷ lệ khối mỡ trên tổng trọng lượng cơ thể',
    isCommonVital: false,
  },
  {
    code: 'PR_INTERVAL',
    name: 'Khoảng PR (Điện tâm đồ)',
    category: 'vitals',
    defaultUnit: 'ms',
    defaultMin: 120,
    defaultMax: 200,
    referenceText: '120 - 200 ms',
    description: 'Thời gian dẫn truyền nhĩ - thất trên điện tim',
    isCommonVital: false,
  },
  {
    code: 'QRS_DURATION',
    name: 'Thời gian phức bộ QRS (Điện tâm đồ)',
    category: 'vitals',
    defaultUnit: 'ms',
    defaultMin: 60,
    defaultMax: 110,
    referenceText: '60 - 110 ms',
    description: 'Thời gian khử cực tâm thất trên điện tim',
    isCommonVital: false,
  },
  {
    code: 'QTC',
    name: 'Khoảng QT hiệu chỉnh (QTc)',
    category: 'vitals',
    defaultUnit: 'ms',
    defaultMin: 350,
    defaultMax: 450,
    referenceText: '< 450 ms',
    description: 'Thời gian phục hồi điện học của tâm thất',
    isCommonVital: false,
  },

  // ============================================================================
  // 2. HUYẾT HỌC & CÔNG THỨC MÁU (BLOOD COUNT - CBC)
  // ============================================================================
  {
    code: 'RBC',
    name: 'Số lượng Hồng cầu (RBC)',
    category: 'blood_count',
    defaultUnit: 'T/L',
    defaultMin: 4.0,
    defaultMax: 5.9,
    referenceText: '4.0 - 5.9 T/L',
    description: 'Vận chuyển oxy từ phổi đến các mô trong cơ thể',
  },
  {
    code: 'HGB',
    name: 'Huyết sắc tố (Hemoglobin)',
    category: 'blood_count',
    defaultUnit: 'g/L',
    defaultMin: 125,
    defaultMax: 175,
    referenceText: '125 - 175 g/L',
    description: 'Protein chứa sắt trong hồng cầu mang oxy',
  },
  {
    code: 'HCT',
    name: 'Hematocrit (HCT)',
    category: 'blood_count',
    defaultUnit: 'L/L',
    defaultMin: 0.4,
    defaultMax: 0.53,
    referenceText: '0.40 - 0.53 L/L (40 - 53%)',
    description: 'Tỷ lệ thể tích hồng cầu trên tổng thể tích máu',
  },
  {
    code: 'MCV',
    name: 'Thể tích trung bình Hồng cầu (MCV)',
    category: 'blood_count',
    defaultUnit: 'fL',
    defaultMin: 80,
    defaultMax: 100,
    referenceText: '80 - 100 fL',
    description: 'Kích thước trung bình của tế bào hồng cầu',
  },
  {
    code: 'MCH',
    name: 'HST trung bình Hồng cầu (MCH)',
    category: 'blood_count',
    defaultUnit: 'pg',
    defaultMin: 26,
    defaultMax: 34,
    referenceText: '26 - 34 pg',
    description: 'Lượng huyết sắc tố trung bình trong mỗi hồng cầu',
  },
  {
    code: 'MCHC',
    name: 'Nồng độ HST trung bình Hồng cầu (MCHC)',
    category: 'blood_count',
    defaultUnit: 'g/L',
    defaultMin: 315,
    defaultMax: 363,
    referenceText: '315 - 363 g/L',
    description: 'Nồng độ huyết sắc tố trong một thể tích hồng cầu',
  },
  {
    code: 'RDW_CV',
    name: 'Dải phân bố Hồng cầu (RDW-CV)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 11,
    defaultMax: 17,
    referenceText: '11 - 17 %',
    description: 'Độ đồng đều về kích thước giữa các tế bào hồng cầu',
  },
  {
    code: 'WBC',
    name: 'Số lượng Bạch cầu (WBC)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 4.0,
    defaultMax: 10.0,
    referenceText: '4.0 - 10.0 G/L',
    description: 'Hệ thống miễn dịch phòng vệ chống nhiễm trùng',
  },
  {
    code: 'NEUT_PCT',
    name: 'Tỷ lệ Bạch cầu trung tính (NEUT%)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 45,
    defaultMax: 75,
    referenceText: '45 - 75 %',
    description: 'Bạch cầu đáp ứng nhanh đầu tiên chống nhiễm khuẩn',
  },
  {
    code: 'LYM_PCT',
    name: 'Tỷ lệ Bạch cầu Lympho (LYM%)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 20,
    defaultMax: 45,
    referenceText: '20 - 45 %',
    description: 'Tế bào miễn dịch chống virus và sinh kháng thể',
  },
  {
    code: 'MONO_PCT',
    name: 'Tỷ lệ Bạch cầu Mono (MONO%)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 0,
    defaultMax: 8,
    referenceText: '0 - 8 %',
    description: 'Đại thực bào dọn dẹp vi khuẩn và tế bào chết',
  },
  {
    code: 'EOS_PCT',
    name: 'Tỷ lệ Bạch cầu ưa Acid (EOS%)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 0,
    defaultMax: 8,
    referenceText: '0 - 8 %',
    description: 'Bạch cầu chống dị ứng và ký sinh trùng',
  },
  {
    code: 'BASO_PCT',
    name: 'Tỷ lệ Bạch cầu ưa Base (BASO%)',
    category: 'blood_count',
    defaultUnit: '%',
    defaultMin: 0,
    defaultMax: 2,
    referenceText: '0 - 2 %',
    description: 'Tham gia vào phản ứng viêm và giải phóng histamin',
  },
  {
    code: 'PLT',
    name: 'Số lượng Tiểu cầu (PLT)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 150,
    defaultMax: 450,
    referenceText: '150 - 450 G/L',
    description: 'Tế bào tham gia đông máu và cầm máu',
  },
  {
    code: 'MPV',
    name: 'Thể tích trung bình Tiểu cầu (MPV)',
    category: 'blood_count',
    defaultUnit: 'fL',
    defaultMin: 5,
    defaultMax: 20,
    referenceText: '5 - 20 fL',
    description: 'Kích thước trung bình của tiểu cầu trong máu',
  },
  {
    code: 'NEUT',
    name: 'Số lượng Bạch cầu trung tính tuyệt đối (NEUT)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 1.8,
    defaultMax: 7.5,
    referenceText: '1.8 - 7.5 G/L',
    description: 'Số lượng tuyệt đối của bạch cầu hạt trung tính',
  },
  {
    code: 'LYMPT',
    name: 'Số lượng Bạch cầu Lympho tuyệt đối (LYM)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 0.8,
    defaultMax: 4.5,
    referenceText: '0.8 - 4.5 G/L',
    description: 'Số lượng tuyệt đối của tế bào miễn dịch lympho',
  },
  {
    code: 'MONO',
    name: 'Số lượng Bạch cầu Mono tuyệt đối (MONO)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 0,
    defaultMax: 0.8,
    referenceText: '0 - 0.8 G/L',
    description: 'Số lượng tuyệt đối của bạch cầu đơn nhân (mono)',
  },
  {
    code: 'EOS',
    name: 'Số lượng Bạch cầu ưa Acid tuyệt đối (EOS)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 0,
    defaultMax: 0.8,
    referenceText: '0 - 0.8 G/L',
    description: 'Số lượng tuyệt đối của bạch cầu ái toan',
  },
  {
    code: 'BASO',
    name: 'Số lượng Bạch cầu ưa Base tuyệt đối (BASO)',
    category: 'blood_count',
    defaultUnit: 'G/L',
    defaultMin: 0,
    defaultMax: 0.1,
    referenceText: '0 - 0.1 G/L',
    description: 'Số lượng tuyệt đối của bạch cầu ái kiềm',
  },

  // ============================================================================
  // 3. SINH HÓA MÁU (BIOCHEMISTRY)
  // ============================================================================
  // Đường huyết
  {
    code: 'GLUCOSE',
    name: 'Định lượng Glucose [Máu đói]',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 4.1,
    defaultMax: 5.6,
    referenceText: '4.1 - 5.6 mmol/L',
    description: 'Đường huyết lúc đói tầm soát đái tháo đường',
    isCommonVital: true,
  },
  {
    code: 'HBA1C',
    name: 'Chỉ số HbA1c',
    category: 'biochemistry',
    defaultUnit: '%',
    defaultMin: 4.0,
    defaultMax: 5.7,
    referenceText: '< 5.7 %',
    description: 'Mức đường huyết trung bình trong 3 tháng qua',
  },

  // Thận
  {
    code: 'UREA',
    name: 'Định lượng Ure [Máu]',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 2.76,
    defaultMax: 8.07,
    referenceText: '2.76 - 8.07 mmol/L',
    description: 'Sản phẩm chuyển hóa đạm đào thải qua thận',
  },
  {
    code: 'CREATININE',
    name: 'Định lượng Creatinin [Máu]',
    category: 'biochemistry',
    defaultUnit: 'µmol/L',
    defaultMin: 59,
    defaultMax: 104,
    referenceText: '59 - 104 µmol/L (Nam), 44 - 88 (Nữ)',
    description: 'Đánh giá chức năng lọc của cầu thận',
  },
  {
    code: 'EGFR',
    name: 'Mức lọc cầu thận ước tính (eGFR)',
    category: 'biochemistry',
    defaultUnit: 'mL/phút/1.73m²',
    defaultMin: 90,
    defaultMax: 140,
    referenceText: '>= 90 mL/phút/1.73m²',
    description: 'Chỉ số vàng đánh giá giai đoạn chức năng thận',
  },
  {
    code: 'URIC_ACID',
    name: 'Định lượng Acid Uric [Máu]',
    category: 'biochemistry',
    defaultUnit: 'µmol/L',
    defaultMin: 202.3,
    defaultMax: 416.5,
    referenceText: '202.3 - 416.5 µmol/L (Nam), 142.8 - 339.2 (Nữ)',
    description: 'Tầm soát nguy cơ bệnh Gout và chuyển hóa purin',
  },

  // Mỡ máu (Lipid Panel)
  {
    code: 'CHOLESTEROL',
    name: 'Định lượng Cholesterol toàn phần',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 2.6,
    defaultMax: 5.2,
    referenceText: '< 5.2 mmol/L',
    description: 'Tổng lượng mỡ lưu hành trong máu',
  },
  {
    code: 'TRIGLYCERIDE',
    name: 'Định lượng Triglyceride',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 0.45,
    defaultMax: 1.7,
    referenceText: '< 1.7 mmol/L',
    description: 'Chất béo trung tính dự trữ năng lượng',
  },
  {
    code: 'HDL_C',
    name: 'HDL-Cholesterol (Mỡ tốt)',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 0.9,
    defaultMax: 2.5,
    referenceText: '> 0.9 mmol/L (khuyến nghị > 1.2)',
    description: 'Vận chuyển cholesterol dư thừa từ mạch máu về gan',
  },
  {
    code: 'LDL_C',
    name: 'LDL-Cholesterol (Mỡ xấu)',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 0,
    defaultMax: 3.34,
    referenceText: '< 3.34 mmol/L (nguy cơ thấp)',
    description: 'Nguy cơ gây xơ vữa động mạch và bệnh tim mạch',
  },

  // Gan & Mật
  {
    code: 'AST_GOT',
    name: 'Đo hoạt độ AST (GOT)',
    category: 'biochemistry',
    defaultUnit: 'U/L',
    defaultMin: 0,
    defaultMax: 50,
    referenceText: '< 50 U/L',
    description: 'Men gan phản ánh tổn thương tế bào gan và tim',
  },
  {
    code: 'ALT_GPT',
    name: 'Đo hoạt độ ALT (GPT)',
    category: 'biochemistry',
    defaultUnit: 'U/L',
    defaultMin: 0,
    defaultMax: 50,
    referenceText: '< 50 U/L',
    description: 'Men gan đặc hiệu cao đánh giá tổn thương tế bào gan',
  },
  {
    code: 'GGT',
    name: 'Đo hoạt độ GGT',
    category: 'biochemistry',
    defaultUnit: 'U/L',
    defaultMin: 8,
    defaultMax: 61,
    referenceText: '8 - 61 U/L',
    description: 'Men mật và gan, nhạy cảm với rượu bia và tắc mật',
  },
  {
    code: 'BILIRUBIN_TOTAL',
    name: 'Bilirubin toàn phần',
    category: 'biochemistry',
    defaultUnit: 'µmol/L',
    defaultMin: 3.4,
    defaultMax: 20.5,
    referenceText: '3.4 - 20.5 µmol/L',
    description: 'Sắc tố mật đánh giá tình trạng vàng da và tán huyết',
  },

  // Điện giải đồ & Khoáng chất
  {
    code: 'ION_NA',
    name: 'Ion Natri (Na+)',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 136,
    defaultMax: 145,
    referenceText: '136 - 145 mmol/L',
    description: 'Duy trì cân bằng áp suất thẩm thấu và thể tích nước',
  },
  {
    code: 'ION_K',
    name: 'Ion Kali (K+)',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 3.4,
    defaultMax: 4.5,
    referenceText: '3.4 - 4.5 mmol/L',
    description: 'Quyết định hoạt động dẫn truyền thần kinh cơ và nhịp tim',
  },
  {
    code: 'ION_CL',
    name: 'Ion Clorua (Cl-)',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 98,
    defaultMax: 107,
    referenceText: '98 - 107 mmol/L',
    description: 'Duy trì cân bằng kiềm toan và điện thế màng',
  },
  {
    code: 'CALCI_TOTAL',
    name: 'Định lượng Calci toàn phần',
    category: 'biochemistry',
    defaultUnit: 'mmol/L',
    defaultMin: 2.15,
    defaultMax: 2.5,
    referenceText: '2.15 - 2.50 mmol/L',
    description: 'Khoáng chất cấu tạo xương, co cơ và dẫn truyền thần kinh',
  },

  // Tuyến giáp / Miễn dịch
  {
    code: 'FT4',
    name: 'Định lượng FT4 (Free Thyroxine)',
    category: 'biochemistry',
    defaultUnit: 'pmol/L',
    defaultMin: 12.0,
    defaultMax: 22.0,
    referenceText: '12.0 - 22.0 pmol/L',
    description: 'Hormone tuyến giáp tự do điều hòa chuyển hóa năng lượng',
  },
  {
    code: 'TSH',
    name: 'Định lượng TSH (Thyroid Stimulating Hormone)',
    category: 'biochemistry',
    defaultUnit: 'µIU/mL',
    defaultMin: 0.27,
    defaultMax: 4.2,
    referenceText: '0.27 - 4.20 µIU/mL',
    description: 'Hormone kích thích tuyến giáp do tuyến yên tiết ra',
  },

  // ============================================================================
  // 4. TỔNG PHÂN TÍCH NƯỚC TIỂU 10 THÔNG SỐ (URINALYSIS)
  // ============================================================================
  {
    code: 'URI_PH',
    name: 'Độ pH nước tiểu',
    category: 'urinalysis',
    defaultUnit: '',
    defaultMin: 5.0,
    defaultMax: 8.0,
    referenceText: '5.0 - 8.0',
    description: 'Đánh giá tính kiềm toan của nước tiểu',
  },
  {
    code: 'URI_SG',
    name: 'Tỷ trọng nước tiểu (SG)',
    category: 'urinalysis',
    defaultUnit: '',
    defaultMin: 1.005,
    defaultMax: 1.03,
    referenceText: '1.005 - 1.030',
    description: 'Đánh giá khả năng cô đặc hoặc pha loãng của thận',
  },
  {
    code: 'URI_PRO',
    name: 'Protein nước tiểu',
    category: 'urinalysis',
    defaultUnit: 'g/L',
    referenceText: 'Âm tính (Negative)',
    description: 'Tầm soát bệnh lý tổn thương màng lọc cầu thận',
  },
  {
    code: 'URI_GLU',
    name: 'Glucose nước tiểu',
    category: 'urinalysis',
    defaultUnit: 'mmol/L',
    referenceText: 'Âm tính (Negative)',
    description: 'Tầm soát đái tháo đường khi đường huyết vượt ngưỡng thận',
  },
  {
    code: 'URI_KET',
    name: 'Ceton nước tiểu (KET)',
    category: 'urinalysis',
    defaultUnit: 'mmol/L',
    referenceText: 'Âm tính (Negative)',
    description: 'Phát hiện tình trạng nhiễm toan ceton hoặc nhịn ăn kéo dài',
  },
  {
    code: 'URI_ERY',
    name: 'Hồng cầu nước tiểu (ERY/RBC)',
    category: 'urinalysis',
    defaultUnit: 'Ery/µL',
    referenceText: 'Âm tính (Negative)',
    description: 'Tầm soát sỏi thận, viêm bàng quang hoặc viêm cầu thận',
  },
  {
    code: 'URI_LEU',
    name: 'Bạch cầu nước tiểu (LEU/WBC)',
    category: 'urinalysis',
    defaultUnit: 'Leu/µL',
    referenceText: 'Âm tính (Negative)',
    description: 'Tầm soát nhiễm khuẩn đường tiết niệu',
  },
  {
    code: 'URI_NIT',
    name: 'Nitrit nước tiểu (NIT)',
    category: 'urinalysis',
    defaultUnit: '',
    referenceText: 'Âm tính (Negative)',
    description: 'Dấu hiệu vi khuẩn Gr(-) phân giải nitrat trong đường tiểu',
  },
  {
    code: 'URI_BIL',
    name: 'Bilirubin nước tiểu',
    category: 'urinalysis',
    defaultUnit: 'µmol/L',
    referenceText: 'Âm tính (Negative)',
    description: 'Tầm soát tổn thương gan hoặc tắc mật',
  },
  {
    code: 'URI_UBG',
    name: 'Urobilinogen nước tiểu',
    category: 'urinalysis',
    defaultUnit: 'µmol/L',
    referenceText: 'Âm tính hoặc bình thường',
    description: 'Sản phẩm chuyển hóa của bilirubin tại ruột',
  },

  // ============================================================================
  // 5. THĂM DÒ CHỨC NĂNG & CHẨN ĐOÁN HÌNH ẢNH (IMAGING & FUNCTIONAL)
  // ============================================================================
  {
    code: 'ECG_RHYTHM',
    name: 'Điện tâm đồ (ECG) - Phân tích nhịp & dẫn truyền',
    category: 'imaging_functional',
    defaultUnit: 'kết luận',
    referenceText: 'Nhịp xoang đều, tần số 60 - 100 ck/p, trục trung gian',
    description: 'Ghi lại hoạt động điện học của tim bằng 12 chuyển đạo',
  },
  {
    code: 'US_ABDOMEN',
    name: 'Siêu âm Ổ bụng tổng quát',
    category: 'imaging_functional',
    defaultUnit: 'kết luận',
    referenceText: 'Hình ảnh siêu âm ổ bụng không thấy bất thường',
    description: 'Khảo sát cấu trúc gan, mật, tụy, lách, thận, bàng quang',
  },
  {
    code: 'US_THYROID',
    name: 'Siêu âm Tuyến giáp & Hạch cổ',
    category: 'imaging_functional',
    defaultUnit: 'kết luận',
    referenceText: 'TIRADS 1 - 2 (Lành tính / Bình thường)',
    description: 'Tầm soát nhân xơ, nang giáp và hạch vùng cổ',
  },
  {
    code: 'ENT_ENDOSCOPY',
    name: 'Nội soi Tai - Mũi - Họng',
    category: 'imaging_functional',
    defaultUnit: 'kết luận',
    referenceText: 'Niêm mạc hồng hào, sạch, không viêm loét',
    description: 'Khảo sát hốc mũi, vòm họng, dây thanh âm và màng nhĩ',
  },
  {
    code: 'XRAY_CHEST',
    name: 'Chụp X-quang Tim phổi thẳng',
    category: 'imaging_functional',
    defaultUnit: 'kết luận',
    referenceText: 'Không thấy tổn thương nhu mô phổi và bóng tim',
    description: 'Đánh giá lồng ngực, nhu mô phổi, rốn phổi và bóng tim',
  },
];

/**
 * Tra cứu định nghĩa chỉ số từ mã hoặc tên tiếng Việt
 */
export function findMetricDefinition(query: string): MetricDefinition | undefined {
  if (!query) return undefined;
  const q = query.trim().toLowerCase();
  return MEDICAL_METRIC_DEFINITIONS.find((def) => {
    return (
      def.code.toLowerCase() === q ||
      def.name.toLowerCase() === q ||
      def.name.toLowerCase().includes(q) ||
      q.includes(def.code.toLowerCase())
    );
  });
}

/**
 * Đánh giá trạng thái chỉ số so với khoảng tham chiếu tiêu chuẩn
 */
export function evaluateMetricStatus(
  val: number | string,
  min?: number,
  max?: number,
  referenceText?: string
): 'normal' | 'low' | 'high' | 'abnormal' {
  if (typeof val === 'string') {
    const vLower = val.toLowerCase().trim();
    if (vLower.includes('âm tính') || vLower === 'negative' || vLower === 'bình thường') {
      return 'normal';
    }
    if (vLower.includes('dương tính') || vLower === 'positive' || vLower.includes('bất thường')) {
      return 'abnormal';
    }
    const parsedNum = parseFloat(vLower.replace(',', '.'));
    if (!isNaN(parsedNum)) {
      val = parsedNum;
    } else {
      return 'normal';
    }
  }

  if (typeof val === 'number') {
    if (min !== undefined && val < min) return 'low';
    if (max !== undefined && val > max) return 'high';
    return 'normal';
  }

  return 'normal';
}
