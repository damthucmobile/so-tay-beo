'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, LoginForm, useActivityTracker, RecentViewItem } from '@/core/firebase';
import { ClassFeature } from '../features/class';
import { TeachingScheduleFeature } from '../features/teaching-schedule';
import { FreelanceScheduleFeature } from '../features/schedule';
import { IncomeFeature } from '../features/income';
import { UserGuidePage } from '../features/guide';
import { MainLayout } from '../components/layout/MainLayout';
import { NavTabId } from '../components/layout/Sidebar';
import { useThemeStore } from '../stores/useThemeStore';
import { useTeachingScheduleStore } from '../features/teaching-schedule/stores/useTeachingScheduleStore';
import {
  GraduationCap,
  Settings,
  LogOut,
  Sparkles,
  Copy,
  Check,
  Monitor,
  Moon,
  Sun,
  BookOpen,
  ArrowRight,
  PhoneCall,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { trackManualView } = useActivityTracker();
  const { theme, setTheme } = useThemeStore();
  const [tabHistory, setTabHistory] = useState<NavTabId[]>(['classes']);
  const currentTab = tabHistory[tabHistory.length - 1] || 'classes';

  const handleSelectTab = (tab: NavTabId) => {
    if (tab === currentTab) return;
    setTabHistory((prev) => [...prev, tab]);
  };

  const handleBackTab = () => {
    if (tabHistory.length > 1) {
      setTabHistory((prev) => prev.slice(0, -1));
    }
  };

  // Tự động kiểm tra URL query param và lắng nghe sự kiện khi người dùng click vào thông báo
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlParams = () => {
      try {
        const search = window.location.search;
        if (!search) return;
        const params = new URLSearchParams(search);
        const tab = params.get('tab') as NavTabId | null;
        const teacher = params.get('teacher');

        if (tab && ['classes', 'teaching_schedule', 'schedule', 'income', 'settings', 'guide'].includes(tab)) {
          setTabHistory((prev) => (prev[prev.length - 1] === tab ? prev : [...prev, tab]));
          if (teacher && tab === 'teaching_schedule') {
            useTeachingScheduleStore.getState().setSelectedTeacher(decodeURIComponent(teacher));
            useTeachingScheduleStore.getState().setViewMode('teacher');
          }
        }
      } catch (e) {
        // ignore
      }
    };

    checkUrlParams();

    // 1. Lắng nghe sự kiện click thông báo nội bộ
    const handleNavigateTab = (e: any) => {
      const detail = e.detail;
      if (detail?.tab) {
        setTabHistory((prev) => (prev[prev.length - 1] === detail.tab ? prev : [...prev, detail.tab]));
        if (detail.teacher && detail.tab === 'teaching_schedule') {
          useTeachingScheduleStore.getState().setSelectedTeacher(detail.teacher);
          useTeachingScheduleStore.getState().setViewMode('teacher');
        }
      }
    };

    // 2. Lắng nghe tin nhắn từ Service Worker khi người dùng bấm vào Web Push
    const handleSwMessage = (e: MessageEvent) => {
      if (e.data?.type === 'NOTIFICATION_CLICKED') {
        const data = e.data.data;
        const tab = data?.tab || 'teaching_schedule';
        setTabHistory((prev) => (prev[prev.length - 1] === tab ? prev : [...prev, tab]));
        if (data?.teacher && tab === 'teaching_schedule') {
          useTeachingScheduleStore.getState().setSelectedTeacher(data.teacher);
          useTeachingScheduleStore.getState().setViewMode('teacher');
        }
      }
    };

    window.addEventListener('popstate', checkUrlParams);
    window.addEventListener('app-navigate-tab', handleNavigateTab);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('popstate', checkUrlParams);
      window.removeEventListener('app-navigate-tab', handleNavigateTab);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  // Tự động ghi nhận màn hình phân hệ đang xem vào danh sách Xem Gần Đây (Global SPA Tracking)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const tabMeta: Record<NavTabId, { title: string; subtitle: string }> = {
      classes: { title: 'Quản Lý Lớp Học', subtitle: 'Danh sách các lớp giảng dạy' },
      teaching_schedule: { title: 'Lịch Dạy Học', subtitle: 'Thời khóa biểu nhà trường & Lịch giảng dạy cá nhân' },
      schedule: { title: 'Lịch Tự Do & Khách Hàng', subtitle: 'Lịch hẹn gia sư & học viên' },
      income: { title: 'Báo Cáo Thu Nhập & Thù Lao', subtitle: 'Đối soát thù lao giảng dạy' },
      settings: { title: 'Cài Đặt Hệ Thống', subtitle: 'Hồ sơ & giao diện' },
      guide: { title: 'Hướng Dẫn Sử Dụng', subtitle: 'Tài liệu hướng dẫn & mẹo sử dụng phần mềm' },
    };
    const meta = tabMeta[currentTab];
    if (meta) {
      trackManualView({
        contentId: currentTab,
        contentType: 'tab',
        title: meta.title,
        subtitle: meta.subtitle,
        route: `/?tab=${currentTab}`,
      });
    }
  }, [currentTab, isAuthenticated, user, trackManualView]);

  const handleSelectRecentItem = (item: RecentViewItem) => {
    if (item.contentType === 'tab') {
      handleSelectTab(item.contentId as NavTabId);
    } else if (item.contentType === 'class') {
      handleSelectTab('classes');
    }
  };

  const [copiedUid, setCopiedUid] = useState(false);

  // Áp dụng class dark ban đầu vào document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Đang khởi tạo ứng dụng Sổ Tay Béo...</p>
        </div>
      </main>
    );
  }

  // =========================================================================
  // MÀN HÌNH CHƯA ĐĂNG NHẬP
  // =========================================================================
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-200">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Đăng Nhập Tài Khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Hệ thống quản lý lớp học, đối soát thù lao và đồng bộ đám mây đa thiết bị.
          </p>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-2xl">
            <LoginForm
              title="Đăng nhập Sổ Tay Béo"
              subtitle="Tiếp tục nhanh với Google hoặc Email"
              googleFlow="popup"
              className="bg-transparent border-0 shadow-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-center gap-2.5 relative z-10 select-none">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-200 group">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hotline hỗ trợ:</span>
            <a
              href="tel:0389793148"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
              title="Bấm để gọi hotline hỗ trợ"
            >
              <PhoneCall className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" />
              <span className="tracking-wider font-mono font-bold">0389.793.148</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Sổ Tay Béo 2.0 • Hỗ trợ kỹ thuật & tư vấn sử dụng
          </p>
        </footer>
      </main>
    );
  }

  // =========================================================================
  // MÀN HÌNH ĐÃ ĐĂNG NHẬP: SỬ DỤNG MAIN LAYOUT CỦA APP GỐC TAURI
  // =========================================================================
  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onBackTab={handleBackTab}
      canBackTab={tabHistory.length > 1}
      user={user}
      onLogout={() => logout()}
      onSelectRecentItem={handleSelectRecentItem}
    >
      {/* 1. LỚP HỌC (FEATURE CHÍNH) */}
      {currentTab === 'classes' && <ClassFeature />}

      {/* 2. LỊCH DẠY HỌC (THỜI KHÓA BIỂU NHÀ TRƯỜNG) */}
      {currentTab === 'teaching_schedule' && <TeachingScheduleFeature />}

      {/* 3. LỊCH TỰ DO & KHÁCH HÀNG */}
      {currentTab === 'schedule' && <FreelanceScheduleFeature />}

      {/* 3. THU NHẬP & THÙ LAO */}
      {currentTab === 'income' && <IncomeFeature />}

      {/* 4. CÀI ĐẶT & HỒ SƠ - Rộng full đồng bộ các màn hình */}
      {currentTab === 'settings' && (
        <div className="w-full space-y-6 animate-fadeIn pb-10">
          {/* Version badge */}
          <div className="flex items-center justify-end pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Sổ Tay Béo 2.0
            </span>
          </div>

          {/* User Guide Navigation Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-7 text-white shadow-xl shadow-blue-500/15">
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-blue-100 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cẩm Nang & Trợ Giúp</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  Chưa rõ cách sử dụng phần mềm?
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/90 max-w-md leading-relaxed">
                  Xem cẩm nang hướng dẫn sử dụng chi tiết: Tạo lớp học, dán danh sách từ Excel, quản lý buổi dạy tính thù lao tự động và lên lịch tự do.
                </p>
              </div>
              <button
                onClick={() => handleSelectTab('guide')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Xem Hướng Dẫn Chi Tiết</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          {/* Theme Settings Card */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-2xl">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Giao Diện & Chế Độ Màn Hình</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tùy chọn phong cách hiển thị sáng / tối</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Chế độ màu sắc</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chuyển đổi giữa chế độ tối (Dark mode) và chế độ sáng (Light mode) phù hợp môi trường làm việc.
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer border ${theme === 'dark'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Chế độ Tối</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer border ${theme === 'light'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Chế độ Sáng</span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Profile Card */}
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/50 shadow-lg shadow-blue-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-blue-500/50 shadow-lg shadow-blue-500/20">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {user.displayName || 'Người dùng'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Tài khoản chính thức
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-slate-400 dark:text-slate-500">UID:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[260px]">
                      {user.uid}
                    </span>
                    <button
                      onClick={handleCopyUid}
                      className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition text-[11px] font-semibold ml-1 cursor-pointer flex items-center gap-1"
                    >
                      {copiedUid ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUid ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <a
                href="tel:0389793148"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition"
                title="Bấm để gọi hotline hỗ trợ"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Hỗ trợ kỹ thuật: <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">0389.793.148</strong></span>
              </a>

              <button
                onClick={() => logout()}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. HƯỚNG DẪN SỬ DỤNG */}
      {currentTab === 'guide' && <UserGuidePage onNavigateTab={handleSelectTab} />}
    </MainLayout>
  );
}
