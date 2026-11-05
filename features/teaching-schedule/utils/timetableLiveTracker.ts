import { DayOfWeek, DEFAULT_PERIOD_TIMES, Session, TimetableEntry, getEntryTime } from '../types';

export function getTodayDayOfWeekVietnamese(): DayOfWeek | null {
  const day = new Date().getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
  switch (day) {
    case 1:
      return 'Hai';
    case 2:
      return 'Ba';
    case 3:
      return 'Tư';
    case 4:
      return 'Năm';
    case 5:
      return 'Sáu';
    case 6:
      return 'Bảy';
    default:
      return null; // Chủ nhật không có lịch chính khóa
  }
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export interface LivePeriodStatus {
  isToday: boolean;
  todayDayOfWeek: DayOfWeek | null;
  activePeriod: {
    entry: TimetableEntry;
    session: Session;
    period: number;
    minutesLeft: number;
    startTime: string;
    endTime: string;
  } | null;
  nextPeriod: {
    entry: TimetableEntry;
    session: Session;
    period: number;
    startsInMinutes: number;
    startTime: string;
    endTime: string;
  } | null;
  dayState: 'in_class' | 'break' | 'before_class' | 'finished' | 'free_day' | 'weekend';
}

/**
 * Tính toán trạng thái dạy học theo thời gian thực (Real-time Live Tracker)
 */
export function calculateLiveScheduleStatus(
  todayEntries: TimetableEntry[],
  now: Date = new Date()
): LivePeriodStatus {
  const todayDayOfWeek = getTodayDayOfWeekVietnamese();

  if (!todayDayOfWeek) {
    return {
      isToday: false,
      todayDayOfWeek: null,
      activePeriod: null,
      nextPeriod: null,
      dayState: 'weekend',
    };
  }

  if (todayEntries.length === 0) {
    return {
      isToday: true,
      todayDayOfWeek,
      activePeriod: null,
      nextPeriod: null,
      dayState: 'free_day',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Tạo danh sách các tiết học kèm mốc phút bắt đầu và kết thúc
  const enrichedEntries = todayEntries
    .map((entry) => {
      const times = getEntryTime(entry);
      const startMin = timeToMinutes(times.start);
      const endMin = timeToMinutes(times.end);
      return {
        entry,
        times,
        startMin,
        endMin,
      };
    })
    .sort((a, b) => a.startMin - b.startMin);

  // 1. Kiểm tra xem có đang trong tiết nào không
  for (const item of enrichedEntries) {
    if (currentMinutes >= item.startMin && currentMinutes < item.endMin) {
      return {
        isToday: true,
        todayDayOfWeek,
        activePeriod: {
          entry: item.entry,
          session: item.entry.session,
          period: item.entry.period,
          minutesLeft: item.endMin - currentMinutes,
          startTime: item.times.start,
          endTime: item.times.end,
        },
        nextPeriod: null,
        dayState: 'in_class',
      };
    }
  }

  // 2. Nếu không trong tiết, tìm tiết tiếp theo trong ngày
  const upcoming = enrichedEntries.find((item) => item.startMin > currentMinutes);

  if (upcoming) {
    const startsInMinutes = upcoming.startMin - currentMinutes;
    const isFirstPeriod = currentMinutes < enrichedEntries[0].startMin;

    return {
      isToday: true,
      todayDayOfWeek,
      activePeriod: null,
      nextPeriod: {
        entry: upcoming.entry,
        session: upcoming.entry.session,
        period: upcoming.entry.period,
        startsInMinutes,
        startTime: upcoming.times.start,
        endTime: upcoming.times.end,
      },
      dayState: isFirstPeriod ? 'before_class' : 'break',
    };
  }

  // 3. Đã qua hết tất cả các tiết trong ngày
  return {
    isToday: true,
    todayDayOfWeek,
    activePeriod: null,
    nextPeriod: null,
    dayState: 'finished',
  };
}
