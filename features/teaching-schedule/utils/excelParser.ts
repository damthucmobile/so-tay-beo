import * as XLSX from 'xlsx';
import { SchoolTimetable, TimetableEntry, DayOfWeek, Session } from '../types';

/**
 * Trích xuất thời khóa biểu từ file Excel ma trận toàn trường
 * @param buffer ArrayBuffer hoặc Uint8Array của file .xlsx
 * @param fileName Tên file gốc tải lên
 */
export function parseSchoolTimetable(buffer: ArrayBuffer | Uint8Array, fileName: string = ''): SchoolTimetable {
  const wb = XLSX.read(buffer, { type: 'array' });

  // Ưu tiên sheet có tên 'TOAN TRUONG', nếu không lấy sheet đầu tiên
  const targetSheetName = wb.SheetNames.find(
    (name) => name.toUpperCase().includes('TOAN TRUONG') || name.toUpperCase().includes('TKB')
  ) || wb.SheetNames[0];

  if (!targetSheetName) {
    throw new Error('File Excel không có bất kỳ sheet nào hợp lệ.');
  }

  const sheet = wb.Sheets[targetSheetName];
  const rows: (string | number | undefined | null)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  if (!rows || rows.length < 5) {
    throw new Error('Dữ liệu sheet thời khóa biểu quá ngắn hoặc không đúng định dạng.');
  }

  // 1. Phân tích tiêu đề & metadata từ các dòng đầu
  const row0 = rows[0] || [];
  const row1 = rows[1] || [];
  const subOrg = (row0[0] && String(row0[0]).trim()) || 'PHÒNG GD&ĐT';
  const schoolName = (row1[0] && String(row1[0]).trim()) || 'TRƯỜNG THCS';

  let title = 'THỜI KHÓA BIỂU TOÀN TRƯỜNG';
  let description = '';

  for (let c = 0; c < Math.min(row0.length, 30); c++) {
    const val = row0[c];
    if (val && typeof val === 'string' && val.includes('THỜI KHÓA BIỂU')) {
      title = val.trim();
      break;
    }
  }

  for (let c = 0; c < Math.min(row1.length, 30); c++) {
    const val = row1[c];
    if (val && typeof val === 'string' && (val.includes('Lần') || val.includes('áp dụng') || val.includes('ngày'))) {
      description = val.trim();
      break;
    }
  }

  // 2. Tìm hàng tiêu đề lớp học (Thường ở dòng 3 hoặc 4)
  let classHeaderRowIndex = -1;
  const classes: { className: string; colSubject: number; colTeacher: number }[] = [];

  for (let r = 2; r <= 5; r++) {
    const rData = rows[r] || [];
    const foundClasses: { className: string; colSubject: number; colTeacher: number }[] = [];

    for (let c = 0; c < rData.length; c++) {
      const val = rData[c];
      if (val && typeof val === 'string') {
        const trimmed = val.trim();
        // Regex nhận diện tên lớp phổ biến: 6A1, 7A2, 10A1, 12D3...
        if (/^[0-9]{1,2}[A-Za-z]+[0-9]*$/.test(trimmed)) {
          foundClasses.push({
            className: trimmed,
            colSubject: c,
            colTeacher: c + 1,
          });
        }
      }
    }

    if (foundClasses.length >= 3) {
      classHeaderRowIndex = r;
      classes.push(...foundClasses);
      break;
    }
  }

  if (classes.length === 0) {
    throw new Error(
      'Không tìm thấy danh sách lớp học trong file (VD: 6A1, 7A1...). Vui lòng kiểm tra lại cấu trúc file Excel.'
    );
  }

  // 3. Quét các dòng tiết học (Bắt đầu từ hàng kế tiếp header)
  let currentDay: DayOfWeek = 'Hai';
  let currentSession: Session = 'Sáng';
  const entries: TimetableEntry[] = [];

  const startRow = classHeaderRowIndex + 2; // Bỏ qua hàng phụ đề "Môn / GV dạy"

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Nhận diện cột Thứ (cột 0)
    const dayVal = row[0];
    if (dayVal && typeof dayVal === 'string') {
      const dayTrim = dayVal.trim().toLowerCase();
      if (dayTrim.includes('hai')) currentDay = 'Hai';
      else if (dayTrim.includes('ba')) currentDay = 'Ba';
      else if (dayTrim.includes('tư') || dayTrim.includes('tu')) currentDay = 'Tư';
      else if (dayTrim.includes('năm') || dayTrim.includes('nam')) currentDay = 'Năm';
      else if (dayTrim.includes('sáu') || dayTrim.includes('sau')) currentDay = 'Sáu';
      else if (dayTrim.includes('bảy') || dayTrim.includes('bay')) currentDay = 'Bảy';
    }

    // Nhận diện cột Buổi (cột 1)
    const sessionVal = row[1];
    if (sessionVal && typeof sessionVal === 'string') {
      const sTrim = sessionVal.trim().toLowerCase();
      if (sTrim.includes('sáng') || sTrim.includes('sang')) currentSession = 'Sáng';
      else if (sTrim.includes('chiều') || sTrim.includes('chieu')) currentSession = 'Chiều';
    }

    // Cột Tiết học (cột 2)
    const periodVal = row[2];
    if (periodVal === undefined || periodVal === null || periodVal === '') {
      continue;
    }

    const periodNum = Number(periodVal);
    // Chỉ lấy tiết hợp lệ từ 1 đến 6
    if (isNaN(periodNum) || periodNum < 1 || periodNum > 8) {
      continue;
    }

    // Đọc từng lớp học
    for (const cls of classes) {
      const rawSubject = row[cls.colSubject];
      const rawTeacher = row[cls.colTeacher];
      const subject = rawSubject ? String(rawSubject).trim() : '';
      const teacher = rawTeacher ? String(rawTeacher).trim() : '';

      // Chỉ thêm nếu có môn hoặc có giáo viên dạy
      if (subject || teacher) {
        entries.push({
          id: `${cls.className}-${currentDay}-${currentSession}-${periodNum}`,
          dayOfWeek: currentDay,
          session: currentSession,
          period: periodNum,
          className: cls.className,
          subject,
          teacher,
        });
      }
    }
  }

  if (entries.length === 0) {
    throw new Error('Không bóc tách được tiết học nào từ file Excel. Vui lòng kiểm tra lại cấu trúc.');
  }

  // Tổng hợp danh sách giáo viên, môn học, lớp
  const uniqueTeachers = Array.from(new Set(entries.map((e) => e.teacher).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, 'vi')
  );
  const uniqueSubjects = Array.from(new Set(entries.map((e) => e.subject).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, 'vi')
  );
  const classNames = classes.map((c) => c.className);

  return {
    id: `tkb-${Date.now()}`,
    subOrg,
    schoolName,
    title,
    description,
    fileName,
    classes: classNames,
    teachers: uniqueTeachers,
    subjects: uniqueSubjects,
    entries,
    totalEntries: entries.length,
    importedAt: new Date().toISOString(),
  };
}
