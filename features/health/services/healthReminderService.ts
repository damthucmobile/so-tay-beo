// features/health/services/healthReminderService.ts
/**
 * HealthReminderService
 * Quản lý cấu hình nhắc nhở sức khỏe (uống nước & lịch tập thể chất)
 * Tích hợp đa nền tảng qua Firestore, LocalStorage và PushNotificationService
 */

import { HealthReminderSettings, DailyWaterLog, WorkoutPlan, HealthMetricValue } from '../types';
import { PushNotificationService } from '@/core/notifications';

export const DEFAULT_HEALTH_REMINDER_SETTINGS: HealthReminderSettings = {
  enabled: true,
  soundEnabled: true,
  waterReminder: {
    enabled: true,
    intervalMinutes: 60,
    startTime: '08:00',
    endTime: '21:00',
    cupSizeMl: 250,
    soundEnabled: true,
  },
  workoutReminder: {
    enabled: true,
    notifyMorningBrief: true,
    morningBriefTime: '07:00',
    notifyBeforeWorkout: true,
    preferredWorkoutTime: '17:30',
    minutesBefore: 15,
    soundEnabled: true,
  },
};

export class HealthReminderService {
  private static STORAGE_KEY = 'health_reminder_settings';
  private static LAST_NOTIFIED_KEY = 'health_reminder_last_dispatched';
  private static LAST_WATER_TIMESTAMP_KEY = 'health_last_water_dispatched_timestamp';

  /**
   * Lấy chuỗi ngày YYYY-MM-DD theo giờ địa phương
   */
  public static getLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Lưu cấu hình nhắc nhở lên LocalStorage & đồng bộ Firestore
   */
  public static async saveSettings(
    settings: HealthReminderSettings,
    userId?: string
  ): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      // Bắn sự kiện cập nhật tức thì để scheduler kiểm tra lại ngay
      window.dispatchEvent(new CustomEvent('app-health-settings-updated', { detail: settings }));
    }

    if (userId) {
      await PushNotificationService.saveSettings('health_reminders', userId, settings);
    }
  }

  /**
   * Lấy cấu hình nhắc nhở hiện tại
   */
  public static async getSettings(userId?: string): Promise<HealthReminderSettings> {
    let localData: HealthReminderSettings | null = null;
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
      const remote = await PushNotificationService.getSettings<HealthReminderSettings>('health_reminders', userId);
      if (remote) {
        return {
          ...DEFAULT_HEALTH_REMINDER_SETTINGS,
          ...remote,
          waterReminder: {
            ...DEFAULT_HEALTH_REMINDER_SETTINGS.waterReminder,
            ...(remote.waterReminder || {}),
          },
          workoutReminder: {
            ...DEFAULT_HEALTH_REMINDER_SETTINGS.workoutReminder,
            ...(remote.workoutReminder || {}),
          },
        };
      }
    }

    if (localData) {
      return {
        ...DEFAULT_HEALTH_REMINDER_SETTINGS,
        ...localData,
        waterReminder: {
          ...DEFAULT_HEALTH_REMINDER_SETTINGS.waterReminder,
          ...(localData.waterReminder || {}),
        },
        workoutReminder: {
          ...DEFAULT_HEALTH_REMINDER_SETTINGS.workoutReminder,
          ...(localData.workoutReminder || {}),
        },
      };
    }

    return DEFAULT_HEALTH_REMINDER_SETTINGS;
  }

  /**
   * Ghi nhận đã uống nước từ người dùng để reset mốc nhắc tiếp theo
   */
  public static recordWaterIntakeAction(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.LAST_WATER_TIMESTAMP_KEY, String(Date.now()));
  }

  /**
   * Kiểm tra và kích hoạt thông báo nhắc nhở tự động
   */
  public static checkAndTriggerReminders(params: {
    settings: HealthReminderSettings;
    waterLog: DailyWaterLog | null;
    workoutPlans: WorkoutPlan[];
    now?: Date;
  }): { triggered: boolean; type?: string; message?: string } {
    const { settings, waterLog, workoutPlans, now = new Date() } = params;

    if (!settings.enabled) {
      return { triggered: false };
    }

    if (typeof window === 'undefined') return { triggered: false };

    const todayDateStr = this.getLocalDateString(now);
    const nowTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const hasAlreadyNotified = (key: string): boolean => {
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
      try {
        const history = localStorage.getItem(this.LAST_NOTIFIED_KEY);
        const parsed = history ? JSON.parse(history) : {};
        parsed[key] = true;
        localStorage.setItem(this.LAST_NOTIFIED_KEY, JSON.stringify(parsed));
      } catch {
        // ignore
      }
    };

    // =========================================================================
    // 1. KIỂM TRA NHẮC UỐNG NƯỚC (DYNAMIC INTERVAL REMINDER)
    // =========================================================================
    if (settings.waterReminder.enabled) {
      const [startH, startM] = (settings.waterReminder.startTime || '08:00').split(':').map(Number);
      const [endH, endM] = (settings.waterReminder.endTime || '21:00').split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      const isInActiveHours = nowTotalMinutes >= startMinutes && nowTotalMinutes <= endMinutes;

      // Nếu trong khung giờ và chưa đạt mục tiêu nước hôm nay
      const consumed = waterLog?.amountMl || 0;
      const target = waterLog?.targetMl || 2000;
      const isGoalReached = target > 0 && consumed >= target;

      if (isInActiveHours && !isGoalReached) {
        const intervalMs = (settings.waterReminder.intervalMinutes || 60) * 60 * 1000;
        const lastWaterTimeStr = localStorage.getItem(this.LAST_WATER_TIMESTAMP_KEY);
        const lastWaterTime = lastWaterTimeStr ? parseInt(lastWaterTimeStr, 10) : 0;
        const timeSinceLastWater = Date.now() - lastWaterTime;

        if (timeSinceLastWater >= intervalMs) {
          // Cập nhật timestamp để không lặp lại
          localStorage.setItem(this.LAST_WATER_TIMESTAMP_KEY, String(Date.now()));

          const cupSize = settings.waterReminder.cupSizeMl || 250;
          PushNotificationService.showNotification({
            title: '💧 Đã đến giờ uống nước rồi!',
            body: `Hãy nạp thêm 1 cốc nước (~${cupSize}ml) để thanh lọc cơ thể. Hôm nay bạn đã uống ${consumed}/${target} ml.`,
            tag: `water_${todayDateStr}_${now.getHours()}`,
            url: '/?tab=health&subtab=nutrition',
            data: {
              url: '/?tab=health&subtab=nutrition',
              tab: 'health',
              subtab: 'nutrition',
              category: 'WATER',
            },
          });

          return { triggered: true, type: 'WATER', message: 'Đã nhắc uống nước' };
        }
      }
    }

    // =========================================================================
    // 2. KIỂM TRA NHẮC LỊCH TẬP THỂ CHẤT (WORKOUT SCHEDULE REMINDER)
    // =========================================================================
    if (settings.workoutReminder.enabled && workoutPlans.length > 0) {
      const activePlan = workoutPlans[0];
      // Thứ trong tuần: 0 = Thứ Hai, ..., 5 = Thứ Bảy, 6 = Chủ Nhật
      const dayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const todayPlan = activePlan?.days?.[dayIdx];

      // A. Bản tin tóm tắt buổi sáng (Morning Brief) - Cửa sổ 30 phút
      if (settings.workoutReminder.notifyMorningBrief && settings.workoutReminder.morningBriefTime) {
        const [bH, bM] = settings.workoutReminder.morningBriefTime.split(':').map(Number);
        const briefMinutes = bH * 60 + bM;
        const isMorningWindow = nowTotalMinutes >= briefMinutes && nowTotalMinutes <= briefMinutes + 30;

        if (isMorningWindow) {
          const morningKey = `workout_morning_${todayDateStr}_${settings.workoutReminder.morningBriefTime}`;
          if (!hasAlreadyNotified(morningKey)) {
            markAsNotified(morningKey);

            let body = '';
            let title = '🏋️ Lịch tập thể chất hôm nay';

            if (todayPlan?.isRestDay) {
              title = '🌿 Hôm nay là ngày nghỉ phục hồi!';
              body = `Bạn có một ngày phục hồi tích cực (${todayPlan.sessionTitle || 'Nghỉ ngơi giãn cơ'}). Hãy đi dạo nhẹ nhàng và ngủ đủ giấc nhé!`;
            } else if (todayPlan) {
              title = `🏋️ Lịch tập hôm nay: ${todayPlan.dayName}`;
              body = `Hôm nay: ${todayPlan.sessionTitle} (~${todayPlan.estimatedMinutes} phút, tiêu hao ~${todayPlan.estimatedCalories} kcal). Chúc bạn tập luyện đầy hứng khởi!`;
            } else {
              body = 'Hãy mở sổ tay để xem và theo dõi lộ trình tập luyện hôm nay của bạn nhé!';
            }

            PushNotificationService.showNotification({
              title,
              body,
              tag: morningKey,
              url: '/?tab=health&subtab=workouts',
              data: {
                url: '/?tab=health&subtab=workouts',
                tab: 'health',
                subtab: 'workouts',
                category: 'WORKOUT',
              },
            });

            return { triggered: true, type: 'WORKOUT_MORNING', message: 'Đã gửi bản tin lịch tập sáng' };
          }
        }
      }

      // B. Nhắc trước giờ tập (Pre-workout Reminder) - Cửa sổ 25 phút
      if (
        settings.workoutReminder.notifyBeforeWorkout &&
        settings.workoutReminder.preferredWorkoutTime &&
        todayPlan &&
        !todayPlan.isRestDay
      ) {
        const [wH, wM] = settings.workoutReminder.preferredWorkoutTime.split(':').map(Number);
        const targetMinutes = wH * 60 + wM - (settings.workoutReminder.minutesBefore || 15);
        const isBeforeWindow = nowTotalMinutes >= targetMinutes && nowTotalMinutes <= targetMinutes + 25;

        if (isBeforeWindow) {
          const beforeKey = `workout_before_${todayDateStr}_${settings.workoutReminder.preferredWorkoutTime}_${settings.workoutReminder.minutesBefore}`;
          if (!hasAlreadyNotified(beforeKey)) {
            markAsNotified(beforeKey);

            PushNotificationService.showNotification({
              title: `⏰ Sắp đến giờ tập luyện (${settings.workoutReminder.preferredWorkoutTime})`,
              body: `Còn ${settings.workoutReminder.minutesBefore} phút nữa là đến giờ tập "${todayPlan.sessionTitle}". Hãy chuẩn bị trang phục, uống 1 cốc nước ấm và khởi động kỹ!`,
              tag: beforeKey,
              url: '/?tab=health&subtab=workouts',
              data: {
                url: '/?tab=health&subtab=workouts',
                tab: 'health',
                subtab: 'workouts',
                category: 'WORKOUT',
              },
            });

            return { triggered: true, type: 'WORKOUT_PRE', message: 'Đã gửi nhắc nhở chuẩn bị tập' };
          }
        }
      }
    }

    return { triggered: false };
  }

  /**
   * Gửi thông báo thử nghiệm ngay lập tức để người dùng kiểm tra chuông & giao diện
   */
  public static async sendTestNotification(type: 'WATER' | 'WORKOUT'): Promise<void> {
    if (type === 'WATER') {
      await PushNotificationService.showNotification({
        title: '💧 [Thử Nghiệm] Đã đến giờ uống nước!',
        body: 'Đây là thông báo mẫu nhắc nhở uống nước định kỳ từ Sổ Tay Béo. Hãy bổ sung 1 cốc nước ấm (~250ml) nhé!',
        tag: `test_water_${Date.now()}`,
        url: '/?tab=health&subtab=nutrition',
        data: {
          url: '/?tab=health&subtab=nutrition',
          tab: 'health',
          subtab: 'nutrition',
          category: 'WATER',
        },
      });
    } else {
      await PushNotificationService.showNotification({
        title: '🏋️ [Thử Nghiệm] Nhắc nhở lịch tập thể chất!',
        body: 'Đây là thông báo mẫu nhắc chuẩn bị tập luyện. Buổi tập: Kháng Lực Thân Trên & Cardio Zone 2 (45 phút, ~270 kcal).',
        tag: `test_workout_${Date.now()}`,
        url: '/?tab=health&subtab=workouts',
        data: {
          url: '/?tab=health&subtab=workouts',
          tab: 'health',
          subtab: 'workouts',
          category: 'WORKOUT',
        },
      });
    }
  }
}
