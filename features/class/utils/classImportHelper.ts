import * as XLSX from 'xlsx';

export interface ParsedClassRow {
  rowNum: number;
  className: string;
  centerName: string;
  baseFeePerSession: number;
  ratePerStudent: number;
  isValid: boolean;
  error?: string;
}

export interface ParsedStudentRow {
  rowNum: number;
  className: string;
  fullName: string;
  phoneNumber: string;
  joinedDate: string;
  notes: string;
  isValid: boolean;
  error?: string;
}

/**
 * 1. Tải File Excel Biểu Mẫu Chuẩn (.xlsx) gồm 2 Tab Sheet:
 * - Tab 1: Mau_Import_Lop_Hoc (Mẫu Danh Sách Lớp Học)
 * - Tab 2: Mau_Import_Hoc_Sinh (Mẫu Danh Sách Học Sinh)
 */
export function downloadClassStudentTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Tab 1: Mẫu Lớp Học
  const classTemplateData = [
    {
      'Tên Lớp Học (*)': 'Toán 10 - Nâng Cao A1',
      'Trung Tâm Online (*)': 'Trung tâm Gia sư Khang Thịnh',
      'Đơn Giá Cố Định / Buổi (VNĐ)': 200000,
      'Đơn Giá / 1 Học Sinh (VNĐ)': 30000,
    },
    {
      'Tên Lớp Học (*)': 'Toán 12 - Ôn Thi THPTQG',
      'Trung Tâm Online (*)': 'Học Viện Toán Online MathPro',
      'Đơn Giá Cố Định / Buổi (VNĐ)': 250000,
      'Đơn Giá / 1 Học Sinh (VNĐ)': 35000,
    },
  ];
  const wsClass = XLSX.utils.json_to_sheet(classTemplateData);
  wsClass['!cols'] = [{ wch: 30 }, { wch: 32 }, { wch: 28 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsClass, 'Mau_Import_Lop_Hoc');

  // Tab 2: Mẫu Học Sinh
  const todayStr = new Date().toISOString().slice(0, 10);
  const studentTemplateData = [
    {
      'Tên Lớp Học (*)': 'Toán 10 - Nâng Cao A1',
      'Họ Và Tên Học Sinh (*)': 'Nguyễn Văn Minh',
      'Số Điện Thoại': '0912345671',
      'Ngày Tham Gia (YYYY-MM-DD)': todayStr,
      'Ghi Chú': 'Lớp trưởng, học sinh tích cực',
    },
    {
      'Tên Lớp Học (*)': 'Toán 10 - Nâng Cao A1',
      'Họ Và Tên Học Sinh (*)': 'Trần Thị Mỹ Linh',
      'Số Điện Thoại': '0912345672',
      'Ngày Tham Gia (YYYY-MM-DD)': todayStr,
      'Ghi Chú': '',
    },
    {
      'Tên Lớp Học (*)': 'Toán 12 - Ôn Thi THPTQG',
      'Họ Và Tên Học Sinh (*)': 'Ngô Việt Hoàng',
      'Số Điện Thoại': '0912345681',
      'Ngày Tham Gia (YYYY-MM-DD)': todayStr,
      'Ghi Chú': 'Mục tiêu thi chuyên Toán',
    },
  ];
  const wsStudent = XLSX.utils.json_to_sheet(studentTemplateData);
  wsStudent['!cols'] = [{ wch: 30 }, { wch: 28 }, { wch: 18 }, { wch: 28 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsStudent, 'Mau_Import_Hoc_Sinh');

  // Xuất file tải về trình duyệt
  XLSX.writeFile(wb, 'mau-import-lop-and-hoc-sinh.xlsx');
}

/**
 * 2. Phân tích File Excel Lớp Học
 */
export async function parseClassExcelFile(file: File): Promise<ParsedClassRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetName =
    wb.SheetNames.find(
      (s) => s.toLowerCase().includes('lop') || s.toLowerCase().includes('class')
    ) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const result: ParsedClassRow[] = [];

  rawRows.forEach((row, idx) => {
    const className = String(
      row['Tên Lớp Học (*)'] ||
        row['Tên Lớp Học'] ||
        row['ClassName'] ||
        row['Tên lớp'] ||
        ''
    ).trim();
    const centerName = String(
      row['Trung Tâm Online (*)'] ||
        row['Trung Tâm Online'] ||
        row['CenterName'] ||
        row['Trung tâm'] ||
        ''
    ).trim();
    const baseFee = Number(
      row['Đơn Giá Cố Định / Buổi (VNĐ)'] ||
        row['Đơn Giá Cố Định'] ||
        row['BaseFee'] ||
        0
    );
    const rateStudent = Number(
      row['Đơn Giá / 1 Học Sinh (VNĐ)'] ||
        row['Đơn Giá / 1 Học Sinh'] ||
        row['RatePerStudent'] ||
        0
    );

    const isValid = Boolean(className);
    const error = !className ? 'Thiếu Tên Lớp' : undefined;

    result.push({
      rowNum: idx + 2,
      className,
      centerName,
      baseFeePerSession: isNaN(baseFee) ? 0 : baseFee,
      ratePerStudent: isNaN(rateStudent) ? 0 : rateStudent,
      isValid,
      error,
    });
  });

  return result;
}

/**
 * 3. Phân tích File Excel Học Sinh
 */
export async function parseStudentExcelFile(file: File): Promise<ParsedStudentRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });

  // Tìm sheet học sinh hoặc sheet thứ 2
  const sheetName =
    wb.SheetNames.find(
      (s) => s.toLowerCase().includes('hoc_sinh') || s.toLowerCase().includes('student')
    ) ||
    (wb.SheetNames.length > 1 ? wb.SheetNames[1] : wb.SheetNames[0]);

  const ws = wb.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const result: ParsedStudentRow[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  rawRows.forEach((row, idx) => {
    const className = String(
      row['Tên Lớp Học (*)'] ||
        row['Tên Lớp Học'] ||
        row['ClassName'] ||
        row['Lớp'] ||
        ''
    ).trim();
    const fullName = String(
      row['Họ Và Tên Học Sinh (*)'] ||
        row['Họ Và Tên Học Sinh'] ||
        row['FullName'] ||
        row['Họ tên'] ||
        row['Tên học sinh'] ||
        ''
    ).trim();
    const phoneNumber = String(
      row['Số Điện Thoại'] || row['PhoneNumber'] || row['SĐT'] || row['Điện thoại'] || ''
    ).trim();
    let joinedDate = String(
      row['Ngày Tham Gia (YYYY-MM-DD)'] ||
        row['Ngày Tham Gia'] ||
        row['Ngày vào'] ||
        row['JoinedDate'] ||
        todayStr
    ).trim();

    if (!joinedDate || !joinedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      joinedDate = todayStr;
    }

    const notes = String(row['Ghi Chú'] || row['Notes'] || '').trim();

    const isValid = Boolean(fullName);
    const error = !fullName ? 'Thiếu Họ tên Học sinh' : undefined;

    result.push({
      rowNum: idx + 2,
      className,
      fullName,
      phoneNumber,
      joinedDate,
      notes,
      isValid,
      error,
    });
  });

  return result;
}
