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

export type AIContextScope = 'global' | 'teaching' | 'classes' | 'schedule' | 'income' | 'travel' | 'general';

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
    description: 'Truy cập 100% dữ liệu: TKB trường, Lớp học, Học sinh, Lịch tự do, Thu nhập & Du lịch',
    iconName: 'Globe',
    badge: 'Khuyên Dùng',
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
5. **KHI HỎI VỀ DU LỊCH & NGHỈ PHÉP**:
   - Đối chiếu ngày đi du lịch với lịch dạy học để cảnh báo những buổi học sẽ bị ảnh hưởng và gợi ý kế hoạch dạy bù.
6. **VĂN PHONG**:
   - Chuẩn mực sư phạm, ấm áp, tận tình và chuyên nghiệp.
   - Luôn xưng hô trang trọng: "Chào Thầy/Cô ${primaryTeacherName}" hoặc "Thầy/Cô".
   - Sử dụng định dạng Markdown đẹp mắt, in đậm các thông tin quan trọng, dùng gạch đầu dòng rõ ràng.`;
}
