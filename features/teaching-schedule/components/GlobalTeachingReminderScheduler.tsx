'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/core/firebase';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { TeachingReminderService } from '../services/teachingReminderService';

/**
 * GlobalTeachingReminderScheduler
 * Chạy ngầm toàn ứng dụng (dù người dùng đang ở bất kỳ tab nào hoặc thu nhỏ cửa sổ).
 * Tự động kiểm tra và đẩy thông báo/chuông nhắc nhở thời khóa biểu mỗi 30-60 giây.
 */
export const GlobalTeachingReminderScheduler: React.FC = () => {
  const { user } = useAuth();
  const { timetable, initStore } = useTeachingScheduleStore();
  const isCheckingRef = useRef(false);

  // Đảm bảo dữ liệu thời khóa biểu được khởi tạo ngầm từ local storage nếu người dùng chưa vào tab TKB
  useEffect(() => {
    if (!timetable && typeof window !== 'undefined') {
      const unsub = initStore(user?.uid);
      return () => {
        if (typeof unsub === 'function') {
          unsub();
        }
      };
    }
  }, [timetable, user?.uid, initStore]);

  // Bộ lập lịch chạy ngầm chu kỳ và kích hoạt tức thì khi cập nhật cài đặt
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const executeCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // Lấy thời khóa biểu hiện tại (ưu tiên store hoặc fallback localStorage)
        let activeTimetable = timetable;
        if (!activeTimetable && typeof window !== 'undefined') {
          const cached = localStorage.getItem('so_tay_beo_current_timetable');
          if (cached) {
            try {
              activeTimetable = JSON.parse(cached);
            } catch {
              // ignore
            }
          }
        }

        if (!activeTimetable) return;

        const settings = await TeachingReminderService.getSettings(user?.uid);
        if (settings?.enabled) {
          TeachingReminderService.checkAndTriggerReminders(activeTimetable, settings);
        }
      } catch (err) {
        console.warn('[GlobalTeachingReminderScheduler] Lỗi khi kiểm tra lịch nhắc nhở:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // 1. Kiểm tra ngay lập tức khi khởi tạo
    executeCheck();

    // 2. Định kỳ lặp lại mỗi 30 giây để bắt chuẩn xác từng phút của giờ nhắc
    timer = setInterval(executeCheck, 30000);

    // 3. Lắng nghe sự kiện cập nhật cài đặt nhắc nhở để kiểm tra ngay lập tức mà không phải chờ interval
    const handleSettingsUpdated = () => {
      executeCheck();
    };

    window.addEventListener('app-teaching-settings-updated', handleSettingsUpdated);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('app-teaching-settings-updated', handleSettingsUpdated);
    };
  }, [timetable, user?.uid]);

  return null;
};
