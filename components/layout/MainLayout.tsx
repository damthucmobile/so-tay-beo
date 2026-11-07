'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from './Sidebar';
import { TopHeader } from './TopHeader';
import { RecentViewItem } from '@/core/firebase';
import { Bell, X, ArrowRight, Calendar, Droplets, Dumbbell, HeartPulse } from 'lucide-react';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';
import { useHealthStore } from '@/features/health/stores/useHealthStore';

interface MainLayoutProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onLogout: () => void;
  onBackTab?: () => void;
  canBackTab?: boolean;
  onSelectRecentItem?: (item: RecentViewItem) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  onBackTab,
  canBackTab,
  onSelectRecentItem,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    body: string;
    data?: any;
    url?: string;
  } | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setActiveNotification(detail);
      }
    };

    window.addEventListener('app-inapp-notification', handleNotification);
    return () => window.removeEventListener('app-inapp-notification', handleNotification);
  }, []);

  // Tự động đóng toast sau 8 giây
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  const handleNotificationClick = () => {
    if (!activeNotification) return;
    const targetTab = (activeNotification.data?.tab || 'teaching_schedule') as NavTabId;
    onSelectTab(targetTab);

    if (activeNotification.data?.teacher && targetTab === 'teaching_schedule') {
      useTeachingScheduleStore.getState().setSelectedTeacher(activeNotification.data.teacher);
      useTeachingScheduleStore.getState().setViewMode('teacher');
    }

    if (targetTab === 'health' && activeNotification.data?.subtab) {
      useHealthStore.getState().setActiveSubTab(activeNotification.data.subtab);
    }

    setActiveNotification(null);
  };

  const isHealth = activeNotification?.data?.tab === 'health';
  const isWater = activeNotification?.data?.category === 'WATER';
  const isWorkout = activeNotification?.data?.category === 'WORKOUT';

  const badgeText = isWater
    ? 'NHẮC UỐNG NƯỚC'
    : isWorkout
    ? 'LỊCH TẬP THỂ CHẤT'
    : isHealth
    ? 'SỨC KHỎE & THỂ CHẤT'
    : 'THÔNG BÁO LỊCH DẠY';

  const actionText = isWater
    ? 'Bấm để ghi nhận nước uống'
    : isWorkout
    ? 'Bấm để xem lịch tập ngay'
    : isHealth
    ? 'Bấm để mở theo dõi sức khỏe'
    : 'Bấm vào đây để mở lịch dạy';

  const borderClass = isWater
    ? 'border-sky-500/80 shadow-sky-900/50 hover:border-sky-400'
    : isWorkout
    ? 'border-rose-500/80 shadow-rose-900/50 hover:border-rose-400'
    : isHealth
    ? 'border-emerald-500/80 shadow-emerald-900/50 hover:border-emerald-400'
    : 'border-blue-500/80 shadow-blue-900/50 hover:border-blue-400';

  const badgeClass = isWater
    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    : isWorkout
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    : isHealth
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

  const iconBgClass = isWater
    ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    : isWorkout
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    : isHealth
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  const actionTextColor = isWater
    ? 'text-sky-400 group-hover:text-sky-300'
    : isWorkout
    ? 'text-rose-400 group-hover:text-rose-300'
    : isHealth
    ? 'text-emerald-400 group-hover:text-emerald-300'
    : 'text-blue-400 group-hover:text-blue-300';

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-200 transition-colors duration-200">
      {/* Toast thông báo In-App nổi trên toàn bộ màn hình - Căn giữa đối xứng 100% trên Mobile & góc phải trên Desktop */}
      {activeNotification && (
        <div className="fixed top-3 sm:top-5 inset-x-0 sm:inset-x-auto sm:right-6 z-[9999] flex justify-center sm:justify-end px-3 sm:px-0 pointer-events-none animate-in slide-in-from-top-3 duration-300">
          <div
            role="alert"
            onClick={handleNotificationClick}
            className={`pointer-events-auto w-full max-w-md bg-slate-900/95 text-white backdrop-blur-xl border-2 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-start gap-3 cursor-pointer transition-all group ring-1 ring-white/10 ${borderClass}`}
          >
            <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 border group-hover:scale-105 transition-transform ${iconBgClass}`}>
              {isWater ? (
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              ) : isWorkout ? (
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              ) : isHealth ? (
                <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold border shrink-0 ${badgeClass}`}>
                  {badgeText}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                  {activeNotification.title}
                </h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {activeNotification.body}
              </p>
              <div className={`mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${actionTextColor}`}>
                <span>{actionText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveNotification(null);
              }}
              className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar như app gốc Tauri */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        user={user}
      />

      {/* Main Right Area */}
      <div className="relative z-10 flex flex-1 flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Toolbar - Cố định không cuộn */}
        <TopHeader
          onToggleMobileMenu={() => setMobileOpen(true)}
          onLogout={onLogout}
          user={user}
          onSelectSettings={() => onSelectTab('settings')}
          currentTab={currentTab}
          onBackTab={onBackTab}
          canBackTab={canBackTab}
          onSelectRecentItem={onSelectRecentItem}
        />

        {/* Dynamic Page Content - Chỉ cuộn phần nội dung */}
        {currentTab === 'schedule' || currentTab === 'teaching_schedule' || currentTab === 'ai_assistant' ? (
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 sm:py-6">
            <div className="w-full">{children}</div>
          </main>
        )}
      </div>
    </div>
  );
};
