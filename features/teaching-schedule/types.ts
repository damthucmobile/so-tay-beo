// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU PHÂN HỆ LỊCH DẠY HỌC (THỜI KHÓA BIỂU NHÀ TRƯỜNG)
// ==============================================================================

export type DayOfWeek = 'Hai' | 'Ba' | 'Tư' | 'Năm' | 'Sáu' | 'Bảy';
export type Session = 'Sáng' | 'Chiều';

export const DAYS_OF_WEEK: { id: DayOfWeek; label: string; short: string; dayIndex: number }[] = [
  { id: 'Hai', label: 'Thứ Hai', short: 'T2', dayIndex: 1 },
  { id: 'Ba', label: 'Thứ Ba', short: 'T3', dayIndex: 2 },
  { id: 'Tư', label: 'Thứ Tư', short: 'T4', dayIndex: 3 },
  { id: 'Năm', label: 'Thứ Năm', short: 'T5', dayIndex: 4 },
  { id: 'Sáu', label: 'Thứ Sáu', short: 'T6', dayIndex: 5 },
];

export interface PeriodTimeConfig {
  session: Session;
  period: number;
  startTime: string;
  endTime: string;
}

export const DEFAULT_PERIOD_TIMES: Record<Session, Record<number, { start: string; end: string }>> = {
  Sáng: {
    1: { start: '07:15', end: '08:00' },
    2: { start: '08:05', end: '08:50' },
    3: { start: '09:10', end: '09:55' },
    4: { start: '10:00', end: '10:45' },
    5: { start: '10:50', end: '11:35' },
  },
  Chiều: {
    1: { start: '13:30', end: '14:15' },
    2: { start: '14:20', end: '15:05' },
    3: { start: '15:15', end: '16:00' },
    4: { start: '16:05', end: '16:50' },
    5: { start: '16:55', end: '17:40' },
  },
};

export interface TimetableEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  session: Session;
  period: number;
  className: string;
  subject: string;
  teacher: string;
  room?: string;
  note?: string;
}

export interface SchoolTimetable {
  id: string;
  userId?: string;
  subOrg?: string;
  schoolName: string;
  title: string;
  description?: string;
  fileName?: string;
  classes: string[];
  teachers: string[];
  subjects: string[];
  entries: TimetableEntry[];
  totalEntries: number;
  importedAt: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export type TeachingScheduleViewMode = 'teacher' | 'class' | 'matrix';

export interface TeacherDayStats {
  totalPeriods: number;
  morningPeriods: number;
  afternoonPeriods: number;
  classes: string[];
}
