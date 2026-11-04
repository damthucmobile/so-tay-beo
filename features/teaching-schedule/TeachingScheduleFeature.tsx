'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/core/firebase';
import { useTeachingScheduleStore } from './stores/useTeachingScheduleStore';
import { TimetableHeaderBanner } from './components/TimetableHeaderBanner';
import { TeacherScheduleView } from './components/TeacherScheduleView';
import { ClassScheduleView } from './components/ClassScheduleView';
import { MatrixTimetableDesktop } from './components/MatrixTimetableDesktop';
import { ImportModal } from './components/ImportModal';
import { TeachingReminderModal } from './components/TeachingReminderModal';
import { TeachingReminderService } from './services/teachingReminderService';
import {
  CalendarDays,
  Upload,
  Loader2,
  UserCheck,
  GraduationCap,
  LayoutGrid,
  Trash2,
  Bell,
  Bot,
  Minimize2,
  Maximize2,
  MoreVertical,
} from 'lucide-react';

export const TeachingScheduleFeature: React.FC = () => {
  const { user } = useAuth();
  const {
    timetable,
    viewMode,
    setViewMode,
    isImportModalOpen,
    setIsImportModalOpen,
    selectedTeacher,
    initStore,
    clearTimetable,
    isLoading,
    isCompactView,
    toggleCompactView,
  } = useTeachingScheduleStore();

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);

  useEffect(() => {
    const unsub = initStore(user?.uid);
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [user?.uid, initStore]);

  // Background reminder scheduler (chạy kiểm tra mỗi phút 1 lần)
  useEffect(() => {
    if (!timetable) return;

    let timer: NodeJS.Timeout | null = null;
    const runCheck = async () => {
      try {
        const settings = await TeachingReminderService.getSettings(user?.uid);
        if (settings?.enabled) {
          TeachingReminderService.checkAndTriggerReminders(timetable, settings);
        }
      } catch (e) {
        // Silent catch for background polling
      }
    };

    // Chạy kiểm tra ngay khi mount
    runCheck();
    // Lên lịch lặp lại mỗi 60 giây
    timer = setInterval(runCheck, 60000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timetable, user?.uid]);

  const handleDeleteTimetable = async () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn xóa thời khóa biểu này? Sau khi xóa, bạn có thể tải lên file Excel mới bất kỳ lúc nào.'
      )
    ) {
      await clearTimetable(user?.uid);
    }
  };

  if (isLoading && !timetable) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-12 space-y-3 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Đang đồng bộ dữ liệu thời khóa biểu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* 1. Sub-Tabs Navigation Bar - Đồng bộ chuẩn thiết kế với Lịch Tự Do & Khách Hàng */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto print:hidden">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => setViewMode('teacher')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${viewMode === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="hidden sm:inline">Lịch </span>giáo viên
          </button>

          <button
            onClick={() => setViewMode('class')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${viewMode === 'class'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="hidden sm:inline">Lịch </span>theo lớp
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${viewMode === 'matrix'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="hidden sm:inline">Lịch </span>toàn trường
          </button>
        </div>

        {/* Action Buttons */}
        {timetable && (
          <>
            {/* A. BẢN DESKTOP (hidden sm:flex) */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              {/* Nút bật/tắt Chế độ xem gọn */}
              <button
                onClick={toggleCompactView}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                  isCompactView
                    ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/60 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
                }`}
                title={isCompactView ? 'Đang bật Xem gọn (Bấm để xem đầy đủ)' : 'Đang bật Xem đầy đủ (Bấm để thu gọn)'}
              >
                {isCompactView ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Xem gọn</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Xem đầy đủ</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('app-navigate-tab', { detail: { tab: 'ai_assistant' } }));
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                title="Mở Trợ lý AI"
              >
                <Bot className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Trợ lý AI</span>
              </button>

              <button
                onClick={() => setIsReminderModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-semibold transition border border-blue-200/60 dark:border-blue-800/40 shadow-sm cursor-pointer"
                title="Cài đặt thông báo Web Push nhắc tiết dạy"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Nhắc lịch</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition border border-slate-200/80 dark:border-slate-700/80 shadow-sm cursor-pointer"
                title="Đổi hoặc nhập file TKB Excel mới"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Đổi / Nhập Excel</span>
              </button>

              <button
                onClick={handleDeleteTimetable}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold transition border border-red-200/80 dark:border-red-900/40 shadow-sm cursor-pointer"
                title="Xóa thời khóa biểu này"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span className="ml-1">Xóa TKB</span>
              </button>
            </div>

            {/* B. BẢN MOBILE (sm:hidden) - Gọn gàng không bị tràn thanh ngang */}
            <div className="sm:hidden flex items-center gap-1.5 shrink-0 relative">
              <button
                onClick={toggleCompactView}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  isCompactView
                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
                title={isCompactView ? 'Đang Xem gọn (Bấm để xem đầy đủ)' : 'Đang Xem đầy đủ (Bấm để thu gọn)'}
              >
                {isCompactView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsMobileActionsOpen(!isMobileActionsOpen)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="Tùy chọn khác"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Menu dropdown trên mobile */}
              {isMobileActionsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMobileActionsOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        setIsMobileActionsOpen(false);
                        window.dispatchEvent(new CustomEvent('app-navigate-tab', { detail: { tab: 'ai_assistant' } }));
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-500" />
                      <span>Trợ lý AI</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileActionsOpen(false);
                        setIsReminderModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-500" />
                      <span>Cài đặt nhắc lịch</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileActionsOpen(false);
                        setIsImportModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đổi / Nhập Excel</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      onClick={() => {
                        setIsMobileActionsOpen(false);
                        handleDeleteTimetable();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa thời khóa biểu</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 2. Main Tab Content View - Mở rộng full chiều ngang theo yêu cầu */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${isCompactView ? 'px-3 sm:px-5 py-2.5 sm:py-3.5' : 'px-4 sm:px-6 py-4 sm:py-6'}`}>
        <div className={`w-full ${isCompactView ? 'space-y-2 sm:space-y-2.5' : 'space-y-4'}`}>
          {!timetable ? (
            /* Empty State khi chưa có TKB: Mời người dùng import file Excel */
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center mx-auto">
                <CalendarDays className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Chưa Có Thời Khóa Biểu
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Vui lòng tải lên tệp Excel (.xlsx) thời khóa biểu để xem lịch giảng dạy cá nhân và các lớp.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nhập File Excel Thời Khóa Biểu</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Thẻ thông tin trường và TKB nằm cùng lề chuẩn với nội dung bên dưới */}
              <TimetableHeaderBanner onOpenReminder={() => setIsReminderModalOpen(true)} />

              {viewMode === 'teacher' && <TeacherScheduleView />}
              {viewMode === 'class' && <ClassScheduleView />}
              {viewMode === 'matrix' && <MatrixTimetableDesktop />}
            </>
          )}
        </div>
      </div>

      {/* 3. Modal Import Excel & Modal Cài đặt Nhắc lịch */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <TeachingReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        timetable={timetable}
        defaultTeacher={selectedTeacher}
      />
    </div>
  );
};
