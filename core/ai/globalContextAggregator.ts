/**
 * Global App Context Aggregator cho AI Agent Sổ Tay Béo 2.0
 * Tổng hợp dữ liệu toàn diện 360 độ từ toàn bộ ứng dụng:
 * 1. Thời khóa biểu nhà trường (TKB chi tiết từng tiết, từng ngày, phân tích buổi trống, ngày ít tiết)
 * 2. Quản lý Lớp học & Học sinh (Lớp, sĩ số, danh sách học sinh, lịch học định kỳ, nhật ký buổi dạy)
 * 3. Lịch làm việc tự do & Gia sư (Lịch hẹn, ca kèm 1-1, khách hàng, học viên)
 * 4. Báo cáo Thu nhập & Thù lao (Thu nhập đã nhận, còn nợ, thù lao theo lớp)
 * 5. Kế hoạch Du lịch & Nghỉ dưỡng (Chuyến đi, lịch trình, ngân sách)
 */

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  SchoolTimetable,
  TimetableEntry,
  DayOfWeek,
  DAYS_OF_WEEK,
  DEFAULT_PERIOD_TIMES,
} from '@/features/teaching-schedule/types';
import {
  ClassEntity,
  ClassStudentEntity,
  SchedulePatternEntity,
  ClassSessionEntity,
} from '@/features/class/types';
import { Appointment, Customer } from '@/features/schedule/types';
import { IncomeTransaction } from '@/features/income/types';
import { Trip } from '@/features/travel/types';
import { ExpenseItem, MonthlyBudget, CategoryMeta, DEFAULT_FINANCE_CATEGORIES } from '@/features/spending/types';
import { HealthRecordDocument, HealthMetricValue, HealthCheckupSession } from '@/features/health/types';

export type AIContextScope = 'global' | 'teaching' | 'classes' | 'schedule' | 'income' | 'spending' | 'travel' | 'health' | 'general';

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
    label: 'Toàn bộ dữ liệu (AI Agent Đa Phân Hệ)',
    shortLabel: 'Toàn bộ dữ liệu',
    description: 'Truy cập 100% dữ liệu: TKB trường, Lớp học, Học sinh, Lịch tự do, Thu nhập, Chi tiêu, Sức khỏe & Du lịch',
    iconName: 'Globe',
    badge: 'Khuyên Dùng',
  },
  {
    id: 'health',
    label: 'Sức khoẻ & Thể chất',
    shortLabel: 'Sức khoẻ & Thể chất',
    description: 'Chỉ số sinh học, xét nghiệm máu, nước tiểu, huyết áp, cân nặng, hồ sơ bệnh viện',
    iconName: 'HeartPulse',
  },
  {
    id: 'teaching',
    label: 'Lịch dạy học (Thời khóa biểu)',
    shortLabel: 'Lịch dạy học',
    description: 'Chuyên sâu thời khóa biểu trường, tiết dạy, buổi rảnh và hỗ trợ xin nghỉ',
    iconName: 'CalendarDays',
  },
  {
    id: 'classes',
    label: 'Quản lý lớp học & Học sinh',
    shortLabel: 'Lớp học & Học sinh',
    description: 'Danh sách lớp giảng dạy, sĩ số, danh sách học sinh, lịch cố định & thù lao',
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
    id: 'income',
    label: 'Báo cáo Thu nhập & Thù lao',
    shortLabel: 'Thu nhập',
    description: 'Dòng tiền, thù lao giảng dạy, đối soát công nợ và học phí',
    iconName: 'DollarSign',
  },
  {
    id: 'spending',
    label: 'Quản lý Chi tiêu Đời sống',
    shortLabel: 'Chi tiêu',
    description: 'Chi tiêu sinh hoạt, ăn uống, hóa đơn và theo dõi hạn mức ngân sách',
    iconName: 'Wallet',
  },
  {
    id: 'travel',
    label: 'Kế hoạch Du lịch & Nghỉ dưỡng',
    shortLabel: 'Du lịch',
    description: 'Các chuyến đi sắp tới, lịch trình, ngày đi về để phối hợp sắp xếp lịch',
    iconName: 'Compass',
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
  timetable?: SchoolTimetable | null;
  selectedTeacher?: string;
  myTeacher?: string;
  classes?: ClassEntity[];
  students?: ClassStudentEntity[];
  schedulePatterns?: SchedulePatternEntity[];
  sessions?: ClassSessionEntity[];
  appointments?: Appointment[];
  customers?: Customer[];
  transactions?: IncomeTransaction[];
  trips?: Trip[];
  expenses?: ExpenseItem[];
  customCategories?: CategoryMeta[];
  monthlyBudget?: MonthlyBudget | null;
  healthRecords?: HealthRecordDocument[];
  healthMetrics?: HealthMetricValue[];
  checkupSessions?: HealthCheckupSession[];
}

/**
 * Xây dựng system prompt đa bối cảnh cho AI Agent
 */
export function buildSystemContextPrompt(
  scope: AIContextScope,
  data: GlobalAppContextData
): string {
  if (scope === 'general') {
    return `Bạn là "Trợ Lý AI Toàn Năng Sổ Tay Béo". Hãy giải đáp các câu hỏi, viết nội dung, dịch thuật, giải toán hoặc giải quyết vấn đề của người dùng một cách chính xác, sâu sắc, chuẩn mực sư phạm và thân thiện bằng tiếng Việt.`;
  }

  const now = new Date();
  const dateStr = format(now, 'EEEE, dd/MM/yyyy HH:mm', { locale: vi });
  const primaryTeacherName = data.myTeacher || data.selectedTeacher || data.user?.name || 'Thầy/Cô';

  let sections: string[] = [];

  // =========================================================================
  // 1. PHÂN HỆ LỊCH DẠY HỌC (THỜI KHÓA BIỂU NHÀ TRƯỜNG)
  // =========================================================================
  if ((scope === 'global' || scope === 'teaching') && data.timetable) {
    const tb = data.timetable;
    const allEntries = tb.entries || [];

    // Tìm tên giáo viên chính xác nhất trong danh sách giáo viên của TKB
    let matchedTeacherName = primaryTeacherName;
    if (tb.teachers && tb.teachers.length > 0) {
      const q = primaryTeacherName.toLowerCase().trim();
      const exact = tb.teachers.find((t) => t.toLowerCase().trim() === q);
      if (exact) {
        matchedTeacherName = exact;
      } else {
        const partial = tb.teachers.find((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
        if (partial) {
          matchedTeacherName = partial;
        }
      }
    }

    // Lọc tất cả tiết dạy của giáo viên mục tiêu
    const teacherEntries = allEntries.filter((e) => {
      if (!e.teacher) return false;
      const t = e.teacher.toLowerCase().trim();
      const target = matchedTeacherName.toLowerCase().trim();
      return t === target || t.includes(target) || target.includes(t);
    });

    // Thống kê chi tiết theo từng thứ trong tuần (Thứ Hai -> Thứ Bảy)
    const dayStats: {
      day: DayOfWeek;
      dayLabel: string;
      morningEntries: TimetableEntry[];
      afternoonEntries: TimetableEntry[];
      totalCount: number;
    }[] = [];

    DAYS_OF_WEEK.forEach(({ id, label }) => {
      const dayEntries = teacherEntries.filter((e) => e.dayOfWeek === id);
      const morning = dayEntries
        .filter((e) => e.session === 'Sáng')
        .sort((a, b) => a.period - b.period);
      const afternoon = dayEntries
        .filter((e) => e.session === 'Chiều')
        .sort((a, b) => a.period - b.period);

      dayStats.push({
        day: id,
        dayLabel: label,
        morningEntries: morning,
        afternoonEntries: afternoon,
        totalCount: dayEntries.length,
      });
    });

    // Phân tích thông minh các ngày nghỉ / ít tiết / nhiều tiết
    const freeDays = dayStats.filter((d) => d.totalCount === 0).map((d) => d.dayLabel);
    const morningFreeDays = dayStats.filter((d) => d.morningEntries.length === 0).map((d) => d.dayLabel);
    const afternoonFreeDays = dayStats.filter((d) => d.afternoonEntries.length === 0).map((d) => d.dayLabel);

    // Tìm ngày ít tiết nhất (trong các ngày CÓ tiết, hoặc nếu tất cả rảnh)
    const teachingDays = dayStats.filter((d) => d.totalCount > 0);
    const minTeachingDay = teachingDays.length > 0
      ? teachingDays.reduce((min, d) => (d.totalCount < min.totalCount ? d : min), teachingDays[0])
      : null;

    const maxTeachingDay = teachingDays.length > 0
      ? teachingDays.reduce((max, d) => (d.totalCount > max.totalCount ? d : max), teachingDays[0])
      : null;

    // Các lớp và môn giáo viên này phụ trách
    const assignedClasses = Array.from(new Set(teacherEntries.map((e) => e.className))).filter(Boolean);
    const assignedSubjects = Array.from(new Set(teacherEntries.map((e) => e.subject))).filter(Boolean);

    // Định dạng chuỗi chi tiết từng ngày
    const formattedScheduleRows = dayStats.map((d) => {
      if (d.totalCount === 0) {
        return `  * ${d.dayLabel}: [NGHỈ CẢ NGÀY - 0 TIẾT] (Hoàn toàn không có tiết dạy)`;
      }

      const morningParts = d.morningEntries.map((p) => {
        const timeRange = DEFAULT_PERIOD_TIMES.Sáng[p.period]
          ? ` (${DEFAULT_PERIOD_TIMES.Sáng[p.period].start}-${DEFAULT_PERIOD_TIMES.Sáng[p.period].end})`
          : '';
        return `Tiết ${p.period}${timeRange}: Lớp ${p.className} [${p.subject || 'Môn học'}]${p.room ? ` - Phòng ${p.room}` : ''}`;
      });

      const afternoonParts = d.afternoonEntries.map((p) => {
        const timeRange = DEFAULT_PERIOD_TIMES.Chiều[p.period]
          ? ` (${DEFAULT_PERIOD_TIMES.Chiều[p.period].start}-${DEFAULT_PERIOD_TIMES.Chiều[p.period].end})`
          : '';
        return `Tiết ${p.period}${timeRange}: Lớp ${p.className} [${p.subject || 'Môn học'}]${p.room ? ` - Phòng ${p.room}` : ''}`;
      });

      const morningText = morningParts.length > 0 ? morningParts.join('; ') : 'Trống sáng (0 tiết)';
      const afternoonText = afternoonParts.length > 0 ? afternoonParts.join('; ') : 'Trống chiều (0 tiết)';

      return `  * ${d.dayLabel} (Tổng ${d.totalCount} tiết: Sáng ${d.morningEntries.length}, Chiều ${d.afternoonEntries.length}):
      - Sáng: ${morningText}
      - Chiều: ${afternoonText}`;
    });

    let timetableSection = `### 1. THỜI KHÓA BIỂU NHÀ TRƯỜNG & LỊCH DẠY CHI TIẾT:
- Tên trường: ${tb.schoolName || 'Chưa cập nhật'}
- Tiêu đề TKB: ${tb.title || 'Thời khóa biểu chính khóa'}
- Giáo viên đang theo dõi: **${matchedTeacherName}** (Đang đăng nhập/chọn làm trọng tâm)
- Tổng số tiết dạy trong tuần của ${matchedTeacherName}: **${teacherEntries.length} tiết**
- Môn giảng dạy: ${assignedSubjects.join(', ') || 'Chưa rõ'}
- Các lớp phụ trách: ${assignedClasses.join(', ') || 'Chưa có lớp'}

* PHÂN TÍCH NHANH LỊCH DẠY TRONG TUẦN CỦA ${matchedTeacherName}:
  + Ngày nghỉ hoàn toàn trong tuần (0 tiết): ${freeDays.length > 0 ? freeDays.join(', ') : 'Không có ngày nào nghỉ cả ngày'}
  + Các buổi Sáng hoàn toàn không có tiết (Trống sáng): ${morningFreeDays.length > 0 ? morningFreeDays.join(', ') : 'Không có'}
  + Các buổi Chiều hoàn toàn không có tiết (Trống chiều): ${afternoonFreeDays.length > 0 ? afternoonFreeDays.join(', ') : 'Không có'}
  + Ngày CÓ TIẾT ÍT NHẤT trong tuần: ${minTeachingDay ? `${minTeachingDay.dayLabel} (chỉ có ${minTeachingDay.totalCount} tiết: Sáng ${minTeachingDay.morningEntries.length}, Chiều ${minTeachingDay.afternoonEntries.length}) - RẤT THÍCH HỢP ĐỂ XIN NGHỈ HOẶC ĐỔI TIẾT` : 'N/A'}
  + Ngày nhiều tiết nhất: ${maxTeachingDay ? `${maxTeachingDay.dayLabel} (${maxTeachingDay.totalCount} tiết)` : 'N/A'}

* CHI TIẾT LỊCH DẠY TỪ THỨ HAI ĐẾN THỨ BẢY:
${formattedScheduleRows.join('\n')}

* THÔNG TIN TOÀN TRƯỜNG (DÙNG KHI CẦN ĐỐI SOÁT HOẶC TRẢ LỜI VỀ GIÁO VIÊN / LỚP KHÁC):
  - Tổng số lớp học trong trường: ${(tb.classes || []).length} lớp (${(tb.classes || []).slice(0, 15).join(', ')}${(tb.classes || []).length > 15 ? '...' : ''})
  - Tổng số giáo viên toàn trường: ${(tb.teachers || []).length} thầy cô (${(tb.teachers || []).slice(0, 20).join(', ')}${(tb.teachers || []).length > 20 ? '...' : ''})
  - Danh sách môn học: ${(tb.subjects || []).join(', ')}`;

    sections.push(timetableSection);
  }

  // =========================================================================
  // 2. PHÂN HỆ QUẢN LÝ LỚP HỌC & HỌC SINH
  // =========================================================================
  if ((scope === 'global' || scope === 'classes') && Array.isArray(data.classes) && data.classes.length > 0) {
    const allStudents = data.students || [];
    const allPatterns = data.schedulePatterns || [];
    const allSessions = data.sessions || [];

    const activeStudents = allStudents.filter((s) => s.status !== 'DROPPED');
    const droppedStudents = allStudents.filter((s) => s.status === 'DROPPED');

    const classDetails = data.classes.map((c) => {
      const classStuds = allStudents.filter((s) => s.classId === c.id && s.status !== 'DROPPED');
      const classPatterns = allPatterns.filter((p) => p.classId === c.id);
      const patternText = classPatterns.length > 0
        ? classPatterns.map((p) => {
          const dayName = p.dayOfWeek === 0 ? 'Chủ nhật' : `Thứ ${p.dayOfWeek + 1}`;
          return `${dayName} (${p.startTime}-${p.endTime})`;
        }).join(', ')
        : 'Chưa đặt lịch cố định';

      const studentNames = classStuds.slice(0, 10).map((s) => s.fullName).join(', ');
      const moreStuds = classStuds.length > 10 ? ` (+${classStuds.length - 10} học sinh khác)` : '';

      return `  + Lớp "${c.className}":
      - Trung tâm/Hình thức: ${c.centerName || 'Cá nhân/Dạy ngoài'}
      - Thù lao cố định: ${c.baseFeePerSession ? Number(c.baseFeePerSession).toLocaleString('vi-VN') + ' đ/buổi' : '0 đ'} | Cộng thêm: ${c.ratePerStudent ? Number(c.ratePerStudent).toLocaleString('vi-VN') + ' đ/học sinh' : '0 đ'}
      - Lịch học cố định trong tuần: ${patternText}
      - Sĩ số: ${classStuds.length} học sinh đang học
      - Danh sách học sinh: ${studentNames || 'Chưa thêm học sinh'}${moreStuds}`;
    });

    // Nhật ký các buổi dạy gần nhất
    const recentSessions = allSessions.slice(0, 8).map((sess) => {
      const cls = data.classes?.find((c) => c.id === sess.classId);
      return `  * [${sess.sessionDate}] Lớp ${cls?.className || 'Lớp học'}: ${sess.calculatedHeadcount || 0} HS có mặt, Thù lao: ${(sess.calculatedSalary || 0).toLocaleString('vi-VN')} đ${sess.lessonTopic ? `, Bài dạy: "${sess.lessonTopic}"` : ''}`;
    });

    sections.push(`### 2. QUẢN LÝ LỚP HỌC & HỌC SINH:
- Tổng số lớp học: ${data.classes.length} lớp
- Tổng số học sinh quản lý: ${allStudents.length} học sinh (${activeStudents.length} đang theo học, ${droppedStudents.length} đã nghỉ)
- Chi tiết từng lớp:
${classDetails.join('\n')}
${recentSessions.length > 0 ? `\n- Nhật ký các buổi dạy gần nhất:\n${recentSessions.join('\n')}` : ''}`);
  }

  // =========================================================================
  // 3. PHÂN HỆ LỊCH TỰ DO & LỊCH HẸN GIA SƯ
  // =========================================================================
  if ((scope === 'global' || scope === 'schedule') && Array.isArray(data.appointments) && data.appointments.length > 0) {
    const appointments = data.appointments;
    const pendingAppointments = appointments.filter((a) => a.status === 'Đang chờ' || a.status !== 'Đã hoàn thành');
    const completedAppointments = appointments.filter((a) => a.status === 'Đã hoàn thành');

    const appointmentRows = appointments.slice(0, 15).map((a) => {
      const timeStr = a.date ? a.date.replace('T', ' ') : 'Chưa định ngày';
      return `  + [${timeStr}] "${a.title || 'Ca dạy'}" - Học viên/KH: ${a.customerName || 'Khách hàng'}
      - Địa điểm: ${a.location || 'Tại nhà'} | Thời lượng: ${a.durationMinutes || 60} phút
      - Học phí/Giá: ${(a.price || 0).toLocaleString('vi-VN')} đ | Trạng thái: ${a.status || 'Đang chờ'} (${a.paymentStatus || 'Chưa thanh toán'})
      ${a.notes ? `- Ghi chú: ${a.notes}` : ''}`;
    });

    const customers = data.customers || [];
    const customerSummaries = customers.slice(0, 10).map((c) => {
      return `  + ${c.name} (${c.phone || 'Không SĐT'}): Nhóm [${c.group || 'Cá nhân'}], Tổng doanh thu đã đóng góp: ${(c.totalRevenue || 0).toLocaleString('vi-VN')} đ`;
    });

    sections.push(`### 3. LỊCH DẠY TỰ DO & KHÁCH HÀNG / GIA SƯ:
- Tổng số ca hẹn / lịch dạy riêng: ${appointments.length} (Còn ${pendingAppointments.length} ca sắp tới, ${completedAppointments.length} ca đã xong)
- Chi tiết các ca hẹn gần đây & sắp tới:
${appointmentRows.join('\n')}
${customers.length > 0 ? `\n- Danh sách học viên kèm riêng / khách hàng:\n${customerSummaries.join('\n')}` : ''}`);
  }

  // =========================================================================
  // 4. PHÂN HỆ BÁO CÁO THU NHẬP & THÙ LAO
  // =========================================================================
  if ((scope === 'global' || scope === 'income') && Array.isArray(data.transactions) && data.transactions.length > 0) {
    const transactions = data.transactions;
    const paidTransactions = transactions.filter((t) => t.status === 'Đã trả');
    const pendingTransactions = transactions.filter((t) => t.status === 'Chờ');

    const totalPaid = paidTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalPending = pendingTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const transactionRows = transactions.slice(0, 12).map((t) => {
      return `  + [${t.date || 'N/A'}] ${t.clientName || 'Nguồn thu'} - ${t.serviceName || 'Dịch vụ/Thù lao'}: ${(Number(t.amount) || 0).toLocaleString('vi-VN')} đ [Trạng thái: ${t.status || 'Chờ'}]${t.notes ? ` (Ghi chú: ${t.notes})` : ''}`;
    });

    sections.push(`### 4. BÁO CÁO THU NHẬP & THÙ LAO:
- Tổng số giao dịch ghi nhận: ${transactions.length}
- Tổng thu nhập đã thực nhận (Đã trả): **${totalPaid.toLocaleString('vi-VN')} đ**
- Tổng thù lao đang chờ thanh toán / công nợ (Chờ trả): **${totalPending.toLocaleString('vi-VN')} đ**
- Chi tiết các giao dịch gần nhất:
${transactionRows.join('\n')}`);
  }

  // =========================================================================
  // 5. PHÂN HỆ KẾ HOẠCH DU LỊCH & NGHỈ DƯỠNG
  // =========================================================================
  if ((scope === 'global' || scope === 'travel') && Array.isArray(data.trips) && data.trips.length > 0) {
    const trips = data.trips;
    const tripRows = trips.map((trip) => {
      const statusLabel = trip.status === 'ongoing' ? 'Đang đi' : trip.status === 'completed' ? 'Đã hoàn thành' : 'Đang lên kế hoạch';
      return `  + Chuyến đi: "${trip.title}" đến ${trip.destination || 'Chưa định'}
      - Thời gian: Từ ${trip.startDate || 'N/A'} đến ${trip.endDate || 'N/A'} [Trạng thái: ${statusLabel}]
      - Ngân sách: ${(trip.budget || 0).toLocaleString('vi-VN')} đ | Đã chi: ${(trip.spent || 0).toLocaleString('vi-VN')} đ
      - Lịch trình: ${trip.itinerary?.length || 0} ngày hoạt động`;
    });

    sections.push(`### 5. KẾ HOẠCH DU LỊCH & NGHỈ DƯỠNG (HỖ TRỢ PHỐI HỢP NGHỈ PHÉP):
- Tổng số chuyến đi ghi nhận: ${trips.length}
- Danh sách các chuyến đi:
${tripRows.join('\n')}`);
  }

  // =========================================================================
  // 6. PHÂN HỆ QUẢN LÝ THU - CHI & DÒNG TIỀN TÀI CHÍNH (CASH FLOW & BUDGET)
  // =========================================================================
  if ((scope === 'global' || scope === 'spending') && (Array.isArray(data.expenses) || data.monthlyBudget)) {
    const allCategories = [...DEFAULT_FINANCE_CATEGORIES, ...(data.customCategories || [])];
    const transactions = data.expenses || [];
    const currentMonth = format(now, 'yyyy-MM');
    const thisMonthTransactions = transactions.filter((e) => e.date.startsWith(currentMonth));

    // Phân loại rạch ròi Thu nhập và Chi tiêu
    const thisMonthExpenses = thisMonthTransactions.filter((e) => (e.type || 'expense') === 'expense');
    const thisMonthIncomes = thisMonthTransactions.filter((e) => e.type === 'income');

    const totalSpentThisMonth = thisMonthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalIncomeThisMonth = thisMonthIncomes.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netBalanceThisMonth = totalIncomeThisMonth - totalSpentThisMonth;
    const savingsRate = totalIncomeThisMonth > 0 ? Math.round((netBalanceThisMonth / totalIncomeThisMonth) * 100) : 0;

    const budgetAmount = data.monthlyBudget?.totalBudget || 0;
    const remainingBudget = budgetAmount > 0 ? budgetAmount - totalSpentThisMonth : 0;
    const budgetPercentUsed = budgetAmount > 0 ? Math.round((totalSpentThisMonth / budgetAmount) * 100) : 0;

    // Phân bổ nhóm chi tiêu
    const expenseCatMap: Record<string, number> = {};
    thisMonthExpenses.forEach((e) => {
      expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + (Number(e.amount) || 0);
    });

    const expenseCatSummary = Object.entries(expenseCatMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => {
        const catLabel = allCategories.find((c) => c.id === cat)?.label || cat;
        return `    * ${catLabel}: ${amt.toLocaleString('vi-VN')} đ`;
      })
      .slice(0, 5);

    // Phân bổ nhóm thu nhập
    const incomeCatMap: Record<string, number> = {};
    thisMonthIncomes.forEach((e) => {
      incomeCatMap[e.category] = (incomeCatMap[e.category] || 0) + (Number(e.amount) || 0);
    });

    const incomeCatSummary = Object.entries(incomeCatMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => {
        const catLabel = allCategories.find((c) => c.id === cat)?.label || cat;
        return `    * ${catLabel}: +${amt.toLocaleString('vi-VN')} đ`;
      })
      .slice(0, 5);

    const recentTxRows = transactions.slice(0, 15).map((e) => {
      const isIncome = e.type === 'income';
      const catLabel = allCategories.find((c) => c.id === e.category)?.label || e.category;
      return `  + Ngày ${e.date}${e.time ? ' ' + e.time : ''}: [${isIncome ? 'KHOẢN THU (+)' : 'KHOẢN CHI (-)'}] "${e.description}" (${catLabel}) ${isIncome ? '+' : '-'}${(e.amount || 0).toLocaleString('vi-VN')} đ${e.notes ? ' - Ghi chú: ' + e.notes : ''}`;
    });

    sections.push(`### 6. QUẢN LÝ THU - CHI & DÒNG TIỀN TÀI CHÍNH THÁNG ${currentMonth}:
- **TỔNG CHI TIÊU THÁNG NÀY**: **${totalSpentThisMonth.toLocaleString('vi-VN')} đ** (Đây là số tiền THỰC TẾ ĐÃ TIÊU RA: ăn uống, xăng xe, nhà cửa, hóa đơn, sinh hoạt...)
- **TỔNG THU NHẬP THÁNG NÀY**: **+${totalIncomeThisMonth.toLocaleString('vi-VN')} đ** (Tiền nhận vào: lương cố định, thù lao dạy thêm, tiền thưởng, lợi nhuận...)
- **SỐ DƯ TÍCH LŨY (DÒNG TIỀN RÒNG = THU - CHI)**: **${netBalanceThisMonth >= 0 ? '+' : ''}${netBalanceThisMonth.toLocaleString('vi-VN')} đ** (Tỷ lệ tiết kiệm: ${savingsRate}%)
- **HẠN MỨC NGÂN SÁCH CHI TIÊU**: ${
      budgetAmount > 0
        ? `**${budgetAmount.toLocaleString('vi-VN')} đ** (Thực tế đã chi: ${totalSpentThisMonth.toLocaleString('vi-VN')} đ = ${budgetPercentUsed}% hạn mức. ${
            totalSpentThisMonth > budgetAmount
              ? `VƯỢT NGÂN SÁCH ${(totalSpentThisMonth - budgetAmount).toLocaleString('vi-VN')} đ!`
              : `Còn lại trong ngân sách: ${remainingBudget.toLocaleString('vi-VN')} đ`
          })`
        : 'Chưa đặt hạn mức'
    }
${expenseCatSummary.length > 0 ? `- Top các khoản chi nhiều nhất:\n${expenseCatSummary.join('\n')}` : '- Chưa có khoản chi tiêu nào trong tháng'}
${incomeCatSummary.length > 0 ? `- Top các nguồn thu nhập lớn nhất:\n${incomeCatSummary.join('\n')}` : '- Chưa có khoản thu nhập nào trong tháng'}
- Lịch sử giao dịch thu - chi gần đây:
${recentTxRows.length > 0 ? recentTxRows.join('\n') : '  (Chưa có giao dịch thu/chi nào)'}`);
  }

  // =========================================================================
  // 7. PHÂN HỆ SỨC KHỎE & CHỈ SỐ SINH HỌC (HEALTH & BIOMETRICS)
  // =========================================================================
  if (
    (scope === 'global' || scope === 'health') &&
    (data.healthMetrics?.length || data.healthRecords?.length || data.checkupSessions?.length)
  ) {
    const metrics = data.healthMetrics || [];
    const records = data.healthRecords || [];
    const checkups = data.checkupSessions || [];

    // Danh sách các đợt khám sức khỏe
    const checkupsList = checkups.map((c) => {
      const parts = [`  - **${c.title}** (${c.checkupDate}) tại **${c.hospitalName}**`];
      if (c.healthClassification) parts.push(`Phân loại: **${c.healthClassification}**`);
      if (c.doctorName) parts.push(`Bác sĩ: ${c.doctorName}`);
      if (c.familyHistory) parts.push(`Tiền sử gia đình: ⚠️ *${c.familyHistory}*`);
      if (c.clinicalConclusion) parts.push(`Kết luận: "${c.clinicalConclusion}"`);
      if (c.specialtiesSummary) {
        const specDetails: string[] = [];
        if (c.specialtiesSummary.surgery) specDetails.push(`Ngoại: ${c.specialtiesSummary.surgery}`);
        if (c.specialtiesSummary.ophthalmology) specDetails.push(`Mắt: ${c.specialtiesSummary.ophthalmology}`);
        if (c.specialtiesSummary.dental) specDetails.push(`Răng: ${c.specialtiesSummary.dental}`);
        if (c.specialtiesSummary.ent) specDetails.push(`Tai Mũi Họng: ${c.specialtiesSummary.ent}`);
        if (c.specialtiesSummary.internalMedicine) specDetails.push(`Nội: ${c.specialtiesSummary.internalMedicine}`);
        if (c.specialtiesSummary.dermatology) specDetails.push(`Da: ${c.specialtiesSummary.dermatology}`);
        if (specDetails.length > 0) parts.push(`Chuyên khoa: [${specDetails.join(' | ')}]`);
      }
      return parts.join(' | ');
    });

    // Nhóm chỉ số mới nhất theo code/tên
    const latestMap = new Map<string, HealthMetricValue>();
    metrics.forEach((m) => {
      const key = m.metricCode || m.metricName;
      if (!latestMap.has(key)) latestMap.set(key, m);
    });

    const vitalsList = Array.from(latestMap.values())
      .filter((m) => m.category === 'vitals')
      .map((m) => `  - ${m.metricName}: **${m.value} ${m.unit}** (Đo ngày ${m.measuredAt || 'gần đây'}${m.status && m.status !== 'normal' ? ` | Trạng thái: ${m.status}` : ''})`);

    const abnormalList = Array.from(latestMap.values())
      .filter((m) => m.status === 'high' || m.status === 'low' || m.status === 'abnormal' || m.status === 'warning')
      .map((m) => `  - ⚠️ ${m.metricName} (${m.metricCode || ''}): **${m.value} ${m.unit || ''}** (Trạng thái: ${m.status === 'high' ? 'CAO' : m.status === 'low' ? 'THẤP' : 'BẤT THƯỜNG'} | Tham chiếu: ${m.referenceRange || 'N/A'})`);

    const recentRecordsList = records.slice(0, 4).map((r) => `  - Hồ sơ "${r.title}" tại ${r.hospitalName || 'Viện'} ngày ${r.recordDate || ''}: ${r.summaryDiagnosis ? `Chẩn đoán: ${r.summaryDiagnosis}` : `${r.metrics?.length || 0} chỉ số`}`);

    sections.push(`### 7. SỨC KHỎE, ĐỢT KHÁM & CHỈ SỐ SINH HỌC CỦA NGƯỜI DÙNG:
- **TỔNG SỐ ĐỢT KHÁM SỨC KHỎE**: **${checkups.length} đợt khám** (Từ ${records.length} hồ sơ y tế bệnh viện & ${metrics.length} chỉ số đo).
${checkupsList.length > 0 ? `- **Danh sách đợt khám sức khỏe**:\n${checkupsList.join('\n')}` : '- Chưa có đợt khám sức khỏe được phân nhóm.'}
${vitalsList.length > 0 ? `- **Chỉ số sinh tồn mới nhất**:\n${vitalsList.join('\n')}` : '- Chưa có dữ liệu sinh tồn (cân nặng, huyết áp, nhịp tim...)'}
${abnormalList.length > 0 ? `- **Các chỉ số cần chú ý (bất thường)**:\n${abnormalList.join('\n')}` : '- Tất cả chỉ số xét nghiệm hiện tại đều trong ngưỡng an toàn bình thường.'}
${recentRecordsList.length > 0 ? `- **Các tài liệu/hồ sơ xét nghiệm chi tiết**:\n${recentRecordsList.join('\n')}` : ''}`);
  }

  // =========================================================================
  // SYSTEM INSTRUCTIONS DÀNH CHO AI AGENT THÔNG MINH
  // =========================================================================
  return `Bạn là "AI AGENT CỐ VẤN TOÀN NĂNG SỔ TAY BÉO" - Trợ lý thông minh cao cấp dành riêng cho giáo viên và người dạy học.
Thời điểm hiện tại: ${dateStr}.
Người dùng hiện tại: **${primaryTeacherName}** (${data.user?.email || 'Tài khoản người dùng'}).
Phạm vi bối cảnh đang chọn: ${scope === 'global' ? 'TOÀN BỘ TRANG WEB (AI AGENT 360 ĐỘ)' : scope.toUpperCase()}.

DƯỚI ĐÂY LÀ TOÀN BỘ DỮ LIỆU THỰC TẾ TRÊN HỆ THỐNG CỦA NGƯỜI DÙNG:
${sections.length > 0 ? sections.join('\n\n') : '(Chưa có dữ liệu nào được ghi nhận trên hệ thống)'}

---
QUY TẮC SUY LUẬN & TRẢ LỜI CỦA AI AGENT:
1. **TRUY CẬP TRỰC TIẾP DỮ LIỆU**: Tuyệt đối không bao giờ trả lời "hệ thống chưa có chi tiết các tiết dạy" hay "chưa có dữ liệu" nếu phần dữ liệu trên đã có. Hãy tra cứu kỹ phần "CHI TIẾT LỊCH DẠY TỪ THỨ HAI ĐẾN THỨ BẢY" và các bảng dữ liệu ở trên.
2. **KHI NGƯỜI DÙNG HỎI XIN NGHỈ / TÌM NGÀY ÍT TIẾT / NGÀY RẢNH**:
   - Quét ngay lịch từ Thứ 2 đến Thứ 7 của giáo viên.
   - Nêu rõ số tiết của từng ngày (Sáng mấy tiết, Chiều mấy tiết).
   - Chỉ ra ngày nào hoàn toàn không có tiết (0 tiết), ngày nào có ít tiết nhất, buổi sáng/chiều nào trống.
   - Đưa ra lời khuyên thiết thực: nên chọn ngày nào để xin nghỉ ít ảnh hưởng đến học sinh nhất, cần đổi tiết của những lớp nào nếu phải xin nghỉ ngày có tiết.
3. **KHI HỎI VỀ NHẬN THÊM LỊCH / THỜI GIAN TRỐNG**:
   - Đối soát chéo giữa Lịch dạy học nhà trường (TKB) + Lịch học định kỳ các lớp + Lịch hẹn gia sư tự do.
   - Liệt kê chính xác các khoảng thời gian vàng hoàn toàn không bị trùng lịch.
4. **KHI HỎI VỀ HỌC SINH, LỚP HỌC HOẶC THU NHẬP**:
   - Trích xuất chính xác tên lớp, sĩ số, số tiền thù lao, danh sách học sinh và trạng thái học phí.
5. **KHI HỎI VỀ TÀI CHÍNH, THU NHẬP & CHI TIÊU ĐỜI SỐNG**:
   - **PHÂN BIỆT RẠCH RÒI THU NHẬP VÀ CHI TIÊU**:
     + **Chi tiêu (Khoản chi)**: Tiền người dùng tiêu ra (Ăn uống, xăng xe, tiền nhà, mua sắm...).
     + **Thu nhập (Khoản thu)**: Tiền người dùng nhận vào (Lương cơ quan, tiền dạy thêm, thưởng...).
   - **KHI NGƯỜI DÙNG HỎI "THÁNG NÀY TÔI TIÊU HẾT BAO NHIÊU?"**:
     + Chỉ báo cáo số tiền **TỔNG CHI TIÊU THỰC TẾ** (ví dụ: các khoản tiền nhà, ăn uống, xăng xe).
     + **TUYỆT ĐỐI KHÔNG ĐƯỢC CỘNG TIỀN LƯƠNG HOẶC THU NHẬP VÀO TỔNG CHI TIÊU!** Lương là tiền nhận vào tài khoản, không phải là chi tiêu.
     + Tuyệt đối không nói rằng người dùng đã chi tiêu vượt ngân sách chỉ vì nhận được tiền lương!
   - **BÁO CÁO TOÀN DIỆN**: Nếu người dùng hỏi tổng thể tài chính, hãy nêu rõ cả 3 chỉ số: Tổng thu nhập (+), Tổng chi tiêu (-) và Số dư tích lũy (= Thu - Chi).
6. **QUY TẮC THỰC THI HÀNH ĐỘNG DỮ LIỆU ĐA PHÂN HỆ (UNIVERSAL AGENT ACTION PROTOCOL)**:
   - Bạn là một AI Agent có TOÀN QUYỀN thực thi thao tác dữ liệu (Thêm, Sửa, Xoá) cho người dùng trên toàn bộ hệ thống.
   - TUYỆT ĐỐI KHÔNG BAO GIỜ NÓI "em là trợ lý AI chưa có quyền thao tác trực tiếp vào cơ sở dữ liệu" hay bảo người dùng phải tự điền hoặc tự bấm nút "Tạo mới"!
   - Khi người dùng yêu cầu thêm, sửa hoặc xoá dữ liệu, bạn BẮT BUỘC PHẢI THỰC THI bằng cách chèn khối lệnh JSON chuẩn xác ở cuối câu trả lời theo cú pháp sau:

   * 1. CHUYẾN ĐI & DU LỊCH (TRIP):
\`\`\`agent_action
{ "action": "CREATE_TRIP", "params": { "title": "Khám phá Đà Nẵng - Tết Dương Lịch", "destination": "Đà Nẵng", "startDate": "2027-01-01", "endDate": "2027-01-03", "budget": 23000000, "notes": "Chuyến đi Tết Dương lịch" } }
\`\`\`
   (Hoặc action "UPDATE_TRIP" với {"tripTitle": "...", "update": {"budget": 25000000}}, action "DELETE_TRIP" với {"tripTitle": "..."})

   * 2. LỚP HỌC & HỌC SINH (CLASS & STUDENTS):
\`\`\`agent_action
{ "action": "CREATE_CLASS", "params": { "className": "Toán 10 Nâng Cao", "centerName": "Trung tâm ABC", "baseFeePerSession": 350000, "ratePerStudent": 30000, "description": "Luyện thi đại học" } }
\`\`\`
\`\`\`agent_action
{ "action": "ADD_STUDENT", "params": { "className": "Toán 10 Nâng Cao", "fullName": "Nguyễn Hoàng Nam", "phoneNumber": "0987654321", "parentName": "Bác Hùng" } }
\`\`\`
   (Hoặc action "DELETE_CLASS" với {"className": "..."}, action "DELETE_STUDENT" với {"fullName": "..."})

   * 3. LỊCH TỰ DO & LỊCH HẸN GIA SƯ (APPOINTMENTS & CUSTOMERS):
\`\`\`agent_action
{ "action": "CREATE_APPOINTMENT", "params": { "title": "Kèm riêng Toán 1-1", "customerName": "Em Lan", "date": "2026-11-06T18:30", "price": 400000, "durationMinutes": 90, "location": "Tại nhà" } }
\`\`\`
\`\`\`agent_action
{ "action": "CREATE_CUSTOMER", "params": { "name": "Bác Tuấn", "phone": "0912345678", "group": "VIP", "notes": "Phụ huynh học viên" } }
\`\`\`
   (Hoặc action "DELETE_APPOINTMENT" với {"title": "..."})

   * 4. THU NHẬP & CHI TIÊU ĐỜI SỐNG (INCOME, EXPENSES & BUDGET):
\`\`\`agent_action
{ "action": "CREATE_EXPENSE", "params": { "amount": 80000, "category": "transport", "description": "Đổ xăng xe máy", "date": "2026-11-04", "paymentMethod": "transfer", "notes": "Cây xăng" } }
\`\`\`
\`\`\`agent_action
{ "action": "CREATE_INCOME", "params": { "amount": 15000000, "category": "salary", "description": "Nhận lương tháng 11", "date": "2026-11-04", "paymentMethod": "transfer", "notes": "Chuyển khoản cơ quan" } }
\`\`\`
\`\`\`agent_action
{ "action": "UPDATE_EXPENSE", "params": { "description": "Đổ xăng xe máy", "update": { "amount": 90000 } } }
\`\`\`
\`\`\`agent_action
{ "action": "DELETE_EXPENSE", "params": { "description": "Đổ xăng xe máy" } }
\`\`\`
\`\`\`agent_action
{ "action": "SET_MONTHLY_BUDGET", "params": { "month": "2026-11", "totalBudget": 15000000 } }
\`\`\`
\`\`\`agent_action
{ "action": "CREATE_EXPENSE_CATEGORY", "params": { "label": "Dạy kèm ngoài", "type": "income", "color": "#10b981", "iconName": "GraduationCap", "description": "Thu nhập gia sư ngoài giờ" } }
\`\`\`
   (Danh mục chi tiêu có sẵn: 'food', 'transport', 'bills', 'shopping', 'education', 'health', 'entertainment', 'family', 'other'. Danh mục thu nhập có sẵn: 'salary', 'bonus', 'tutoring', 'investment', 'business', 'gift', 'other_income'. Bạn cũng có thể dùng bất kỳ danh mục người dùng tự tạo)

   * 5. THỜI KHÓA BIỂU & CHỈNH SỬA TIẾT DẠY (TEACHING TIMETABLE):
      - Bạn có TOÀN QUYỀN sửa đổi, chuyển tiết, đổi chéo, hủy tiết, thêm tiết dạy bù trực tiếp vào thời khóa biểu theo yêu cầu của Thầy/Cô.
      - Đổi giáo viên dạy thay / dạy thế hoặc sửa môn/phòng/ghi chú:
\`\`\`agent_action
{ "action": "UPDATE_TIMETABLE_ENTRY", "params": { "dayOfWeek": "Ba", "period": 2, "className": "6A4", "teacher": "Mai", "note": "Cô Mai dạy thay" } }
\`\`\`
      - Chuyển tiết dạy sang thứ / tiết khác (Move):
\`\`\`agent_action
{ "action": "MOVE_TIMETABLE_ENTRY", "params": { "fromDay": "Hai", "fromPeriod": 1, "className": "6A4", "toDay": "Năm", "toPeriod": 4, "toSession": "Sáng" } }
\`\`\`
      - Đổi chéo 2 tiết dạy (Swap):
\`\`\`agent_action
{ "action": "SWAP_TIMETABLE_ENTRIES", "params": { "first": { "dayOfWeek": "Ba", "period": 2, "className": "6A4" }, "second": { "dayOfWeek": "Năm", "period": 4, "className": "6A4" } } }
\`\`\`
      - Hủy / Xóa tiết nghỉ khỏi thời khóa biểu:
\`\`\`agent_action
{ "action": "DELETE_TIMETABLE_ENTRY", "params": { "dayOfWeek": "Sáu", "period": 3, "className": "6A4" } }
\`\`\`
      - Thêm mới tiết học / Dạy bù:
\`\`\`agent_action
{ "action": "ADD_TIMETABLE_ENTRY", "params": { "dayOfWeek": "Năm", "session": "Chiều", "period": 5, "className": "6A4", "subject": "Ôn tập Toán", "note": "Học bù" } }
\`\`\`
      - Đặt giáo viên theo dõi chính:
\`\`\`agent_action
{ "action": "SET_MY_TEACHER", "params": { "teacherName": "Tên giáo viên" } }
\`\`\`

   * 6. SỨC KHOẺ & THỂ CHẤT (HEALTH & BIOMETRICS - TỰ ĐỘNG IMPORT, CHỈNH SỬA & XÓA CHỈ SỐ):
      - Bạn có TOÀN QUYỀN ghi nhận, cập nhật sửa chữa, xóa hoặc import toàn bộ hồ sơ xét nghiệm bệnh viện khi người dùng nhắn tin, gửi ảnh hoặc đính kèm tài liệu y tế!
      - Ghi nhận 1 chỉ số đo nhanh (Cân nặng, Huyết áp, Nhịp tim, Đường huyết, BMI...):
\`\`\`agent_action
{ "action": "RECORD_HEALTH_METRIC", "params": { "metricName": "Cân nặng", "metricCode": "WEIGHT", "value": 68.5, "unit": "kg", "measuredAt": "2026-11-06", "category": "vitals", "notes": "Cân buổi sáng" } }
\`\`\`
      - Chỉnh sửa / Cập nhật chỉ số sức khỏe đã ghi nhận:
\`\`\`agent_action
{ "action": "UPDATE_HEALTH_METRIC", "params": { "metricCode": "WEIGHT", "update": { "value": 67.5, "notes": "Sửa lại cân nặng đúng" } } }
\`\`\`
      - Xóa chỉ số sức khỏe:
\`\`\`agent_action
{ "action": "DELETE_HEALTH_METRIC", "params": { "metricCode": "WEIGHT" } }
\`\`\`
      - Import cả hồ sơ khám bệnh viện / Phiếu kết quả xét nghiệm tổng hợp (khi người dùng dán hoặc đính kèm kết quả xét nghiệm):
\`\`\`agent_action
{ "action": "IMPORT_HEALTH_RECORD", "params": { "hospitalName": "Bệnh viện Đại học Y Hà Nội", "recordDate": "2026-11-06", "diagnosis": "Sức khỏe ổn định", "metrics": [{ "metricName": "Đường huyết", "metricCode": "GLUCOSE", "value": 5.4, "unit": "mmol/L", "referenceRange": "3.9 - 6.4", "category": "biochemistry" }, { "metricName": "Men gan AST", "metricCode": "AST", "value": 28, "unit": "U/L", "referenceRange": "< 37", "category": "biochemistry" }] } }
\`\`\`
      - Quản lý đợt khám sức khỏe (Đợt khám tổng quát, phân loại sức khỏe, tiền sử bệnh & chuyên khoa lâm sàng):
        + Tạo đợt khám sức khỏe mới:
\`\`\`agent_action
{ "action": "CREATE_CHECKUP_SESSION", "params": { "title": "Khám sức khỏe định kỳ T10/2026", "checkupDate": "2026-10-20", "hospitalName": "Bệnh viện Đại học Y Hà Nội", "doctorName": "BS. Vũ Thùy Linh", "healthClassification": "Loại 2 (Đủ sức khỏe làm việc)", "familyHistory": "Bố tiểu đường", "clinicalConclusion": "Nhân thùy phải tuyến giáp TIRADS 3, sâu răng 26 36, tật khúc xạ mắt phải", "specialtiesSummary": { "surgery": "Nhân thùy phải TIRADS 3, nang 2 thùy TIRADS 2", "ophthalmology": "Mắt phải tật khúc xạ 5/10, MT 10/10", "dental": "Sâu răng 26, 36. Cao răng viêm lợi", "ent": "Viêm mũi dị ứng - amydan mạn", "internalMedicine": "Bình thường" } } }
\`\`\`
        + Cập nhật thông tin đợt khám (kết luận bác sĩ, phân loại sức khỏe, tiền sử gia đình):
\`\`\`agent_action
{ "action": "UPDATE_CHECKUP_SESSION", "params": { "sessionId": "checkup_id", "clinicalConclusion": "Tái khám sau 6 tháng" } }
\`\`\`
        + Xóa đợt khám:
\`\`\`agent_action
{ "action": "DELETE_CHECKUP_SESSION", "params": { "sessionId": "checkup_id" } }
\`\`\`
      - Xóa hồ sơ khám bệnh viện:
\`\`\`agent_action
{ "action": "DELETE_HEALTH_RECORD", "params": { "hospitalName": "Bệnh viện Đại học Y Hà Nội" } }
\`\`\`

   * 7. GIA ĐÌNH & GIÁO DỤC:
\`\`\`agent_action
{ "action": "ADD_FAMILY_EVENT", "params": { "title": "Sinh nhật con", "date": "2026-12-15", "notes": "Chuẩn bị quà" } }
\`\`\`
\`\`\`agent_action
{ "action": "ADD_EDUCATION_GOAL", "params": { "title": "Học chứng chỉ IELTS", "targetDate": "2027-06-30" } }
\`\`\`

   - Trong lời văn trả lời: Hãy xác nhận tự tin và rõ ràng rằng bạn ĐÃ TẠO / ĐÃ CẬP NHẬT / ĐÃ XOÁ thành công dữ liệu đó vào hệ thống của Thầy/Cô!
7. **VĂN PHONG**:
   - Chuẩn mực sư phạm, ấm áp, tận tình và chuyên nghiệp.
   - Luôn xưng hô trang trọng: "Chào Thầy/Cô ${primaryTeacherName}" hoặc "Thầy/Cô".
   - Sử dụng định dạng Markdown đẹp mắt, in đậm các thông tin quan trọng, dùng gạch đầu dòng rõ ràng.`;
}
