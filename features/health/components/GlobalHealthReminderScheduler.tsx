'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/core/firebase';
import { HealthReminderService } from '../services/healthReminderService';
import { NutritionService } from '../services/nutritionService';
import { WorkoutService } from '../services/workoutService';

/**
 * GlobalHealthReminderScheduler
 * Chạy ngầm toàn ứng dụng (kể cả khi người dùng đang ở tab khác hoặc thu nhỏ trình duyệt).
 * Tự động kiểm tra và đẩy chuông / thông báo nhắc nhở uống nước và lịch tập mỗi 30 giây.
 */
export const GlobalHealthReminderScheduler: React.FC = () => {
  const { user } = useAuth();
  const isCheckingRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const executeCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const settings = await HealthReminderService.getSettings(user?.uid);
        if (!settings?.enabled) return;

        const todayStr = HealthReminderService.getLocalDateString();
        const nutCache = NutritionService.getLocalCache();
        const workCache = WorkoutService.getLocalCache();

        const waterLog = nutCache.waterLogs[todayStr] || null;
        const workoutPlans = workCache.plans || [];

        HealthReminderService.checkAndTriggerReminders({
          settings,
          waterLog,
          workoutPlans,
        });
      } catch (err) {
        console.warn('[GlobalHealthReminderScheduler] Lỗi kiểm tra lịch nhắc sức khỏe:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // 1. Kiểm tra ngay khi khởi tạo
    executeCheck();

    // 2. Định kỳ lặp lại mỗi 30 giây
    timer = setInterval(executeCheck, 30000);

    // 3. Lắng nghe sự kiện cập nhật cấu hình tức thì
    const handleSettingsUpdated = () => {
      executeCheck();
    };

    window.addEventListener('app-health-settings-updated', handleSettingsUpdated);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('app-health-settings-updated', handleSettingsUpdated);
    };
  }, [user?.uid]);

  return null;
};
