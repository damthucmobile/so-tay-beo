'use client';

import React from 'react';
import { LogOut, Menu, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useHeaderStore } from '../../stores/useHeaderStore';
import { NavTabId } from './Sidebar';
import { RecentViewsDropdown } from './RecentViewsDropdown';
import { RecentViewItem } from '@/core/firebase';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  onLogout: () => void;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  onSelectSettings: () => void;
  currentTab?: NavTabId;
  onBackTab?: () => void;
  canBackTab?: boolean;
  onSelectRecentItem?: (item: RecentViewItem) => void;
}

const TAB_DEFAULT_TITLES: Record<NavTabId, { title: string; subtitle: string }> = {
  classes: {
    title: 'Quản Lý Lớp Học',
    subtitle: 'Lớp học trực tuyến & Thù lao giảng dạy',
  },
  teaching_schedule: {
    title: 'Lịch Dạy Học',
    subtitle: 'Thời khóa biểu nhà trường & Lịch giảng dạy cá nhân',
  },
  schedule: {
    title: 'Lịch Tự Do & Khách Hàng',
    subtitle: 'Lịch trực quan, lịch hẹn & danh bạ khách hàng',
  },
  income: {
    title: 'Thu Nhập & Thù Lao',
    subtitle: 'Báo cáo đối soát thù lao hợp nhất',
  },
  settings: {
    title: 'Cài Đặt & Hồ Sơ',
    subtitle: 'Tài khoản & Tùy chọn hệ thống',
  },
  guide: {
    title: 'Hướng Dẫn Sử Dụng',
    subtitle: 'Cẩm nang & Mẹo làm việc hiệu quả với Sổ Tay Béo',
  },
  health: {
    title: 'Sức Khoẻ & Thể Chất',
    subtitle: 'Theo dõi chỉ số sức khỏe, thói quen & luyện tập thể chất',
  },
  travel: {
    title: 'Lịch Trình Chuyến Đi',
    subtitle: 'Lập kế hoạch hành trình chi tiết, điểm đến & timeline di chuyển',
  },
  travel_journal: {
    title: 'Nhật Ký & Album Kỷ Niệm',
    subtitle: 'Lưu giữ khoảnh khắc, cảm xúc và thư viện ảnh video chất lượng cao',
  },
  travel_budget: {
    title: 'Ngân Sách & Chi Tiêu Du Lịch',
    subtitle: 'Dự toán chi phí, ghi nhận hóa đơn & chia tiền nhóm linh hoạt',
  },
  travel_checklist: {
    title: 'Hành Lý & Chuẩn Bị Chuyến Đi',
    subtitle: 'Checklist đồ đạc cần mang, giấy tờ tùy thân & vé máy bay/khách sạn',
  },
  family: {
    title: 'Gia Đình',
    subtitle: 'Nhật ký gia đình, sự kiện, chi tiêu & khoảnh khắc yêu thương',
  },
  education: {
    title: 'Giáo Dục & Học Tập',
    subtitle: 'Kế hoạch học tập, khóa học & tài liệu phát triển bản thân',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  onLogout,
  user,
  onSelectSettings,
  currentTab = 'classes',
  onBackTab,
  canBackTab = false,
  onSelectRecentItem,
}) => {
  const { theme, toggleTheme } = useThemeStore();
  const { customHeader } = useHeaderStore();

  const tabInfo = TAB_DEFAULT_TITLES[currentTab] || { title: 'Sổ Tay Béo', subtitle: '' };

  const displayTitle = customHeader?.title || tabInfo.title;
  const displaySubtitle =
    customHeader?.subtitle !== undefined ? customHeader.subtitle : tabInfo.subtitle;
  const displayBadge = customHeader?.badge;

  const hasBackButton = Boolean(
    (customHeader?.showBackButton && customHeader?.onBack) ||
    (canBackTab && onBackTab)
  );

  const handleBack = () => {
    if (customHeader?.showBackButton && customHeader?.onBack) {
      customHeader.onBack();
    } else if (onBackTab) {
      onBackTab();
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 gap-4 shadow-sm dark:shadow-none transition-colors duration-200">
      {/* Mobile Menu Button & App Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title="Mở thanh điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Screen Title & Back Button */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        {hasBackButton && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-sm shrink-0 border border-slate-200/80 dark:border-slate-700/80"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        )}

        <div className="flex flex-col min-w-0 justify-center">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
            {displayTitle}
          </h1>
          {displaySubtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Recent Views Dropdown */}
        {user && <RecentViewsDropdown onSelectItem={onSelectRecentItem} />}

        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500" />
          )}
        </button>

        {/* User Profile Avatar & Clickable to Settings */}
        {user && (
          <button
            onClick={onSelectSettings}
            className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            title="Xem hồ sơ & Cài đặt"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{user.email}</p>
            </div>
          </button>
        )}

        {/* Nút Đăng xuất */}
        <button
          onClick={onLogout}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
          title="Đăng xuất tài khoản"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
