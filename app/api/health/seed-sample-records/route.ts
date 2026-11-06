// app/api/health/seed-sample-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { HealthMetricValue, HealthRecordDocument } from '@/features/health/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const parsedPath = '/Users/vtit/.gemini/antigravity-ide/brain/161507ca-13c0-4d22-95da-b7fda1d8d590/scratch/all_parsed_documents.json';
    if (!fs.existsSync(parsedPath)) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy file dữ liệu bóc tách' }, { status: 404 });
    }

    const allData = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));
    const recordsToSave: Array<Omit<HealthRecordDocument, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = [];

    for (let i = 0; i < allData.length; i++) {
      const { fileName, doc: itemDoc } = allData[i];
      const recordDate = itemDoc.recordDate && itemDoc.recordDate !== '1970-01-01' ? itemDoc.recordDate : '2026-10-20';

      const metricsList: HealthMetricValue[] = [];

      // 1. Chỉ số định lượng (xét nghiệm máu, nước tiểu, điện tim...)
      if (itemDoc.metrics && Array.isArray(itemDoc.metrics)) {
        itemDoc.metrics.forEach((m: any, mIdx: number) => {
          metricsList.push({
            id: `m_seed_${i + 1}_${mIdx + 1}`,
            metricCode: m.metricCode || undefined,
            metricName: m.metricName,
            category: m.category || 'biochemistry',
            value: String(m.value),
            numericValue: m.numericValue,
            unit: m.unit || '',
            referenceRange: m.referenceRange,
            minNormal: m.minNormal,
            maxNormal: m.maxNormal,
            status: m.status || 'normal',
            measuredAt: m.measuredAt || recordDate,
            hospitalName: itemDoc.hospitalName || 'Bệnh viện Đại học Y Hà Nội',
            doctorName: itemDoc.doctorName,
            notes: m.notes,
          });
        });
      }

      // 2. Chẩn đoán hình ảnh / thăm dò chức năng (Siêu âm, X-quang, TMH, ECG)
      if (itemDoc.imagingFindings && Array.isArray(itemDoc.imagingFindings)) {
        itemDoc.imagingFindings.forEach((f: any, fIdx: number) => {
          let code = 'IMAGING_FINDING';
          let status: any = 'normal';
          const name = f.serviceName || 'Chẩn đoán hình ảnh';

          if (name.includes('ổ bụng')) {
            code = 'US_ABDOMEN';
            status = 'normal';
          } else if (name.includes('tuyến giáp')) {
            code = 'US_THYROID';
            status = 'warning'; // Nhân thùy phải TIRADS 3, nang 2 thùy TIRADS 2
          } else if (name.includes('Tai') || name.includes('Mũi') || name.includes('Họng')) {
            code = 'ENT_ENDOSCOPY';
            status = 'warning'; // Viêm mũi dị ứng, Viêm amydan mạn
          } else if (name.includes('Xquang') || name.includes('XQ') || name.includes('X-quang')) {
            code = 'XRAY_CHEST';
            status = 'normal';
          } else if (name.includes('Điện tim') || name.includes('Điện tâm đồ')) {
            code = 'ECG_RHYTHM';
            status = 'normal';
          }

          metricsList.push({
            id: `m_img_seed_${i + 1}_${fIdx + 1}`,
            metricCode: code,
            metricName: name,
            category: 'imaging_functional',
            value: f.conclusion || f.description || 'Bình thường',
            referenceRange: 'Bình thường, không tổn thương',
            status,
            measuredAt: recordDate,
            hospitalName: itemDoc.hospitalName || 'Bệnh viện Đại học Y Hà Nội',
            doctorName: f.doctor || itemDoc.doctorName,
            notes: f.description || f.conclusion,
          });
        });
      }

      // 3. Bổ sung chỉ số Calci toàn phần từ ảnh kết quả mới
      metricsList.push({
        id: `m_seed_${i + 1}_calci`,
        metricCode: 'CALCI_TOTAL',
        metricName: 'Định lượng Calci toàn phần [Máu]',
        category: 'biochemistry',
        value: '2.40',
        numericValue: 2.4,
        unit: 'mmol/L',
        referenceRange: '2.15 - 2.50',
        minNormal: 2.15,
        maxNormal: 2.5,
        status: 'normal',
        measuredAt: recordDate,
        hospitalName: itemDoc.hospitalName || 'Bệnh viện Đại học Y Hà Nội',
        doctorName: itemDoc.doctorName || 'BS. Vũ Thùy Linh',
        checkupSessionId: 'checkup_2026_10_hmuh',
      });

      recordsToSave.push({
        title: itemDoc.title,
        recordDate,
        hospitalName: itemDoc.hospitalName || 'Bệnh viện Đại học Y Hà Nội',
        doctorName: itemDoc.doctorName,
        patientName: itemDoc.patientName || 'ĐÀM VĂN THỨC',
        patientYearOfBirth: itemDoc.patientYearOfBirth || 2000,
        department: itemDoc.department,
        documentType: itemDoc.documentType || 'general_health_check',
        summaryDiagnosis: itemDoc.summaryDiagnosis,
        aiAnalysisNotes: itemDoc.aiAnalysisNotes,
        fileName,
        checkupSessionId: 'checkup_2026_10_hmuh',
        metrics: metricsList.map((m) => ({ ...m, checkupSessionId: 'checkup_2026_10_hmuh' })),
        imagingFindings: itemDoc.imagingFindings || [],
      });
    }

    // Các chỉ số sinh tồn (Vitals)
    const vitalsList: Array<Omit<HealthMetricValue, 'id'>> = [
      {
        metricCode: 'WEIGHT',
        metricName: 'Cân nặng',
        category: 'vitals',
        value: '67.5',
        numericValue: 67.5,
        unit: 'kg',
        referenceRange: '50 - 75 kg (BMI 18.5 - 22.9)',
        status: 'normal',
        measuredAt: '2026-11-06',
        notes: 'Đo sáng lúc bụng đói',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'HEIGHT',
        metricName: 'Chiều cao',
        category: 'vitals',
        value: '172',
        numericValue: 172,
        unit: 'cm',
        referenceRange: '160 - 180 cm',
        status: 'normal',
        measuredAt: '2026-11-06',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'BMI',
        metricName: 'Chỉ số khối cơ thể (BMI)',
        category: 'vitals',
        value: '22.8',
        numericValue: 22.8,
        unit: 'kg/m²',
        referenceRange: '18.5 - 22.9 kg/m²',
        status: 'normal',
        measuredAt: '2026-11-06',
        notes: 'Thể trạng cân đối theo chuẩn người Châu Á',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'BP_SYS',
        metricName: 'Huyết áp tâm thu (Tối đa)',
        category: 'vitals',
        value: '118',
        numericValue: 118,
        unit: 'mmHg',
        referenceRange: '90 - 120 mmHg',
        status: 'normal',
        measuredAt: '2026-11-06',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'BP_DIA',
        metricName: 'Huyết áp tâm trương (Tối thiểu)',
        category: 'vitals',
        value: '78',
        numericValue: 78,
        unit: 'mmHg',
        referenceRange: '60 - 80 mmHg',
        status: 'normal',
        measuredAt: '2026-11-06',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'HEART_RATE',
        metricName: 'Nhịp tim lúc nghỉ',
        category: 'vitals',
        value: '68',
        numericValue: 68,
        unit: 'bpm',
        referenceRange: '60 - 100 bpm',
        status: 'normal',
        measuredAt: '2026-11-06',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
      {
        metricCode: 'SPO2',
        metricName: 'Độ bão hòa Oxy (SpO2)',
        category: 'vitals',
        value: '98',
        numericValue: 98,
        unit: '%',
        referenceRange: '95 - 100 %',
        status: 'normal',
        measuredAt: '2026-11-06',
        checkupSessionId: 'checkup_2026_10_hmuh',
      },
    ];

    // Đợt khám sức khỏe tổng quát T10/2026 tại BV Đại học Y Hà Nội (tổng hợp 9 ảnh chuyên khoa lâm sàng)
    const checkupSession = {
      title: 'Khám sức khỏe tổng quát định kỳ T10/2026',
      checkupDate: '2026-10-20',
      hospitalName: 'Bệnh viện Đại học Y Hà Nội',
      doctorName: 'BS. Vũ Thùy Linh',
      healthClassification: 'Loại 2 (Đủ sức khỏe học tập & công tác)',
      familyHistory: 'Bố tiểu đường',
      clinicalConclusion:
        'Nhân thùy phải tuyến giáp (TIRADS 3), Nang 2 thùy tuyến giáp (TIRADS 2). Sâu răng 26, 36 - Cao răng viêm lợi. Tật khúc xạ mắt phải. Viêm mũi dị ứng - Viêm amydan mạn.',
      specialtiesSummary: {
        internalMedicine:
          'Tuần hoàn: Tim đều, T1T2 rõ. Hô hấp: Rì rào phế nang rõ. Tiêu hóa, Thần kinh, Cơ xương khớp, Thận tiết niệu, Nội tiết: Bình thường (BS. Vũ Thùy Linh)',
        surgery:
          'Nhân thùy phải tuyến giáp (TIRADS 3), Nang 2 thùy tuyến giáp (TIRADS 2). Phân loại: 2 (BS. Nguyễn Văn Việt)',
        ophthalmology:
          'Mắt phải không kính 5/10, có kính 10/10 (Tật khúc xạ). Mắt trái không kính 10/10. Phân loại: II (BS. Đỗ Thị Thái Hà)',
        dental:
          'Sâu răng 26, 36 - Cao răng viêm lợi. Phân loại: 2 (BS. Vũ Thị Dịu)',
        ent:
          'Viêm mũi dị ứng - Viêm amydan mạn. Phân loại: 2 (BS. Đỗ Thu Trang)',
        dermatology: 'Bình thường. Phân loại: 1 (BS. Trần Thị Thanh Thúy)',
      },
      notes:
        'Tổng hợp khám chuyên khoa và kết quả xét nghiệm sinh hóa, huyết học, nước tiểu, CĐHA đợt tháng 10/2026.',
    };

    return NextResponse.json({
      success: true,
      data: {
        checkupSession,
        records: recordsToSave,
        vitals: vitalsList,
      },
    });
  } catch (error: any) {
    console.error('[seed-sample-records] Lỗi:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
