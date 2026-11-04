// components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  BookOpen,
  CalendarDays,
  HeartPulse,
  Palmtree,
  Home,
  BookOpenCheck,
  Briefcase,
  Compass,
  Camera,
  Wallet,
  CheckSquare,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Bot,
} from 'lucide-react';

export type NavTabId =
  | 'classes'
  | 'teaching_schedule'
  | 'schedule'
  | 'income'
  | 'spending'
  | 'ai_assistant'
  | 'settings'
  | 'guide'
  | 'health'
  | 'travel'
  | 'travel_journal'
  | 'travel_budget'
  | 'travel_checklist'
  | 'family'
  | 'education';

export interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
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

// Giữ lại cấu trúc NAV_GROUPS & NAV_ITEMS để đảm bảo tương thích ngược
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'work',
    label: 'Công việc',
    icon: Briefcase,
    items: [
      { id: 'classes', label: 'Lớp học', icon: GraduationCap },
      { id: 'teaching_schedule', label: 'Lịch dạy học', icon: CalendarDays },
      { id: 'schedule', label: 'Lịch tự do', icon: Calendar },
      { id: 'income', label: 'Thù lao', icon: DollarSign },
      { id: 'ai_assistant', label: 'Trợ lý AI', icon: Bot },
    ],
  },
  {
    id: 'life',
    label: 'Đời sống',
    icon: HeartPulse,
    items: [
      { id: 'spending', label: 'Chi tiêu', icon: Wallet },
      { id: 'health', label: 'Sức khoẻ & Thể chất', icon: HeartPulse },
      { id: 'travel', label: 'Chuyến đi', icon: Compass },
      { id: 'family', label: 'Gia đình', icon: Home },
      { id: 'education', label: 'Giáo dục', icon: BookOpenCheck },
    ],
  },
  {
    id: 'system',
    label: 'Tiện ích',
    icon: Settings,
    items: [
      { id: 'guide', label: 'Hướng dẫn sử dụng', icon: BookOpen },
      { id: 'settings', label: 'Cài đặt hồ sơ', icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  user,
}) => {
  const isTravelActive =
    currentTab === 'travel' ||
    currentTab === 'travel_journal' ||
    currentTab === 'travel_budget' ||
    currentTab === 'travel_checklist';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container - Chuẩn phong cách phẳng macOS */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[#fbfbfd]/90 dark:bg-[#141518]/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/[0.06] transition-all duration-300 select-none ${collapsed ? 'md:w-16' : 'md:w-60'
          } ${mobileOpen ? 'translate-x-0 w-60 shadow-xl' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Top Header / Branding & Window Control */}
        <div className="flex h-14 items-center justify-between px-3 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              {/* macOS style Squircle App Icon */}
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                B
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate leading-tight">
                  Sổ Tay Béo
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                  Không gian làm việc
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                B
              </div>
            </div>
          )}

          {/* Nút đóng trên mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Nút thu gọn / mở rộng macOS Native style */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 transition"
            title={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Content Area */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-0.5">
              {(!collapsed || mobileOpen) && (
                <div className="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isItemActive =
                  item.id === 'travel'
                    ? isTravelActive
                    : currentTab === item.id;

                return (
                  <NavItemButton
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    active={isItemActive}
                    collapsed={collapsed && !mobileOpen}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMobile();
                    }}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile / Status Footer (macOS Minimal Footer) */}
        <div className="p-2 border-t border-slate-200/40 dark:border-white/[0.06] shrink-0">
          {!collapsed || mobileOpen ? (
            user ? (
              <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-200/40 dark:hover:bg-white/[0.04] transition">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="h-7 w-7 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs shrink-0">
                    {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex flex-col text-left overflow-hidden min-w-0">
                  <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-2 py-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
                Sổ Tay Béo
              </div>
            )
          ) : (
            <div className="flex justify-center py-1">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// Component con hiển thị từng mục điều hướng theo phong cách phẳng macOS
interface NavItemButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const NavItemButton: React.FC<NavItemButtonProps> = ({
  icon: Icon,
  label,
  active,
  collapsed,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`w-full flex items-center rounded-lg transition-colors duration-150 ${collapsed
        ? 'justify-center p-2 text-xs'
        : 'gap-2.5 px-2.5 py-1.5 text-[13px]'
        } ${active
          ? 'bg-blue-600 text-white font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/40 dark:hover:bg-white/[0.04]'
        }`}
    >
      <Icon
        className={`shrink-0 ${collapsed ? 'w-4 h-4' : 'w-4 h-4'} ${active
          ? 'text-white'
          : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
          }`}
      />
      {!collapsed && <span className="truncate text-left flex-1">{label}</span>}
    </button>
  );
};
