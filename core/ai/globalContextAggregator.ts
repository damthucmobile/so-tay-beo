/**
 * Global App Context Aggregator cho Gemini AI
 * Tổng hợp dữ liệu từ toàn bộ ứng dụng Sổ Tay Béo (TKB, Lớp học, Lịch tự do, Thu nhập, Du lịch)
 * để cung cấp bối cảnh toàn diện 360 độ cho AI.
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export type AIContextScope = 'global' | 'teaching' | 'classes' | 'schedule' | 'general';

export interface ContextScopeOption {
  id: AIContextScope;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badge?: string;
}

export const CONTEXT_SCOPE_OPTIONS: ContextScopeOption[] = [
  {
    id: 'global',
    label: 'Toàn bộ trang web (Đa phân hệ)',
    shortLabel: 'Toàn bộ trang web',
    description: 'Tổng hợp TKB trường, Lớp học, Lịch tự do và Báo cáo thu nhập',
    iconName: 'Globe',
    badge: 'Khuyên Dùng',
  },
  {
    id: 'teaching',
    label: 'Lịch dạy học (Thời khóa biểu)',
    shortLabel: 'Lịch dạy học',
    description: 'Chuyên sâu thời khóa biểu trường, tiết dạy và buổi trống',
    iconName: 'CalendarDays',
  },
  {
    id: 'classes',
    label: 'Quản lý lớp học & Học sinh',
    shortLabel: 'Lớp học & Học phí',
    description: 'Danh sách lớp giảng dạy, sĩ số, danh sách học sinh và học phí',
    iconName: 'GraduationCap',
  },
  {
    id: 'schedule',
    label: 'Lịch tự do & Khách hàng',
    shortLabel: 'Lịch tự do',
    description: 'Lịch hẹn gia sư, ca kèm riêng và danh sách học viên cá nhân',
    iconName: 'Clock',
  },
  {
    id: 'general',
    label: 'Trò chuyện tự do (Không dùng dữ liệu web)',
    shortLabel: 'Chat tự do',
    description: 'Trợ lý AI đa năng thuần túy: viết văn, dịch thuật, lập trình, hỏi đáp chung',
    iconName: 'Sparkles',
  },
];

export interface GlobalAppContextData {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  timetable?: any;
  selectedTeacher?: string;
  classes?: any[];
  students?: any[];
  sessions?: any[];
  appointments?: any[];
  customers?: any[];
  transactions?: any[];
  trips?: any[];
}

export function buildSystemContextPrompt(
  scope: AIContextScope,
  data: GlobalAppContextData
): string {
  if (scope === 'general') {
    return `Bạn là trợ lý AI thông minh toàn năng (Gemini AI). Hãy giải đáp các câu hỏi, viết nội dung, dịch thuật hoặc giải quyết vấn đề của người dùng một cách chính xác, văn phong chuẩn mực và thân thiện bằng tiếng Việt. Bạn không bị giới hạn trong bất kỳ bối cảnh ứng dụng nào.`;
  }

  const now = new Date();
  const dateStr = format(now, 'EEEE, dd/MM/yyyy HH:mm', { locale: vi });
  const teacherName = data.selectedTeacher || data.user?.name || 'Thầy/Cô';

  let sections: string[] = [];

  // 1. Phân hệ Lịch dạy học (TKB)
  if ((scope === 'global' || scope === 'teaching') && data.timetable) {
    const tb = data.timetable;
    let timetableInfo = `### 1. THỜI KHÓA BIỂU NHÀ TRƯỜNG:
- Tên trường: ${tb.schoolName || 'Chưa cập nhật'}
- Áp dụng từ ngày: ${tb.appliedDate || 'N/A'}
- Giáo viên đang theo dõi: ${teacherName}
- Tổng số tiết tuần: ${tb.totalPeriods || 'N/A'}`;

    if (data.selectedTeacher && Array.isArray(tb.days)) {
      const teacherDays = tb.days.map((d: any) => {
        const morningMatches = (d.morning || []).filter((p: any) => p.teacher === data.selectedTeacher);
        const afternoonMatches = (d.afternoon || []).filter((p: any) => p.teacher === data.selectedTeacher);
        const morningText = morningMatches.length > 0
          ? morningMatches.map((p: any) => `Tiết ${p.period}: Lớp ${p.className} (${p.subject || ''})`).join(', ')
          : 'Không có tiết';
        const afternoonText = afternoonMatches.length > 0
          ? afternoonMatches.map((p: any) => `Tiết ${p.period}: Lớp ${p.className} (${p.subject || ''})`).join(', ')
          : 'Không có tiết';
        return `  + ${d.dayName}: Sáng [${morningText}] | Chiều [${afternoonText}]`;
      });
      timetableInfo += `\n- Lịch dạy các ngày trong tuần của ${teacherName}:\n${teacherDays.join('\n')}`;
    }
    sections.push(timetableInfo);
  }

  // 2. Phân hệ Lớp học & Học sinh
  if ((scope === 'global' || scope === 'classes') && Array.isArray(data.classes) && data.classes.length > 0) {
    const classSummaries = data.classes.slice(0, 15).map((c: any) => {
      const studentCount = (data.students || []).filter((s: any) => s.classId === c.id).length;
      return `  + Lớp "${c.name}": Khối ${c.grade || 'N/A'}, Phòng ${c.room || 'N/A'}, Học phí: ${c.tuitionRate ? c.tuitionRate.toLocaleString('vi-VN') + ' đ/tháng' : 'Chưa đặt'}, Sĩ số: ${studentCount} học sinh`;
    });

    const totalStudents = (data.students || []).length;
    const unpaidStudents = (data.students || []).filter((s: any) => s.tuitionPaid === false || s.tuitionStatus === 'unpaid').length;

    sections.push(`### 2. QUẢN LÝ LỚP HỌC & HỌC VIÊN:
- Tổng số lớp quản lý: ${data.classes.length} lớp
- Tổng số học sinh: ${totalStudents} học sinh (${unpaidStudents} học sinh chưa nộp học phí)
- Chi tiết các lớp:
${classSummaries.join('\n')}`);
  }

  // 3. Phân hệ Lịch tự do / Gia sư
  if ((scope === 'global' || scope === 'schedule') && Array.isArray(data.appointments) && data.appointments.length > 0) {
    const pendingAppointments = data.appointments.filter((a: any) => a.status !== 'completed' && a.status !== 'cancelled');
    const upcomingSummaries = pendingAppointments.slice(0, 10).map((a: any) => {
      return `  + [${a.date || 'N/A'} ${a.startTime || ''}-${a.endTime || ''}] ${a.title || a.customerName || 'Ca dạy'}: Địa điểm: ${a.location || 'Tại nhà'}, Phí: ${a.fee ? a.fee.toLocaleString('vi-VN') + ' đ' : 'N/A'}`;
    });

    sections.push(`### 3. LỊCH DẠY TỰ DO & LỊCH HẸN GIA SƯ:
- Tổng số lịch hẹn / ca gia sư: ${data.appointments.length} (Còn ${pendingAppointments.length} ca sắp tới)
- Các ca dạy sắp diễn ra:
${upcomingSummaries.length > 0 ? upcomingSummaries.join('\n') : '  (Hiện không có ca hẹn nào sắp tới)'}`);
  }

  // 4. Phân hệ Thu nhập & Thù lao
  if ((scope === 'global') && Array.isArray(data.transactions) && data.transactions.length > 0) {
    const totalIncome = data.transactions
      .filter((t: any) => t.isPaid !== false)
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    const pendingIncome = data.transactions
      .filter((t: any) => t.isPaid === false)
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

    sections.push(`### 4. BÁO CÁO THU NHẬP & THÙ LAO:
- Tổng thù lao đã thanh toán: ${totalIncome.toLocaleString('vi-VN')} đ
- Thù lao còn nợ / chờ đối soát: ${pendingIncome.toLocaleString('vi-VN')} đ
- Tổng số giao dịch ghi nhận: ${data.transactions.length}`);
  }

  // Lời chỉ dẫn chung
  return `Bạn là "Trợ Lý Gemini AI Toàn Năng" tích hợp sẵn trong ứng dụng Sổ Tay Béo.
Thời điểm hiện tại: ${dateStr}.
Người dùng: ${teacherName} (${data.user?.email || 'Người dùng'}).
Phạm vi bối cảnh đang chọn: ${scope === 'global' ? 'TOÀN BỘ TRANG WEB (TỔNG HỢP ĐA PHÂN HỆ)' : scope.toUpperCase()}.

Dưới đây là TOÀN BỘ BỐI CẢNH DỮ LIỆU ĐANG CÓ TRÊN TRANG WEB CỦA NGƯỜI DÙNG:
${sections.length > 0 ? sections.join('\n\n') : '(Người dùng hiện chưa nhập dữ liệu hoặc chưa tải lên tệp thời khóa biểu)'}

---
HƯỚNG DẪN TRẢ LỜI:
1. Dựa trên dữ liệu thực tế ở trên để giải đáp thắc mắc, phân tích lịch dạy, đối soát chéo (ví dụ kiểm tra trùng giờ giữa TKB trường và ca gia sư), tính toán thù lao, thống kê lớp học.
2. Nếu người dùng hỏi điều gì không có trong dữ liệu trên hoặc câu hỏi tổng quát ngoài đời sống/chuyên môn giáo dục, bạn hãy trả lời tự nhiên theo hiểu biết sâu rộng của bạn, không từ chối.
3. Luôn trả lời bằng tiếng Việt thân thiện, rõ ràng, dùng gạch đầu dòng và định dạng số tiền, ngày tháng dễ nhìn.`;
}
