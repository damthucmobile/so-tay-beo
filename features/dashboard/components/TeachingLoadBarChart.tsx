'use client';

import React, { useMemo } from 'react';
import { CalendarDays, Flame, CheckCircle2, Clock } from 'lucide-react';
import { SchoolTimetable, DayOfWeek } from '@/features/teaching-schedule/types';
import { ClassSessionEntity } from '@/features/class/types';

interface TeachingLoadBarChartProps {
  timetable: SchoolTimetable | null;
  myTeacher: string;
  sessions: ClassSessionEntity[];
  onNavigateTab: (tab: any) => void;
}

const DAYS: { id: DayOfWeek | 'CN'; label: string; fullLabel: string; dayIndex: number }[] = [
  { id: 'Hai', label: 'T2', fullLabel: 'Thứ Hai', dayIndex: 1 },
  { id: 'Ba', label: 'T3', fullLabel: 'Thứ Ba', dayIndex: 2 },
  { id: 'Tư', label: 'T4', fullLabel: 'Thứ Tư', dayIndex: 3 },
  { id: 'Năm', label: 'T5', fullLabel: 'Thứ Năm', dayIndex: 4 },
  { id: 'Sáu', label: 'T6', fullLabel: 'Thứ Sáu', dayIndex: 5 },
  { id: 'Bảy', label: 'T7', fullLabel: 'Thứ Bảy', dayIndex: 6 },
  { id: 'CN', label: 'CN', fullLabel: 'Chủ Nhật', dayIndex: 0 },
];

export const TeachingLoadBarChart: React.FC<TeachingLoadBarChartProps> = ({
  timetable,
  myTeacher,
  sessions,
  onNavigateTab,
}) => {
  // Lấy ngày hôm nay
  const todayDayIndex = new Date().getDay();

  // Tính số tiết/buổi dạy trong tuần theo từng thứ
  const weeklyLoad = useMemo(() => {
    const counts: Record<string, { school: number; extra: number; total: number }> = {
      Hai: { school: 0, extra: 0, total: 0 },
      Ba: { school: 0, extra: 0, total: 0 },
      Tư: { school: 0, extra: 0, total: 0 },
      Năm: { school: 0, extra: 0, total: 0 },
      Sáu: { school: 0, extra: 0, total: 0 },
      Bảy: { school: 0, extra: 0, total: 0 },
      CN: { school: 0, extra: 0, total: 0 },
    };

    // 1. Tiết dạy nhà trường từ thời khóa biểu
    if (timetable && timetable.entries) {
      timetable.entries.forEach((entry) => {
        if (!entry.dayOfWeek || !counts[entry.dayOfWeek]) return;
        if (myTeacher && myTeacher.trim()) {
          if (!entry.teacher.toLowerCase().includes(myTeacher.toLowerCase().trim())) return;
        }
        counts[entry.dayOfWeek].school += 1;
        counts[entry.dayOfWeek].total += 1;
      });
    }

    return DAYS.map((d) => ({
      ...d,
      isToday: d.dayIndex === todayDayIndex,
      school: counts[d.id]?.school || 0,
      extra: counts[d.id]?.extra || 0,
      total: counts[d.id]?.total || 0,
    }));
  }, [timetable, myTeacher, todayDayIndex]);

  // Tìm ngày có nhiều tiết nhất (Peak Day)
  const peakDay = useMemo(() => {
    let peak = weeklyLoad[0];
    weeklyLoad.forEach((d) => {
      if (d.total > peak.total) peak = d;
    });
    return peak.total > 0 ? peak : null;
  }, [weeklyLoad]);

  // Tổng số tiết trong tuần
  const totalWeeklyPeriods = useMemo(() => {
    return weeklyLoad.reduce((sum, d) => sum + d.total, 0);
  }, [weeklyLoad]);

  const maxVal = Math.max(5, ...weeklyLoad.map((d) => d.total));

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Mật Độ Giảng Dạy Tuần
              </h3>
              {peakDay && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-700/60">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>{peakDay.label} cao điểm ({peakDay.total} tiết)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Phân bổ số tiết dạy theo từng ngày trong tuần của giáo viên
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>Tổng cộng: <strong className="text-slate-900 dark:text-white font-mono text-sm">{totalWeeklyPeriods} tiết/tuần</strong></span>
        </div>
      </div>

      {/* Bar Chart Bars */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 py-4 items-end h-44">
        {weeklyLoad.map((day) => {
          const heightPercent = maxVal > 0 ? Math.round((day.total / maxVal) * 100) : 0;
          return (
            <div
              key={day.id}
              className="flex flex-col items-center justify-end h-full gap-2 group cursor-pointer"
              onClick={() => onNavigateTab('teaching_schedule')}
            >
              {/* Value badge */}
              <span
                className={`text-[11px] font-bold font-mono transition-transform group-hover:-translate-y-1 ${
                  day.isToday
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {day.total > 0 ? `${day.total}` : '-'}
              </span>

              {/* Bar container */}
              <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800/80 rounded-xl h-28 p-1 flex items-end justify-center relative">
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${
                    day.isToday
                      ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
                      : day.total >= 4
                      ? 'bg-gradient-to-t from-indigo-500 to-violet-500'
                      : day.total > 0
                      ? 'bg-gradient-to-t from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-500'
                      : 'bg-transparent'
                  }`}
                  style={{ height: `${Math.max(day.total > 0 ? 12 : 0, heightPercent)}%` }}
                />
              </div>

              {/* Day label */}
              <div className="flex flex-col items-center">
                <span
                  className={`text-xs font-bold ${
                    day.isToday
                      ? 'px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                >
                  {day.label}
                </span>
                {day.isToday && (
                  <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    Hôm nay
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Bấm vào từng cột để mở thời khóa biểu tương ứng</span>
        <button
          type="button"
          onClick={() => onNavigateTab('teaching_schedule')}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          Thời khóa biểu trường →
        </button>
      </div>
    </div>
  );
};
