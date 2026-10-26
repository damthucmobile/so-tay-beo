import {
  ClassEntity,
  ClassStudentEntity,
  ClassSessionEntity,
  ClassMonthlyMetrics,
  TimeSliceBreakdown,
} from '../types';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

/**
 * Lấy danh sách Học sinh đang học (Active) tại đúng mốc thời gian dateStr ('YYYY-MM-DD')
 * Quy tắc cốt lõi:
 * - Ngày vào học joinedDate <= dateStr
 * - Nếu học sinh đã nghỉ (DROPPED), ngày nghỉ droppedDate phải > dateStr
 */
export function getActiveStudentsOnDate(
  students: ClassStudentEntity[],
  dateStr: string
): ClassStudentEntity[] {
  return students.filter((st) => {
    // 1. Kiểm tra ngày vào học
    if (st.joinedDate && st.joinedDate > dateStr) {
      return false;
    }

    // 2. Kiểm tra trạng thái nghỉ hẳn
    if (st.status === 'DROPPED') {
      if (!st.droppedDate) {
        return false;
      }
      if (st.droppedDate <= dateStr) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Tính thù lao cho 1 buổi học theo đơn giá cố định + (sỹ số x đơn giá trên đầu học sinh)
 */
export function calculateSessionSalary(
  baseFeePerSession: number,
  ratePerStudent: number,
  headcount: number
): number {
  const base = Number(baseFeePerSession) || 0;
  const rate = Number(ratePerStudent) || 0;
  return base + headcount * rate;
}

/**
 * Tính toán các chỉ số KPI theo tháng của lớp học
 */
export function calculateClassMonthlyMetrics(
  classItem: ClassEntity,
  students: ClassStudentEntity[],
  sessions: ClassSessionEntity[],
  targetMonthStr: string // Định dạng 'YYYY-MM'
): ClassMonthlyMetrics {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const startOfMonthStr = `${targetMonthStr}-01`;

  // Filter các buổi học trong tháng mục tiêu
  const monthlySessions = sessions.filter((s) => s.sessionDate.startsWith(targetMonthStr));
  const completedSessions = monthlySessions.filter((s) => s.status === 'COMPLETED');
  const scheduledSessions = monthlySessions.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'SCHEDULED'
  );

  // Sỹ số hiện tại & Sỹ số đầu tháng
  const currentActive = getActiveStudentsOnDate(students, todayStr).length;
  const startOfMonthActive = getActiveStudentsOnDate(students, startOfMonthStr).length;

  const diff = currentActive - startOfMonthActive;
  let trendType: 'INCREASED' | 'DECREASED' | 'UNCHANGED' = 'UNCHANGED';
  let trendPercent = 0;

  if (diff > 0) {
    trendType = 'INCREASED';
    trendPercent = startOfMonthActive > 0 ? Math.round((diff / startOfMonthActive) * 100) : 100;
  } else if (diff < 0) {
    trendType = 'DECREASED';
    trendPercent = startOfMonthActive > 0 ? Math.round((Math.abs(diff) / startOfMonthActive) * 100) : 100;
  }

  // Thù lao tích lũy các Số buổi học Hoàn thành (COMPLETED)
  const accumulatedSalaryToDate = completedSessions.reduce((sum, s) => {
    const headcount = getActiveStudentsOnDate(students, s.sessionDate).length;
    return sum + calculateSessionSalary(classItem.baseFeePerSession, classItem.ratePerStudent, headcount);
  }, 0);

  // Thù lao dự kiến trọn tháng (bao gồm cả các buổi SCHEDULED)
  const projectedMonthlySalary = scheduledSessions.reduce((sum, s) => {
    const headcount = getActiveStudentsOnDate(students, s.sessionDate).length;
    return sum + calculateSessionSalary(classItem.baseFeePerSession, classItem.ratePerStudent, headcount);
  }, 0);

  return {
    activeHeadcount: currentActive,
    startOfMonthHeadcount: startOfMonthActive,
    trendType,
    trendDiff: diff,
    trendPercent,
    completedSessionsCount: completedSessions.length,
    totalSessionsInMonth: monthlySessions.length,
    accumulatedSalaryToDate,
    projectedMonthlySalary,
  };
}

/**
 * Phân đoạn thời gian theo biến động sỹ số trong tháng để tạo Bảng Giải trình Đối soát
 */
export function generateTimeSliceBreakdowns(
  classItem: ClassEntity,
  students: ClassStudentEntity[],
  sessions: ClassSessionEntity[],
  targetMonthStr: string // Format 'YYYY-MM'
): TimeSliceBreakdown[] {
  const monthDate = parseISO(`${targetMonthStr}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const slices: TimeSliceBreakdown[] = [];
  let currentSlice: {
    startDate: string;
    endDate: string;
    headcount: number;
    students: ClassStudentEntity[];
  } | null = null;

  for (const day of daysInMonth) {
    const dayStr = format(day, 'yyyy-MM-dd');
    const activeSts = getActiveStudentsOnDate(students, dayStr);
    const count = activeSts.length;

    if (!currentSlice) {
      currentSlice = {
        startDate: dayStr,
        endDate: dayStr,
        headcount: count,
        students: activeSts,
      };
    } else if (currentSlice.headcount === count) {
      // Cùng sỹ số -> Kéo dài phân đoạn
      currentSlice.endDate = dayStr;
    } else {
      // Sỹ số thay đổi -> Đóng phân đoạn cũ và mở phân đoạn mới
      slices.push(createSliceRecord(classItem, currentSlice, sessions, students));
      currentSlice = {
        startDate: dayStr,
        endDate: dayStr,
        headcount: count,
        students: activeSts,
      };
    }
  }

  if (currentSlice) {
    slices.push(createSliceRecord(classItem, currentSlice, sessions, students));
  }

  return slices;
}

function createSliceRecord(
  classItem: ClassEntity,
  slice: { startDate: string; endDate: string; headcount: number; students: ClassStudentEntity[] },
  sessions: ClassSessionEntity[],
  allStudents: ClassStudentEntity[]
): TimeSliceBreakdown {
  // Tìm các buổi COMPLETED trong phân đoạn này
  const sliceSessions = sessions.filter(
    (s) =>
      s.status === 'COMPLETED' &&
      s.sessionDate >= slice.startDate &&
      s.sessionDate <= slice.endDate
  );

  const totalSalary = sliceSessions.reduce((sum, s) => {
    const headcount = getActiveStudentsOnDate(allStudents, s.sessionDate).length;
    return sum + calculateSessionSalary(classItem.baseFeePerSession, classItem.ratePerStudent, headcount);
  }, 0);

  const baseStr = classItem.baseFeePerSession
    ? `${classItem.baseFeePerSession.toLocaleString('vi-VN')}đ cố định`
    : '';
  const studentRateStr = classItem.ratePerStudent
    ? `${classItem.ratePerStudent.toLocaleString('vi-VN')}đ/HS`
    : '';
  const rateDesc = [baseStr, studentRateStr].filter(Boolean).join(' + ');

  return {
    startDate: slice.startDate,
    endDate: slice.endDate,
    headcount: slice.headcount,
    sessionCount: sliceSessions.length,
    rateDescription: rateDesc || 'Cố định',
    totalSalary,
    studentsInSlice: slice.students,
  };
}
