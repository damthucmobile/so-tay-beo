// features/teaching-schedule/services/teachingReminderService.ts
/**
 * Dịch vụ lập lịch và kích hoạt thông báo nhắc lịch dạy học (Web Push / Local Push)
 */

import { SchoolTimetable, TimetableEntry, DayOfWeek, TeachingReminderSettings, DEFAULT_PERIOD_TIMES } from '../types';
import { PushNotificationService, PushNotificationPayload } from '@/core/notifications';

export const DEFAULT_TEACHING_REMINDER_SETTINGS: TeachingReminderSettings = {
  enabled: false,
  selectedTeacher: '',
  notifyMorningBrief: true,
  morningBriefTime: '06:45',
  notifyEveningBrief: true,
  eveningBriefTime: '20:00',
  notifyBeforePeriod: true,
  minutesBeforePeriod: 15,
  zalo: {
    enabled: false,
    phoneNumber: '',
    zaloUserId: '',
    status: 'disabled',
    testMode: true,
  },
};

const DAY_MAP: Record<number, DayOfWeek | null> = {
  1: 'Hai',
  2: 'Ba',
  3: 'Tư',
  4: 'Năm',
  5: 'Sáu',
  6: 'Bảy',
  0: null, // Chủ nhật
};

export class TeachingReminderService {
  private static STORAGE_KEY = 'teaching_schedule_reminder_settings';
  private static LAST_NOTIFIED_KEY = 'teaching_reminder_last_dispatched';

  /**
   * Lấy chuỗi ngày YYYY-MM-DD theo giờ địa phương (tránh sai lệch múi giờ UTC)
   */
  public static getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Xóa bộ nhớ đệm các thông báo đã gửi trong ngày hôm nay khi người dùng đổi giờ hoặc lưu cài đặt mới
   */
  public static clearDispatchedForToday(): void {
    if (typeof window === 'undefined') return;
    try {
      const todayDateStr = this.getLocalDateString();
      const history = localStorage.getItem(this.LAST_NOTIFIED_KEY);
      if (!history) return;
      const parsed = JSON.parse(history);
      const newHistory: Record<string, boolean> = {};
      for (const key of Object.keys(parsed)) {
        // Nếu không thuộc ngày hôm nay, hoặc là key nhắc tiết cũ thì giữ lại
        if (!key.includes(todayDateStr) || key.startsWith('period_')) {
          newHistory[key] = parsed[key];
        }
      }
      localStorage.setItem(this.LAST_NOTIFIED_KEY, JSON.stringify(newHistory));
    } catch {
      // ignore
    }
  }

  /**
   * Lưu cài đặt nhắc nhở
   */
  public static async saveSettings(
    settings: TeachingReminderSettings,
    userId?: string
  ): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      // Tự động làm mới cache thông báo trong ngày khi người dùng đổi giờ/cài đặt
      this.clearDispatchedForToday();
    }

    if (userId) {
      await PushNotificationService.saveSettings('teaching_schedule', userId, settings);
    }
  }

  /**
   * Lấy cài đặt nhắc nhở hiện tại
   */
  public static async getSettings(userId?: string): Promise<TeachingReminderSettings> {
    let localData: TeachingReminderSettings | null = null;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          localData = JSON.parse(stored);
        } catch {
          // ignore error
        }
      }
    }

    if (userId) {
      const remote = await PushNotificationService.getSettings<TeachingReminderSettings>('teaching_schedule', userId);
      if (remote) {
        return { ...DEFAULT_TEACHING_REMINDER_SETTINGS, ...remote };
      }
    }

    return localData || DEFAULT_TEACHING_REMINDER_SETTINGS;
  }

  /**
   * Lấy các tiết dạy của giáo viên theo ngày trong tuần
   */
  public static getTeacherEntriesForDay(
    timetable: SchoolTimetable | null,
    teacherName: string,
    day: DayOfWeek
  ): TimetableEntry[] {
    if (!timetable || !teacherName) return [];
    return timetable.entries
      .filter((e) => e.teacher === teacherName && e.dayOfWeek === day)
      .sort((a, b) => {
        if (a.session !== b.session) {
          return a.session === 'Sáng' ? -1 : 1;
        }
        return a.period - b.period;
      });
  }

  /**
   * Lấy giờ vào tiết chuẩn theo định dạng HH:mm
   */
  public static getPeriodStartTime(session: 'Sáng' | 'Chiều', period: number): string {
    return DEFAULT_PERIOD_TIMES[session]?.[period]?.start || '07:30';
  }

  /**
   * Tính toán và phát hiện các thông báo cần kích hoạt tại thời điểm hiện tại
   */
  public static checkAndTriggerReminders(
    timetable: SchoolTimetable | null,
    settings: TeachingReminderSettings,
    now: Date = new Date()
  ): { triggered: boolean; message?: string } {
    if (!settings.enabled || !settings.selectedTeacher || !timetable) {
      return { triggered: false };
    }

    const currentDayOfWeekIdx = now.getDay(); // 0 is Sunday, 1 is Monday...
    const currentDayOfWeek = DAY_MAP[currentDayOfWeekIdx];
    const todayEntries = currentDayOfWeek ? this.getTeacherEntriesForDay(timetable, settings.selectedTeacher, currentDayOfWeek) : [];

    const todayDateStr = this.getLocalDateString(now);

    // Helper kiểm tra đã gửi thông báo hay chưa
    const hasAlreadyNotified = (key: string): boolean => {
      if (typeof window === 'undefined') return false;
      const history = localStorage.getItem(this.LAST_NOTIFIED_KEY);
      if (!history) return false;
      try {
        const parsed = JSON.parse(history);
        return parsed[key] === true;
      } catch {
        return false;
      }
    };

    const markAsNotified = (key: string) => {
      if (typeof window === 'undefined') return;
      try {
        const history = localStorage.getItem(this.LAST_NOTIFIED_KEY);
        const parsed = history ? JSON.parse(history) : {};
        parsed[key] = true;
        localStorage.setItem(this.LAST_NOTIFIED_KEY, JSON.stringify(parsed));
      } catch {
        // ignore
      }
    };

    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Kiểm tra bản tin sáng (Morning Brief) - Cửa sổ 30 phút tính từ giờ hẹn
    if (settings.notifyMorningBrief && settings.morningBriefTime) {
      const [mH, mM] = settings.morningBriefTime.split(':').map(Number);
      const morningMinutes = mH * 60 + mM;
      const isMorningWindow = nowTotalMinutes >= morningMinutes && nowTotalMinutes <= morningMinutes + 30;

      if (isMorningWindow) {
        // Key gắn liền với mốc thời gian đã cài để khi đổi giờ vẫn thông báo được
        const briefKey = `morning_${settings.selectedTeacher}_${todayDateStr}_${settings.morningBriefTime}`;
        if (!hasAlreadyNotified(briefKey)) {
          markAsNotified(briefKey);

          const periodCount = todayEntries.length;
          let body = '';
          if (periodCount === 0) {
            body = `Chào Thầy/Cô ${settings.selectedTeacher}! Hôm nay Thầy/Cô không có tiết dạy nào. Chúc một ngày làm việc tràn đầy năng lượng!`;
          } else {
            const detail = todayEntries.map(e => `${e.session} T${e.period}: ${e.className} (${e.subject})`).join(', ');
            body = `Hôm nay Thầy/Cô có ${periodCount} tiết dạy: ${detail}. Chúc Thầy/Cô có ngày giảng dạy hiệu quả!`;
          }

          PushNotificationService.showNotification({
            title: `🌅 Lịch dạy hôm nay: ${settings.selectedTeacher}`,
            body,
            tag: briefKey,
            url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
            data: {
              url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
              tab: 'teaching_schedule',
              teacher: settings.selectedTeacher,
            },
          });

          return { triggered: true, message: 'Đã gửi bản tin lịch dạy sáng' };
        }
      }
    }

    // 2. Kiểm tra bản tin tối (Evening Brief) - báo lịch ngày mai - Cửa sổ 45 phút
    if (settings.notifyEveningBrief && settings.eveningBriefTime) {
      const [eH, eM] = settings.eveningBriefTime.split(':').map(Number);
      const eveningMinutes = eH * 60 + eM;
      const isEveningWindow = nowTotalMinutes >= eveningMinutes && nowTotalMinutes <= eveningMinutes + 45;

      if (isEveningWindow) {
        // Tính ngày mai theo múi giờ địa phương
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const tomorrowDayOfWeek = DAY_MAP[tomorrow.getDay()];
        const tomorrowEntries = tomorrowDayOfWeek ? this.getTeacherEntriesForDay(timetable, settings.selectedTeacher, tomorrowDayOfWeek) : [];
        const eveningKey = `evening_${settings.selectedTeacher}_${todayDateStr}_${settings.eveningBriefTime}`;

        if (!hasAlreadyNotified(eveningKey)) {
          markAsNotified(eveningKey);

          const periodCount = tomorrowEntries.length;
          let body = '';
          if (periodCount === 0) {
            body = `Ngày mai (${tomorrowDayOfWeek ? 'Thứ ' + tomorrowDayOfWeek : 'Chủ nhật'}) Thầy/Cô không có tiết dạy nào. Chúc Thầy/Cô nghỉ ngơi thư giãn!`;
          } else {
            const detail = tomorrowEntries.map(e => `${e.session} T${e.period}: ${e.className} (${e.subject})`).join(', ');
            body = `Ngày mai (${tomorrowDayOfWeek}) Thầy/Cô có ${periodCount} tiết: ${detail}. Thầy/Cô nhớ chuẩn bị giáo án nhé!`;
          }

          PushNotificationService.showNotification({
            title: `🌙 Chuẩn bị lịch dạy ngày mai: ${settings.selectedTeacher}`,
            body,
            tag: eveningKey,
            url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
            data: {
              url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
              tab: 'teaching_schedule',
              teacher: settings.selectedTeacher,
            },
          });

          return { triggered: true, message: 'Đã gửi bản tin lịch dạy tối' };
        }
      }
    }

    // 3. Kiểm tra nhắc nhở trước giờ vào từng tiết (cửa sổ an toàn 2 phút)
    if (settings.notifyBeforePeriod && todayEntries.length > 0) {
      for (const entry of todayEntries) {
        const startTime = this.getPeriodStartTime(entry.session, entry.period);
        const [h, m] = startTime.split(':').map(Number);
        const periodTotalMinutes = h * 60 + m;

        // Số phút trước khi vào tiết
        const diffMinutes = periodTotalMinutes - nowTotalMinutes;

        // Cửa sổ kích hoạt: đúng số phút cài đặt (hoặc trong khoảng sai lệch 1-2 phút)
        if (diffMinutes > 0 && diffMinutes <= settings.minutesBeforePeriod && diffMinutes >= settings.minutesBeforePeriod - 2) {
          const periodKey = `period_${settings.selectedTeacher}_${todayDateStr}_${entry.session}_${entry.period}`;
          if (!hasAlreadyNotified(periodKey)) {
            markAsNotified(periodKey);

            PushNotificationService.showNotification({
              title: `⏰ Sắp đến giờ vào tiết (${entry.session} - Tiết ${entry.period})!`,
              body: `Thầy/Cô ${settings.selectedTeacher} có tiết dạy lớp ${entry.className} (Môn: ${entry.subject}) lúc ${startTime} (${diffMinutes} phút nữa).`,
              tag: periodKey,
              url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
              data: {
                url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(settings.selectedTeacher)}`,
                tab: 'teaching_schedule',
                teacher: settings.selectedTeacher,
                session: entry.session,
                period: entry.period,
              },
            });

            return { triggered: true, message: `Đã nhắc trước tiết ${entry.period} lớp ${entry.className}` };
          }
        }
      }
    }

    return { triggered: false };
  }
}
