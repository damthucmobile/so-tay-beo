// features/travel/components/TripCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  MoreVertical,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  Share2,
} from 'lucide-react';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onSelect: (tripId: string) => void;
  onDelete: (tripId: string) => void;
  onShare?: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onSelect, onDelete, onShare }) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diff <= 1) return '1 ngày';
    return `${diff} ngày ${diff - 1} đêm`;
  };

  const statusConfig = {
    planning: {
      label: 'Đang lên lịch',
      badge: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
      icon: Clock,
    },
    ongoing: {
      label: 'Đang diễn ra',
      badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      icon: Sparkles,
    },
    completed: {
      label: 'Đã hoàn thành',
      badge: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400',
      icon: CheckCircle2,
    },
  }[trip.status];

  const StatusIcon = statusConfig.icon;
  const budgetPercent = trip.budget > 0 ? Math.min(100, Math.round((trip.spent / trip.budget) * 100)) : 0;

  return (
    <Card className="group overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Cover Image & Status Badge */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={
              trip.coverImage ||
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop'
            }
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm ${statusConfig.badge}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusConfig.label}</span>
            </span>

            <div className="flex items-center gap-1.5">
              {onShare && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(trip);
                  }}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-emerald-600 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer"
                  title="Chia sẻ chuyến đi & album cho gia đình"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Bạn có chắc muốn xóa chuyến đi "${trip.title}"?`)) {
                    onDelete(trip.id);
                  }
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/80 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer"
                title="Xóa chuyến đi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Destination & Duration Bottom overlay */}
          <div className="absolute bottom-3 inset-x-3 text-white">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base leading-snug line-clamp-2 text-white drop-shadow-sm">
              {trip.title}
            </h3>
          </div>
        </div>

        {/* Content Details */}
        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Dates & Duration */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {trip.startDate} → {trip.endDate}
              </span>
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">
              {calculateDays(trip.startDate, trip.endDate)}
            </span>
          </div>

          {/* Budget Progress */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Chi phí / Ngân sách</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatVND(trip.spent)} / <span className="text-slate-400">{formatVND(trip.budget)}</span>
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 90
                    ? 'bg-rose-500'
                    : budgetPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
          </div>

          {/* Members & Activities count */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {trip.members && trip.members.length > 0 ? (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{trip.members.join(', ')}</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Chuyến đi cá nhân</span>
            )}

            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md shrink-0">
              {trip.itinerary.reduce((total, d) => total + d.activities.length, 0)} hoạt động
            </span>
          </div>
        </CardContent>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <Button
          onClick={() => onSelect(trip.id)}
          variant="outline"
          className="w-full justify-between hover:bg-emerald-600 hover:text-white hover:border-emerald-600 group/btn transition-colors"
        >
          <span>Xem chi tiết lịch trình</span>
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
