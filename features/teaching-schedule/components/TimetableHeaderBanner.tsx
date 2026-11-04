'use client';

import React from 'react';
import { School, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';

interface TimetableHeaderBannerProps {
  onOpenReminder?: () => void;
}

export const TimetableHeaderBanner: React.FC<TimetableHeaderBannerProps> = () => {
  const { timetable, isCompactView, toggleCompactView } = useTeachingScheduleStore();

  if (!timetable) return null;

  if (isCompactView) {
    return (
      <div className="hidden sm:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xs items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <School className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-xs">
              {timetable.schoolName}
            </span>
            {timetable.description && (
              <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                {timetable.description}
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              {timetable.title} • {timetable.totalEntries} tiết học
            </span>
          </div>
        </div>

        <button
          onClick={toggleCompactView}
          className="text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1 shrink-0 cursor-pointer transition"
          title="Mở rộng xem chi tiết"
        >
          <span className="hidden sm:inline">Chi tiết</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {timetable.schoolName}
              </h2>

              {timetable.description && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  {timetable.description}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {timetable.title} • {timetable.subOrg} • {timetable.totalEntries} tiết học
            </p>
          </div>
        </div>

        <button
          onClick={toggleCompactView}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition cursor-pointer shrink-0"
          title="Thu gọn thông tin trường học"
        >
          <span>Thu gọn</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

