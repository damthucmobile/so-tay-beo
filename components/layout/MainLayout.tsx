'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTabId } from './Sidebar';
import { TopHeader } from './TopHeader';
import { RecentViewItem } from '@/core/firebase';
import { Bell, X, ArrowRight, Calendar } from 'lucide-react';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';

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

    setActiveNotification(null);
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-200 transition-colors duration-200">
      {/* Toast thông báo In-App nổi trên toàn bộ màn hình */}
      {activeNotification && (
        <div
          role="alert"
          onClick={handleNotificationClick}
          className="fixed top-4 right-4 z-50 max-w-sm w-full mx-auto sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-blue-500/60 dark:border-blue-500/50 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 animate-in slide-in-from-top-4 duration-300 cursor-pointer hover:border-blue-600 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
              <span>{activeNotification.title}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {activeNotification.body}
            </p>
            <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Xem lịch ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveNotification(null);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[600px] h-[350px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[350px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

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
        {currentTab === 'schedule' || currentTab === 'teaching_schedule' ? (
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
