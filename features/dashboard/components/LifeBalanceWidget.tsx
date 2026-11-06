'use client';

import React, { useMemo } from 'react';
import { Palmtree, HeartPulse, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTravelStore } from '@/features/travel/stores/useTravelStore';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { formatCurrency } from '@/core/utils/formatters';

interface LifeBalanceWidgetProps {
  monthlyBudget: number;
  monthlyExpense: number;
  hideTrip?: boolean;
  onNavigateTab: (tab: any) => void;
}

export const LifeBalanceWidget: React.FC<LifeBalanceWidgetProps> = ({
  monthlyBudget,
  monthlyExpense,
  hideTrip = false,
  onNavigateTab,
}) => {
  const trips = useTravelStore((state) => state.trips);

  // Tìm chuyến đi sắp tới gần nhất
  const upcomingTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null;
    const now = new Date();
    const sorted = [...trips]
      .filter((t) => {
        try {
          const start = parseISO(t.startDate);
          return start >= now || differenceInCalendarDays(start, now) >= 0;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (sorted.length > 0) {
      const trip = sorted[0];
      const daysLeft = differenceInCalendarDays(parseISO(trip.startDate), now);
      return { trip, daysLeft };
    }
    return null;
  }, [trips]);

  // Ngân sách tháng
  const budgetRatio = useMemo(() => {
    if (!monthlyBudget || monthlyBudget <= 0) return 0;
    return Math.min(100, Math.round((monthlyExpense / monthlyBudget) * 100));
  }, [monthlyBudget, monthlyExpense]);

  return (
    <div className="space-y-4">
      {/* 1. Card Chuyến đi sắp tới (chỉ hiển thị nếu không bị ẩn) */}
      {!hideTrip && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('travel')}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/10 to-emerald-600/5 dark:from-teal-900/30 dark:to-emerald-950/20 border border-teal-200/60 dark:border-teal-800/40 p-4 sm:p-5 transition-all duration-200 hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-teal-100 dark:border-teal-900/40">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <Palmtree className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                Chuyến Đi Sắp Tới
              </span>
            </div>

            <div className="text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {upcomingTrip ? (
            <div className="space-y-1">
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                {upcomingTrip.trip.destination || upcomingTrip.trip.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {upcomingTrip.daysLeft === 0
                  ? 'Khởi hành ngay hôm nay! Chúc chuyến đi tuyệt vời!'
                  : `Còn ${upcomingTrip.daysLeft} ngày nữa khởi hành ✈️`}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có kế hoạch chuyến đi
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Bấm để lên kế hoạch nghỉ dưỡng và lưu giữ kỷ niệm cùng gia đình.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. Hạn mức chi tiêu tháng (nếu có budget thiết lập) */}
      {monthlyBudget > 0 && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('spending')}
          className="group rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:border-purple-300 dark:hover:border-purple-800/40 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Hạn Mức Ngân Sách Tháng
            </span>
            <span
              className={`text-xs font-extrabold ${
                budgetRatio > 90
                  ? 'text-rose-500'
                  : budgetRatio > 70
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            >
              {budgetRatio}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetRatio > 90
                  ? 'bg-rose-500'
                  : budgetRatio > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetRatio}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Đã chi: {formatCurrency(monthlyExpense)}</span>
            <span>Hạn mức: {formatCurrency(monthlyBudget)}</span>
          </div>
        </div>
      )}

      {/* 3. Lời nhắc giữ gìn sức khoẻ cho cô giáo */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onNavigateTab('health')}
        className="group flex items-center gap-3 p-3.5 sm:p-4 rounded-3xl bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border border-rose-100 dark:border-rose-900/30 transition-all cursor-pointer"
      >
        <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
          <HeartPulse className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            Sức Khỏe & Thể Chất
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
            Uống đủ 2L nước mỗi ngày và nhớ dành 10 phút thả lỏng thanh quản sau ca dạy nhé!
          </p>
        </div>
      </div>
    </div>
  );
};
