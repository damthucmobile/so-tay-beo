'use client';

import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  BookOpen,
  CalendarDays,
} from 'lucide-react';

export type NavTabId = 'classes' | 'teaching_schedule' | 'schedule' | 'income' | 'settings' | 'guide';

export interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'classes', label: 'Lớp học', icon: GraduationCap },
  { id: 'teaching_schedule', label: 'Lịch dạy học', icon: CalendarDays },
  { id: 'schedule', label: 'Lịch tự do', icon: Calendar },
  { id: 'income', label: 'Thù lao', icon: DollarSign },
  { id: 'settings', label: 'Cài đặt hồ sơ', icon: Settings },
  { id: 'guide', label: 'Hướng dẫn', icon: BookOpen },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  user,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 select-none shadow-sm dark:shadow-none ${
          // Desktop sizing
          collapsed ? 'md:w-18' : 'md:w-64'
          } ${
          // Mobile sliding
          mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Header Branding / Profile */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 px-3.5">
          {!collapsed ? (
            user ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="h-9 w-9 rounded-xl object-cover border border-emerald-500/40 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0 border border-blue-500/20 dark:border-blue-500/30">
                    {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex flex-col text-left overflow-hidden min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                      title="Đang hoạt động"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-white text-base">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black flex items-center justify-center shadow-md">
                  B
                </div>
                <span className="tracking-tight">Sổ Tay Béo</span>
              </div>
            )
          ) : (
            user && (
              <div className="mx-auto">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="h-8 w-8 rounded-xl object-cover border border-emerald-500/40 shadow-sm"
                  />
                ) : (
                  <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-500/20 dark:border-blue-500/30">
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )
          )}

          {/* Nút đóng trên mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Nút thu gọn / mở rộng trên desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shrink-0 transition cursor-pointer"
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium transition cursor-pointer ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {item.badge && (!collapsed || mobileOpen) && (
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-200 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-slate-200 dark:border-slate-800/80 p-3.5 text-center text-xs text-slate-500 dark:text-slate-400">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Sổ Tay Béo 2.0</p>
          </div>
        )}
      </aside>
    </>
  );
};
