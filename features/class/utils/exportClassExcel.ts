import * as XLSX from 'xlsx';
import {
  ClassEntity,
  ClassStudentEntity,
  ClassSessionEntity,
  TimeSliceBreakdown,
} from '../types';

/**
 * Xuất file Excel 3 Sheet chuyên nghiệp cho Bảng Đối soát Thù lao
 */
export function exportClassSalaryExcel(
  classItem: ClassEntity,
  students: ClassStudentEntity[],
  sessions: ClassSessionEntity[],
  slices: TimeSliceBreakdown[],
  targetMonthStr: string
) {
  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // Sheet 1: BẢNG GIẢI TRÌNH PHÂN ĐOẠN ĐỐI SOÁT
  // --------------------------------------------------------------------------
  const summaryRows = [
    ['BÁO CÁO ĐỐI SOÁT THÙ LAO GIẢNG DẠY - SỔ TAY BÉO'],
    [`Lớp học: ${classItem.className}`],
    [`Trung tâm / Nơi dạy: ${classItem.centerName || 'N/A'}`],
    [`Kỳ đối soát: Tháng ${targetMonthStr}`],
    [`Thù lao cố định: ${classItem.baseFeePerSession.toLocaleString('vi-VN')} đ/buổi`],
    [`Đơn giá theo đầu học sinh: ${classItem.ratePerStudent.toLocaleString('vi-VN')} đ/HS/buổi`],
    [''],
    ['STT', 'Từ Ngày', 'Đến Ngày', 'Sỹ Số (Active)', 'Số Buổi Dạy', 'Đơn Giá Áp Dụng', 'Thành Tiền (VNĐ)'],
  ];

  let totalMonthSalary = 0;
  let totalSessions = 0;

  slices.forEach((slice, idx) => {
    totalMonthSalary += slice.totalSalary;
    totalSessions += slice.sessionCount;
    summaryRows.push([
      (idx + 1).toString(),
      slice.startDate,
      slice.endDate,
      `${slice.headcount} học sinh`,
      `${slice.sessionCount} buổi`,
      slice.rateDescription,
      slice.totalSalary.toLocaleString('vi-VN'),
    ]);
  });

  summaryRows.push([
    '',
    '',
    '',
    'TỔNG CỘNG',
    `${totalSessions} buổi`,
    '',
    `${totalMonthSalary.toLocaleString('vi-VN')} đ`,
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Bang_Giai_Trinh');

  // --------------------------------------------------------------------------
  // Sheet 2: NHẬT KÝ BUỔI DẠY VÀ SỸ SỐ HIỆU LỰC
  // --------------------------------------------------------------------------
  const sessionRows = [
    ['STT', 'Ngày Buổi Dạy', 'Giờ Học', 'Trạng Thái', 'Sỹ Số Hiệu Lực', 'Thù Lao (VNĐ)', 'Bài Học / Chủ Đề', 'Ghi Chú'],
  ];

  const monthlySessions = sessions
    .filter((s) => s.sessionDate.startsWith(targetMonthStr))
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

  monthlySessions.forEach((s, idx) => {
    const statusText =
      s.status === 'COMPLETED'
        ? 'Đã hoàn thành'
        : s.status === 'SCHEDULED'
        ? 'Lên lịch'
        : s.status === 'HOLIDAY'
        ? 'Nghỉ lễ'
        : 'Hủy buổi';

    sessionRows.push([
      (idx + 1).toString(),
      s.sessionDate,
      `${s.startTime} - ${s.endTime}`,
      statusText,
      `${s.calculatedHeadcount} HS`,
      (s.calculatedSalary || 0).toLocaleString('vi-VN'),
      s.lessonTopic || '',
      s.notes || '',
    ]);
  });

  const wsSessions = XLSX.utils.aoa_to_sheet(sessionRows);
  XLSX.utils.book_append_sheet(wb, wsSessions, 'Nhat_Ky_Buoi_Day');

  // --------------------------------------------------------------------------
  // Sheet 3: DANH SÁCH HỌC SINH
  // --------------------------------------------------------------------------
  const studentRows = [
    ['STT', 'Họ và Tên', 'Số Điện Thoại', 'Trạng Thái', 'Ngày Vào Học', 'Ngày Nghỉ (nếu có)', 'Ghi Chú'],
  ];

  students.forEach((st, idx) => {
    studentRows.push([
      (idx + 1).toString(),
      st.fullName,
      st.phoneNumber || '',
      st.status === 'ACTIVE' ? 'Đang học' : 'Đã thôi học',
      st.joinedDate,
      st.droppedDate || '-',
      st.notes || '',
    ]);
  });

  const wsStudents = XLSX.utils.aoa_to_sheet(studentRows);
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Danh_Sach_Hoc_Sinh');

  // Tự động tải xuống file Excel
  const safeName = classItem.className.replace(/[^a-zA-Z0-9à-ỹÀ-Ỹ_-]/g, '_');
  const fileName = `Doi_Soat_Luong_${safeName}_${targetMonthStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Sinh văn bản báo cáo tổng quan có emoji định dạng đẹp mắt để gửi Zalo / Telegram
 */
export function generateSalaryReportText(
  classItem: ClassEntity,
  students: ClassStudentEntity[],
  sessions: ClassSessionEntity[],
  slices: TimeSliceBreakdown[],
  targetMonthStr: string
): string {
  const completedSessions = sessions.filter(
    (s) => s.status === 'COMPLETED' && s.sessionDate.startsWith(targetMonthStr)
  );
  const totalSalary = slices.reduce((sum, s) => sum + s.totalSalary, 0);

  let text = `📊 BÁO CÁO ĐỐI SOÁT THÙ LAO GIẢNG DẠY\n`;
  text += `🏫 Lớp học: ${classItem.className}\n`;
  if (classItem.centerName) {
    text += `🏢 Nơi dạy / Trung tâm: ${classItem.centerName}\n`;
  }
  text += `📅 Kỳ đối soát: Tháng ${targetMonthStr}\n`;
  text += `💰 Đơn giá: ${classItem.baseFeePerSession.toLocaleString('vi-VN')}đ cố định + ${classItem.ratePerStudent.toLocaleString('vi-VN')}đ/HS\n`;
  text += `------------------------------------\n`;
  text += `📌 CHI TIẾT PHÂN ĐOẠN SỸ SỐ:\n`;

  slices.forEach((slice, idx) => {
    text += `${idx + 1}. [${slice.startDate} ➔ ${slice.endDate}]: ${slice.headcount} HS | ${slice.sessionCount} buổi ➔ ${slice.totalSalary.toLocaleString('vi-VN')}đ\n`;
  });

  text += `------------------------------------\n`;
  text += `✅ Tổng số buổi đã dạy: ${completedSessions.length} buổi\n`;
  text += `💵 TỔNG THÙ LAO: ${totalSalary.toLocaleString('vi-VN')} VNĐ\n`;
  text += `\n(Xuất từ Sổ Tay Béo 2.0 • Quản lý lớp học thông minh)`;

  return text;
}
