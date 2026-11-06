'use client';

import React from 'react';
import {
  Wallet,
  CalendarDays,
  GraduationCap,
  Calendar,
  Bot,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface QuickLaunchpadProps {
  onNavigateTab: (tab: any) => void;
}

export const QuickLaunchpad: React.FC<QuickLaunchpadProps> = ({ onNavigateTab }) => {
  const actions = [
    {
      id: 'spending',
      title: 'Ghi Thu - Chi',
      desc: 'Khoản chi tiêu & hóa đơn',
      icon: Wallet,
      tab: 'spending',
      colorBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
    },
    {
      id: 'teaching',
      title: 'Lịch Dạy Trường',
      desc: 'Tra cứu phòng & ca dạy',
      icon: CalendarDays,
      tab: 'teaching_schedule',
      colorBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
    },
    {
      id: 'classes',
      title: 'Quản Lý Lớp Học',
      desc: 'Danh sách lớp & học sinh',
      icon: GraduationCap,
      tab: 'classes',
      colorBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
    },
    {
      id: 'schedule',
      title: 'Lịch Hẹn Tự Do',
      desc: 'Hẹn phụ huynh & gia sư',
      icon: Calendar,
      tab: 'schedule',
      colorBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white',
    },
    {
      id: 'ai',
      title: 'Hỏi Trợ Lý AI',
      desc: 'Soạn giáo án & tra cứu',
      icon: Bot,
      tab: 'ai_assistant',
      colorBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
    },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Phím Tắt Tiện Ích
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Truy cập nhanh các nghiệp vụ thường dùng
          </p>
        </div>
      </div>

      {/* Grid of actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onNavigateTab(act.tab)}
              className="group w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all duration-200 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl transition-colors duration-200 shrink-0 ${act.colorBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {act.desc}
                  </div>
                </div>
              </div>

              <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
