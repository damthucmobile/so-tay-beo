'use client';

import React, { useEffect } from 'react';
import { useTeachingScheduleStore } from './stores/useTeachingScheduleStore';
import { TimetableHeaderBanner } from './components/TimetableHeaderBanner';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { ClassScheduleView } from './components/ClassScheduleView';
import { MatrixTimetableDesktop } from './components/MatrixTimetableDesktop';
import { ImportModal } from './components/ImportModal';
import { CalendarDays, Upload } from 'lucide-react';

export const TeachingScheduleFeature: React.FC = () => {
  const {
    timetable,
    viewMode,
    isImportModalOpen,
    setIsImportModalOpen,
    initStore,
  } = useTeachingScheduleStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* 1. Header Banner & View Switcher */}
      {timetable && <TimetableHeaderBanner />}

      {/* 2. Main Content View Area */}
      <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-6">
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
            {viewMode === 'teacher' && <TeacherScheduleView />}
            {viewMode === 'class' && <ClassScheduleView />}
            {viewMode === 'matrix' && <MatrixTimetableDesktop />}
          </>
        )}
      </div>

      {/* 3. Modal Import Excel */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
