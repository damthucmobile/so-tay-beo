// components/layout/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  X,
  BookOpen,
  CalendarDays,
  HeartPulse,
  Palmtree,
  Home,
  BookOpenCheck,
  Briefcase,
} from 'lucide-react';

export type NavTabId =
  | 'classes'
  | 'teaching_schedule'
  | 'schedule'
  | 'income'
  | 'settings'
  | 'guide'
  | 'health'
  | 'travel'
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
      { id: 'settings', label: 'Cài đặt hồ sơ', icon: Settings },
      { id: 'guide', label: 'Hướng dẫn', icon: BookOpen },
    ],
  },
  {
    id: 'health_group',
    label: 'Sức khoẻ & Thể chất',
    icon: HeartPulse,
    items: [
      { id: 'health', label: 'Sức khoẻ & Thể chất', icon: HeartPulse, badge: 'Mới' },
    ],
  },
  {
    id: 'travel_group',
    label: 'Du lịch & nghỉ dưỡng',
    icon: Palmtree,
    items: [
      { id: 'travel', label: 'Du lịch & nghỉ dưỡng', icon: Palmtree },
    ],
  },
  {
    id: 'family_group',
    label: 'Gia đình',
    icon: Home,
    items: [
      { id: 'family', label: 'Gia đình', icon: Home },
    ],
  },
  {
    id: 'education_group',
    label: 'Giáo dục',
    icon: BookOpenCheck,
    items: [
      { id: 'education', label: 'Giáo dục', icon: BookOpenCheck },
    ],
  },
];

// Flatten helper để các hàm tra cứu nhanh item nếu cần
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
  // Quản lý trạng thái mở rộng / thu gọn của từng nhóm điều hướng (lưu vào localStorage)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sidebar_expanded_groups');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      work: true,
      health_group: true,
      travel_group: true,
      family_group: true,
      education_group: true,
    };
  });

  // Tự động mở nhóm đang chứa tab hiện tại nếu đang bị thu gọn
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) => g.items.some((item) => item.id === currentTab));
    if (activeGroup && expandedGroups[activeGroup.id] === false) {
      setExpandedGroups((prev) => {
        const next = { ...prev, [activeGroup.id]: true };
        try {
          localStorage.setItem('sidebar_expanded_groups', JSON.stringify(next));
        } catch (e) {
          // ignore
        }
        return next;
      });
    }
  }, [currentTab]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('sidebar_expanded_groups', JSON.stringify(next));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const toggleAllGroups = () => {
    const allExpanded = NAV_GROUPS.every((g) => expandedGroups[g.id] !== false);
    const next: Record<string, boolean> = {};
    NAV_GROUPS.forEach((g) => {
      next[g.id] = !allExpanded;
    });
    // Luôn giữ nhóm chứa tab đang chọn mở
    const activeGroup = NAV_GROUPS.find((g) => g.items.some((item) => item.id === currentTab));
    if (activeGroup) {
      next[activeGroup.id] = true;
    }
    setExpandedGroups(next);
    try {
      localStorage.setItem('sidebar_expanded_groups', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const allExpanded = NAV_GROUPS.every((g) => expandedGroups[g.id] !== false);

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
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 px-3.5 shrink-0">
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

        {/* Grouped Navigation Items */}
        <nav className="flex-1 space-y-3 p-2.5 overflow-y-auto">
          {/* Quick Toggle All Button (Khi ở chế độ đầy đủ) */}
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Phân hệ & Danh mục
              </span>
              <button
                type="button"
                onClick={toggleAllGroups}
                className="text-[10px] font-semibold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                title={allExpanded ? 'Thu gọn tất cả các nhóm' : 'Mở rộng tất cả các nhóm'}
              >
                <ChevronsUpDown className="w-3 h-3" />
                <span>{allExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
              </button>
            </div>
          )}

          {NAV_GROUPS.map((group, groupIdx) => {
            const isExpanded = expandedGroups[group.id] !== false;
            const GroupIcon = group.icon;
            const hasActiveItem = group.items.some((item) => item.id === currentTab);

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header Button (Có thể bấm để Thu gọn / Mở rộng) */}
                {!collapsed || mobileOpen ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer group ${
                      hasActiveItem
                        ? 'bg-slate-100/70 dark:bg-slate-800/50'
                        : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    }`}
                    title={isExpanded ? `Thu gọn nhóm ${group.label}` : `Mở rộng nhóm ${group.label}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {GroupIcon && (
                        <GroupIcon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            hasActiveItem
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                      )}
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                          hasActiveItem
                            ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                        }`}
                      >
                        {group.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {!isExpanded && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {group.items.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </div>
                  </button>
                ) : (
                  groupIdx > 0 && (
                    <div className="my-2 border-t border-slate-200/80 dark:border-slate-800/80" />
                  )
                )}

                {/* Group Items */}
                {!collapsed || mobileOpen ? (
                  isExpanded && (
                    <div className="space-y-1 pl-1 animate-fadeIn">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onSelectTab(item.id);
                              onCloseMobile();
                            }}
                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                              active
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                            title={item.label}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0" />
                            <span className="truncate flex-1 text-left">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                  active
                                    ? 'bg-white/20 text-white'
                                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Chế độ thu nhỏ desktop (Icon-only) */
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-center rounded-xl p-2.5 text-xs transition cursor-pointer ${
                            active
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                          title={`${group.label}: ${item.label}`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Info */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-slate-200 dark:border-slate-800/80 p-3 text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Sổ Tay Béo 2.0</p>
          </div>
        )}
      </aside>
    </>
  );
};
