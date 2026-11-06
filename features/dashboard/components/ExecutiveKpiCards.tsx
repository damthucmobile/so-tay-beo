'use client';

import React from 'react';
import { CalendarDays, GraduationCap, DollarSign, Wallet, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ExecutiveStats } from '../types';
import { formatCurrency } from '@/core/utils/formatters';

interface ExecutiveKpiCardsProps {
  stats: ExecutiveStats;
  onNavigateTab: (tab: any) => void;
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({ stats, onNavigateTab }) => {
  const cards = [
    {
      id: 'today',
      title: 'Lịch Hôm Nay',
      value: `${stats.todayEventsCount}`,
      unit: 'sự kiện',
      subtext: stats.todayEventsCount > 0 ? 'Buổi dạy & lịch hẹn' : 'Chưa có lịch bận',
      badge: stats.todayEventsCount > 0 ? 'Đang hoạt động' : 'Nghỉ ngơi',
      badgeColor: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-700/50',
      icon: CalendarDays,
      tab: 'teaching_schedule',
      colorBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      borderHover: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      sparklineColor: '#3b82f6',
      // SVG path points for sparkline
      sparklineD: 'M 0,28 Q 25,8 50,18 T 100,6 T 150,22 T 200,8',
    },
    {
      id: 'classes',
      title: 'Lớp Học & Học Sinh',
      value: `${stats.totalClassesCount}`,
      unit: 'lớp',
      subtext: `${stats.totalStudentsCount} học sinh đang học`,
      badge: 'Đang mở',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-700/50',
      icon: GraduationCap,
      tab: 'classes',
      colorBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      borderHover: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      sparklineColor: '#10b981',
      sparklineD: 'M 0,25 Q 30,22 60,12 T 120,18 T 160,8 T 200,4',
    },
    {
      id: 'income',
      title: 'Thù Lao Giảng Dạy',
      value: formatCurrency(stats.estimatedRemuneration),
      unit: '',
      subtext: 'Thù lao tháng hiện tại',
      badge: 'Tháng này',
      badgeColor: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/50',
      icon: DollarSign,
      tab: 'income',
      colorBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      borderHover: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      sparklineColor: '#f59e0b',
      sparklineD: 'M 0,26 Q 35,28 70,16 T 130,10 T 170,14 T 200,2',
    },
    {
      id: 'spending',
      title: 'Dòng Tiền Thu - Chi',
      value: formatCurrency(stats.monthlyIncome - stats.monthlyExpense),
      unit: '',
      subtext: `Chi: ${formatCurrency(stats.monthlyExpense)}`,
      badge: stats.monthlyIncome >= stats.monthlyExpense ? 'Thặng dư' : 'Cần cân đối',
      badgeColor:
        stats.monthlyIncome >= stats.monthlyExpense
          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-700/50'
          : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-700/50',
      icon: Wallet,
      tab: 'spending',
      colorBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      borderHover: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      sparklineColor: '#a855f7',
      sparklineD: 'M 0,22 Q 30,12 60,20 T 110,8 T 150,18 T 200,6',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => onNavigateTab(card.tab)}
            className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md ${card.borderHover} transition-all duration-200 cursor-pointer flex flex-col justify-between`}
          >
            {/* Top row: Icon, Badge and arrow */}
            <div className="flex items-center justify-between mb-3 z-10 relative">
              <div className={`p-2.5 rounded-2xl ${card.colorBg}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
                <div className="text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Middle: Title, Value */}
            <div className="space-y-1 z-10 relative">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate">
                {card.title}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {card.unit}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {card.subtext}
              </p>
            </div>

            {/* Sparkline Curve under the numbers */}
            <div className="mt-3 -mx-4 -mb-4 h-11 relative overflow-hidden pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
              <svg
                viewBox="0 0 200 32"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id={`sparkGrad_${card.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={card.sparklineColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={card.sparklineColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Filled Area */}
                <path
                  d={`${card.sparklineD} L 200,32 L 0,32 Z`}
                  fill={`url(#sparkGrad_${card.id})`}
                />

                {/* Stroke Line */}
                <path
                  d={card.sparklineD}
                  fill="none"
                  stroke={card.sparklineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};
