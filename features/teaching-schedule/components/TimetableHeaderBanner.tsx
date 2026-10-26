'use client';

import React from 'react';
import { School, Sparkles } from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';

export const TimetableHeaderBanner: React.FC = () => {
  const { timetable } = useTeachingScheduleStore();

  if (!timetable) return null;

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
      </div>
    </div>
  );
};
