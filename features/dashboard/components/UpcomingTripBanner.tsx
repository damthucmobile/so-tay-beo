'use client';

import React, { useMemo } from 'react';
import {
  Palmtree,
  Calendar,
  Compass,
  ArrowRight,
  CheckCircle2,
  Wallet,
  Users,
  MapPin,
  Luggage,
} from 'lucide-react';
import { Trip } from '@/features/travel/types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '@/core/utils/formatters';

interface UpcomingTripBannerProps {
  trip: Trip;
  onNavigateTab: (tab: any) => void;
}

export const UpcomingTripBanner: React.FC<UpcomingTripBannerProps> = ({
  trip,
  onNavigateTab,
}) => {
  const now = new Date();
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate);
  const daysLeft = differenceInCalendarDays(startDate, now);

  const isOngoing = daysLeft <= 0 && differenceInCalendarDays(endDate, now) >= 0;

  // Số ngày của chuyến đi
  const durationDays = useMemo(() => {
    try {
      const diff = differenceInCalendarDays(endDate, startDate) + 1;
      return diff > 0 ? `${diff} ngày ${Math.max(1, diff - 1)} đêm` : '1 ngày';
    } catch {
      return '';
    }
  }, [startDate, endDate]);

  // Tiến độ hành lý checklist
  const checklistProgress = useMemo(() => {
    if (!trip.checklist || trip.checklist.length === 0) return null;
    const total = trip.checklist.length;
    const completed = trip.checklist.filter((i) => i.completed).length;
    const percent = Math.round((completed / total) * 100);
    return { completed, total, percent };
  }, [trip.checklist]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigateTab('travel')}
      className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600/10 via-emerald-600/10 to-cyan-600/10 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-cyan-950/20 border border-teal-200/80 dark:border-teal-800/60 p-5 sm:p-7 shadow-sm hover:shadow-xl hover:border-teal-400/80 dark:hover:border-teal-700 transition-all duration-300 cursor-pointer"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-56 h-56 bg-teal-400/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-44 h-44 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Image/Badge + Destination info */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
          {/* Trip Thumbnail or Palm tree icon */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20 overflow-hidden">
            {trip.coverImage ? (
              <img
                src={trip.coverImage}
                alt={trip.destination || trip.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <Palmtree className="w-8 h-8 sm:w-10 sm:h-10 text-white/90 group-hover:rotate-6 transition-transform duration-300" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-400/30">
                <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-300" />
                <span>Kỳ Nghỉ Dưỡng Sắp Tới</span>
              </span>

              {/* Countdown Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOngoing
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : daysLeft <= 3
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-400/40'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {isOngoing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Đang diễn ra hôm nay! 🎉</span>
                  </>
                ) : daysLeft === 0 ? (
                  <span>Khởi hành hôm nay! ✈️</span>
                ) : (
                  <span>Còn {daysLeft} ngày nữa khởi hành ✈️</span>
                )}
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {trip.destination ? `${trip.destination} • ${trip.title}` : trip.title}
            </h3>

            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>
                  {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                </span>
              </span>
              {durationDays && (
                <span className="hidden sm:inline font-semibold text-slate-500">
                  ({durationDays})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Action CTA Button */}
        <div className="flex items-center justify-between sm:justify-end gap-4 lg:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-teal-100/80 dark:border-teal-900/40">
          {/* Quick Metrics */}
          <div className="flex items-center gap-4 sm:gap-6">
            {trip.budget > 0 && (
              <div className="text-left sm:text-right space-y-0.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Dự toán ngân sách
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono block">
                  {formatCurrency(trip.budget)}
                </span>
              </div>
            )}

            {checklistProgress && (
              <div className="text-left sm:text-right space-y-0.5">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Hành lý checklist
                </span>
                <span className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 font-mono block">
                  {checklistProgress.completed}/{checklistProgress.total} món
                </span>
              </div>
            )}
          </div>

          {/* Action CTA Button */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/25 group-hover:shadow-lg transition-all cursor-pointer shrink-0">
            <span>Chi tiết chuyến đi</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
