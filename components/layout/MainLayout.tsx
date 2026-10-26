'use client';

import React, { useState } from 'react';
import { Sidebar, NavTabId } from './Sidebar';
import { TopHeader } from './TopHeader';
import { RecentViewItem } from '@/core/firebase';

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

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 selection:text-blue-600 dark:selection:text-blue-200 transition-colors duration-200">
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
