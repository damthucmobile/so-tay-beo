// features/travel/components/TripStats.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, CalendarCheck, Clock, Wallet, TrendingUp } from 'lucide-react';
import { Trip } from '../types';

interface TripStatsProps {
  trips: Trip[];
}

export const TripStats: React.FC<TripStatsProps> = ({ trips }) => {
  const totalTrips = trips.length;
  const planningTrips = trips.filter((t) => t.status === 'planning').length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
  const totalSpent = trips.reduce((sum, t) => sum + (t.spent || 0), 0);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="hover:border-emerald-500/50 transition-all bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng Chuyến Đi
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalTrips}
            </h4>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Đã ghi nhận trong sổ tay
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:border-blue-500/50 transition-all bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đang Lên Lịch
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {planningTrips}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              Chuyến đi sắp khởi hành
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:border-violet-500/50 transition-all bg-gradient-to-br from-white to-violet-50/20 dark:from-slate-900 dark:to-violet-950/20">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đã Hoàn Thành
            </p>
            <h4 className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
              {completedTrips}
            </h4>
            <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">
              Hành trình trọn vẹn
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="hover:border-amber-500/50 transition-all bg-gradient-to-br from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/20">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng Ngân Sách
            </p>
            <h4 className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 mt-1 truncate max-w-[120px] sm:max-w-[150px]">
              {formatVND(totalBudget)}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              Đã chi: {formatVND(totalSpent)}
            </span>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
