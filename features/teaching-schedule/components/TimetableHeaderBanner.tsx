'use client';

import React from 'react';
import {
  School,
  FileSpreadsheet,
  Upload,
  UserCheck,
  GraduationCap,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { TeachingScheduleViewMode } from '../types';

export const TimetableHeaderBanner: React.FC = () => {
  const { timetable, viewMode, setViewMode, setIsImportModalOpen } = useTeachingScheduleStore();

  if (!timetable) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3.5 space-y-3 shrink-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* School Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {timetable.schoolName}
              </h2>
              {timetable.description && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  {timetable.description}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {timetable.title} • {timetable.subOrg} • {timetable.totalEntries} tiết học
            </p>
          </div>
        </div>

        {/* Import Action Button */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer"
            title="Đổi hoặc nhập file TKB Excel mới"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Đổi / Nhập Excel</span>
          </button>
        </div>
      </div>

      {/* View Mode Segmented Controls (Mobile-First Touch Target) */}
      <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
        <button
          onClick={() => setViewMode('teacher')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${
            viewMode === 'teacher'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Lịch Giáo Viên</span>
        </button>

        <button
          onClick={() => setViewMode('class')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${
            viewMode === 'class'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 shrink-0" />
          <span>Lịch Theo Lớp</span>
        </button>

        <button
          onClick={() => setViewMode('matrix')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${
            viewMode === 'matrix'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>Bảng Toàn Trường</span>
        </button>
      </div>
    </div>
  );
};
