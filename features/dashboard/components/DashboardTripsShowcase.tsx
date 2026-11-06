'use client';

import React, { useMemo } from 'react';
import {
  Palmtree,
  Calendar,
  Compass,
  ArrowRight,
  MapPin,
  Luggage,
  Wallet,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Trip } from '@/features/travel/types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatCurrency } from '@/core/utils/formatters';

interface DashboardTripsShowcaseProps {
  trips: Trip[];
  onNavigateTab: (tab: any) => void;
}

const DEFAULT_COVERS: Record<string, string> = {
  'đà nẵng':
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
  'hà giang':
    'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
  'sapa':
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
  'phú quốc':
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop',
  'đà lạt':
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  'nha trang':
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
  default:
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
};

const getTripCoverImage = (trip: Trip): string => {
  if (trip.coverImage && trip.coverImage.trim()) {
    return trip.coverImage;
  }
  const destLower = (trip.destination || trip.title || '').toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_COVERS)) {
    if (key !== 'default' && destLower.includes(key)) {
      return url;
    }
  }
  return DEFAULT_COVERS.default;
};

export const DashboardTripsShowcase: React.FC<DashboardTripsShowcaseProps> = ({
  trips,
  onNavigateTab,
}) => {
  const now = new Date();

  // Chỉ hiển thị chuyến đi ĐANG DIỄN RA và chuyến đi SẮP TỚI
  const activeTrips = useMemo(() => {
    if (!trips || trips.length === 0) return [];
    return trips
      .filter((t) => {
        // Loại bỏ chuyến đi đã hoàn thành
        if (t.status === 'completed') return false;

        try {
          const start = parseISO(t.startDate);
          const end = t.endDate ? parseISO(t.endDate) : start;
          // Kết thúc được tính đến 23:59:59 của ngày kết thúc
          end.setHours(23, 59, 59, 999);

          // 1. Đang diễn ra
          const isOngoing =
            t.status === 'ongoing' ||
            (start.getTime() <= now.getTime() && end.getTime() >= now.getTime());

          // 2. Sắp tới (chưa đến ngày bắt đầu)
          const isUpcoming = start.getTime() > now.getTime();

          return isOngoing || isUpcoming;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [trips, now]);

  // Nếu không có chuyến đi nào đang diễn ra hoặc sắp tới -> ẩn phần này
  if (activeTrips.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Hành Trình & Chuyến Đi Nghỉ Dưỡng
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-700/60">
                {activeTrips.length} chuyến đi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chuyến đi đang diễn ra và kế hoạch sắp tới cùng gia đình
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('travel')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm chuyến đi mới</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('travel')}
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline px-2 py-1"
          >
            Xem tất cả →
          </button>
        </div>
      </div>

      {/* Trips Content */}
      {activeTrips.length === 1 ? (
        /* 1 Trip: Wide Featured Magazine-style Panoramic Hero Card */
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('travel')}
          className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:border-teal-500/50 transition-all duration-300 cursor-pointer flex flex-col md:flex-row"
        >
          {/* Cover Photo with rich overlay */}
          <div className="relative md:w-5/12 h-56 sm:h-64 md:h-auto overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
            <img
              src={getTripCoverImage(activeTrips[0])}
              alt={activeTrips[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

            {/* Top Badge overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-600 text-white backdrop-blur-md shadow-md">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeTrips[0].destination || 'Điểm đến du lịch'}</span>
              </span>
            </div>

            {/* Countdown Badge overlay */}
            {(() => {
              const start = parseISO(activeTrips[0].startDate);
              const end = parseISO(activeTrips[0].endDate);
              const daysLeft = differenceInCalendarDays(start, now);
              const isOngoing =
                activeTrips[0].status === 'ongoing' ||
                (daysLeft <= 0 && differenceInCalendarDays(end, now) >= 0);

              return (
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-md shadow-md ${
                      isOngoing
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : daysLeft <= 3
                        ? 'bg-amber-500 text-white'
                        : 'bg-black/60 text-white border border-white/20'
                    }`}
                  >
                    {isOngoing
                      ? 'Đang diễn ra hôm nay! 🎉'
                      : daysLeft === 0
                      ? 'Khởi hành hôm nay! ✈️'
                      : `Còn ${daysLeft} ngày nữa khởi hành ✈️`}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Card Body Details */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {format(parseISO(activeTrips[0].startDate), 'dd/MM/yyyy')} —{' '}
                  {format(parseISO(activeTrips[0].endDate), 'dd/MM/yyyy')}
                </span>
                <span className="text-slate-400 font-normal">
                  ({differenceInCalendarDays(parseISO(activeTrips[0].endDate), parseISO(activeTrips[0].startDate)) + 1} ngày)
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {activeTrips[0].title}
              </h4>

              {activeTrips[0].notes && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {activeTrips[0].notes}
                </p>
              )}
            </div>

            {/* Metrics & Progress Section */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dự toán ngân sách</span>
                </div>
                <div className="text-sm sm:text-base font-extrabold font-mono text-slate-900 dark:text-white">
                  {activeTrips[0].budget > 0 ? formatCurrency(activeTrips[0].budget) : 'Chưa nhập'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <Luggage className="w-3.5 h-3.5 text-teal-500" />
                  <span>Hành lý chuẩn bị</span>
                </div>
                <div className="text-sm sm:text-base font-extrabold font-mono text-teal-600 dark:text-teal-400">
                  {activeTrips[0].checklist && activeTrips[0].checklist.length > 0
                    ? `${activeTrips[0].checklist.filter((i) => i.completed).length}/${activeTrips[0].checklist.length} món`
                    : 'Chưa có checklist'}
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Lịch trình • Khách sạn & Vé • Album ảnh chia sẻ
              </span>
              <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                <span>Chi tiết chuyến đi</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Multiple Trips: Responsive Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {activeTrips.map((trip) => {
            const start = parseISO(trip.startDate);
            const end = parseISO(trip.endDate);
            const daysLeft = differenceInCalendarDays(start, now);
            const isOngoing =
              trip.status === 'ongoing' ||
              (daysLeft <= 0 && differenceInCalendarDays(end, now) >= 0);
            const cover = getTripCoverImage(trip);

            return (
              <div
                key={trip.id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigateTab('travel')}
                className="group overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={cover}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    {/* Top tags */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/50 text-white backdrop-blur-md border border-white/20">
                        <MapPin className="w-3 h-3 text-teal-300" />
                        <span className="truncate max-w-[120px]">{trip.destination || 'Điểm đến'}</span>
                      </span>

                      {/* Countdown badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md ${
                          isOngoing
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : daysLeft <= 3 && daysLeft >= 0
                            ? 'bg-amber-500 text-white'
                            : 'bg-teal-600 text-white'
                        }`}
                      >
                        {isOngoing
                          ? 'Đang diễn ra 🎉'
                          : daysLeft === 0
                          ? 'Khởi hành hôm nay ✈️'
                          : `Còn ${daysLeft} ngày ✈️`}
                      </span>
                    </div>

                    {/* Title on photo */}
                    <div className="absolute bottom-3 inset-x-3 text-white space-y-0.5">
                      <h4 className="text-base sm:text-lg font-extrabold tracking-tight truncate drop-shadow-md">
                        {trip.title}
                      </h4>
                      <p className="text-xs text-white/90 drop-shadow flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(start, 'dd/MM/yyyy')} - {format(end, 'dd/MM/yyyy')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs pt-1 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Dự toán:</span>
                      </div>
                      <span className="font-bold font-mono text-slate-900 dark:text-white">
                        {trip.budget > 0 ? formatCurrency(trip.budget) : 'Chưa nhập'}
                      </span>
                    </div>

                    {trip.checklist && trip.checklist.length > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Luggage className="w-3.5 h-3.5 text-teal-500" />
                          <span>Hành lý:</span>
                        </div>
                        <span className="font-bold font-mono text-teal-600 dark:text-teal-400">
                          {trip.checklist.filter((i) => i.completed).length}/{trip.checklist.length} món
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-4 pt-0">
                  <div className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700">
                    <span>Xem lịch trình chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
