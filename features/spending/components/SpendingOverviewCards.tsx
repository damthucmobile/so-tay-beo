'use client';

import React from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { SpendingStats } from '../types';
import { Button } from '@/components/ui/button';

interface SpendingOverviewCardsProps {
  stats: SpendingStats;
  onOpenBudgetModal: () => void;
  onOpenCreateExpense: () => void;
}

export const SpendingOverviewCards: React.FC<SpendingOverviewCardsProps> = ({
  stats,
  onOpenBudgetModal,
  onOpenCreateExpense,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isOverBudget = stats.monthlyBudget > 0 && stats.totalSpent > stats.monthlyBudget;
  const isNearBudget =
    stats.monthlyBudget > 0 &&
    !isOverBudget &&
    stats.percentUsed >= 85;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng Chi Tiêu Tháng */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/60 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tổng chi tiêu tháng
          </span>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatVND(stats.totalSpent)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
            <span>Khoản tiền đã xuất ra trong tháng</span>
          </div>
        </div>
      </div>

      {/* 2. Ngân Sách & Tiến Độ */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/60 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hạn mức ngân sách
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenBudgetModal}
            className="h-7 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Target className="h-3.5 w-3.5 mr-1" />
            {stats.monthlyBudget > 0 ? 'Điều chỉnh' : 'Thiết lập'}
          </Button>
        </div>
        <div className="space-y-2">
          {stats.monthlyBudget > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {formatVND(stats.monthlyBudget)}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isOverBudget
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                      : isNearBudget
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {stats.percentUsed}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : isNearBudget
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                />
              </div>

              <div className="text-[11px] text-muted-foreground flex justify-between">
                {isOverBudget ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Vượt {formatVND(stats.totalSpent - stats.monthlyBudget)}
                  </span>
                ) : (
                  <span>Còn lại {formatVND(stats.remainingBudget)}</span>
                )}
                <span>100%</span>
              </div>
            </>
          ) : (
            <div className="py-1">
              <p className="text-xs text-muted-foreground mb-2">Chưa đặt hạn mức chi tiêu tháng</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBudgetModal}
                className="w-full text-xs h-8 border-dashed"
              >
                + Đặt hạn mức chi tiêu
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Trung Bình Mỗi Ngày */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/60 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trung bình mỗi ngày
          </span>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatVND(stats.dailyAverage)}
          </div>
          <p className="text-xs text-muted-foreground">
            Tính trên các ngày đã qua trong tháng
          </p>
        </div>
      </div>

      {/* 4. Nhóm Chi Tiêu Nhiều Nhất */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/60 p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nhóm chi nhiều nhất
          </span>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          {stats.topCategory ? (
            <>
              <div className="text-xl font-bold tracking-tight text-foreground truncate">
                {stats.topCategory.label}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {formatVND(stats.topCategory.amount)}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-medium">
                  {stats.topCategory.percent}% tổng chi
                </span>
              </div>
            </>
          ) : (
            <div className="py-2 text-xs text-muted-foreground">
              Chưa có khoản chi tiêu nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
