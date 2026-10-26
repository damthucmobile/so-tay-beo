'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/core/firebase';
import { useTeachingScheduleStore } from './stores/useTeachingScheduleStore';
import { TimetableHeaderBanner } from './components/TimetableHeaderBanner';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { ClassScheduleView } from './components/ClassScheduleView';
import { MatrixTimetableDesktop } from './components/MatrixTimetableDesktop';
import { ImportModal } from './components/ImportModal';
import {
  CalendarDays,
  Upload,
  Loader2,
  UserCheck,
  GraduationCap,
  LayoutGrid,
  Trash2,
} from 'lucide-react';

export const TeachingScheduleFeature: React.FC = () => {
  const { user } = useAuth();
  const {
    timetable,
    viewMode,
    setViewMode,
    isImportModalOpen,
    setIsImportModalOpen,
    initStore,
    clearTimetable,
    isLoading,
  } = useTeachingScheduleStore();

  useEffect(() => {
    const unsub = initStore(user?.uid);
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [user?.uid, initStore]);

  const handleDeleteTimetable = async () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa thời khóa biểu này khỏi hệ thống và Firebase? Sau khi xóa, bạn có thể tải lên file Excel mới bất kỳ lúc nào.'
      )
    ) {
      await clearTimetable(user?.uid);
    }
  };

  if (isLoading && !timetable) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 space-y-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Đang đồng bộ thời khóa biểu từ Cloud Firebase...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* 1. Sub-Tabs Navigation Bar - Đồng bộ chuẩn thiết kế với Lịch Tự Do & Khách Hàng */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => setViewMode('teacher')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lịch giáo viên
          </button>

          <button
            onClick={() => setViewMode('class')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'class'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lịch theo lớp
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'matrix'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lịch toàn trường
          </button>
        </div>

        {/* Action Buttons on the right: Đổi / Nhập Excel & Xóa TKB */}
        {timetable && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer"
              title="Đổi hoặc nhập file TKB Excel mới"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Đổi / Nhập Excel</span>
              <span className="sm:hidden text-[11px]">Đổi TKB</span>
            </button>

            <button
              onClick={handleDeleteTimetable}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold transition border border-red-200/80 dark:border-red-900/40 shadow-sm cursor-pointer"
              title="Xóa thời khóa biểu này khỏi hệ thống & Firebase"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline ml-1">Xóa TKB</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Tab Content View - Căn lề chuẩn px-4 sm:px-6 py-4 sm:py-6 và max-w-7xl mx-auto */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0">
        <div className="max-w-7xl mx-auto w-full space-y-4">
          {!timetable ? (
            /* Empty State khi chưa có TKB: Mời người dùng import file Excel thật */
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <CalendarDays className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Chưa Có Thời Khóa Biểu
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Vui lòng tải lên tệp Excel (.xlsx) thời khóa biểu toàn trường để xem lịch giảng dạy cá nhân và thời khóa biểu từng lớp.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nhập File Excel Thời Khóa Biểu</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thẻ thông tin trường và TKB nằm cùng lề chuẩn với nội dung bên dưới */}
              <TimetableHeaderBanner />

              {viewMode === 'teacher' && <TeacherScheduleView />}
              {viewMode === 'class' && <ClassScheduleView />}
              {viewMode === 'matrix' && <MatrixTimetableDesktop />}
            </>
          )}
        </div>
      </div>

      {/* 3. Modal Import Excel */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
