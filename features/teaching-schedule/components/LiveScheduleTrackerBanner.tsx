'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock,
  Sparkles,
  Coffee,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  GraduationCap,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { TimetableEntry } from '../types';
import { calculateLiveScheduleStatus, LivePeriodStatus } from '../utils/timetableLiveTracker';
import { getSubjectTheme } from '../utils/subjectColors';

interface LiveScheduleTrackerBannerProps {
  todayEntries: TimetableEntry[];
  teacherName?: string;
  onSelectClass?: (className: string) => void;
}

export const LiveScheduleTrackerBanner: React.FC<LiveScheduleTrackerBannerProps> = ({
  todayEntries,
  teacherName,
  onSelectClass,
}) => {
  const [status, setStatus] = useState<LivePeriodStatus>(() =>
    calculateLiveScheduleStatus(todayEntries)
  );

  // Cập nhật trạng thái đếm ngược mỗi 30 giây
  useEffect(() => {
    setStatus(calculateLiveScheduleStatus(todayEntries));
    const timer = setInterval(() => {
      setStatus(calculateLiveScheduleStatus(todayEntries));
    }, 30000);
    return () => clearInterval(timer);
  }, [todayEntries]);

  // Nếu là cuối tuần hoặc ngày trống và không có tiết
  if (status.dayState === 'weekend') {
    return null;
  }

  if (status.dayState === 'free_day') {
    return (
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-100">
              Hôm nay ({status.todayDayOfWeek ? `Thứ ${status.todayDayOfWeek}` : 'Hôm nay'}): Thầy/Cô không có tiết lên lớp
            </span>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              Thư thả chấm bài, nghiên cứu tài liệu hoặc nghỉ ngơi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 1. Đang trong giờ dạy (In Class)
  if (status.dayState === 'in_class' && status.activePeriod) {
    const { activePeriod } = status;
    const theme = getSubjectTheme(activePeriod.entry.subject);

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border-2 border-emerald-500/40 dark:border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 shadow-sm animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-md shadow-emerald-600/30">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-emerald-400 opacity-30" />
              <Flame className="w-5 h-5 relative z-10" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Đang trong tiết dạy
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activePeriod.session} • Tiết {activePeriod.period} ({activePeriod.startTime} - {activePeriod.endTime})
                </span>
              </div>

              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  Môn {activePeriod.entry.subject}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Lớp {activePeriod.entry.className}
                </span>
                {activePeriod.entry.room && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Phòng {activePeriod.entry.room})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800">
            <div className="text-left sm:text-right">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center sm:justify-end gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Thời gian còn lại
              </div>
              <span className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                ~ {activePeriod.minutesLeft} phút
              </span>
            </div>

            {onSelectClass && (
              <button
                onClick={() => onSelectClass(activePeriod.entry.className)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs transition cursor-pointer shrink-0"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                <span>Xem Lớp</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Đang giờ giải lao giữa 2 tiết (Break time)
  if (status.dayState === 'break' && status.nextPeriod) {
    const { nextPeriod } = status;

    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/10 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-3 sm:p-3.5 shadow-sm animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wide">
                  Giờ giải lao
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Tiết tiếp theo: <strong className="font-semibold text-slate-900 dark:text-white">Tiết {nextPeriod.period} ({nextPeriod.entry.subject} - Lớp {nextPeriod.entry.className})</strong>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Vào lớp lúc <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">{nextPeriod.startTime}</span> (còn khoảng {nextPeriod.startsInMinutes} phút)
              </p>
            </div>
          </div>

          {onSelectClass && (
            <button
              onClick={() => onSelectClass(nextPeriod.entry.className)}
              className="inline-flex items-center gap-1 self-end sm:self-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              <span>Lớp {nextPeriod.entry.className}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Chuẩn bị lên lớp buổi sáng hoặc buổi chiều (Before class)
  if (status.dayState === 'before_class' && status.nextPeriod) {
    const { nextPeriod } = status;

    return (
      <div className="bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-800/50 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-blue-900 dark:text-blue-100 truncate">
              Hôm nay Thầy/Cô có {todayEntries.length} tiết lên lớp ({status.todayDayOfWeek ? `Thứ ${status.todayDayOfWeek}` : ''})
            </p>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 truncate">
              Tiết đầu tiên: Tiết {nextPeriod.period} ({nextPeriod.entry.subject} - Lớp {nextPeriod.entry.className}) lúc {nextPeriod.startTime}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Đã hoàn thành tất cả tiết hôm nay (Finished)
  if (status.dayState === 'finished') {
    return (
      <div className="bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Đã hoàn thành toàn bộ {todayEntries.length} tiết dạy hôm nay!
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chúc Thầy/Cô có một buổi tối ấm áp, thư thái bên gia đình.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
