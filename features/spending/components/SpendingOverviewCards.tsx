'use client';

import React from 'react';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Target,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Plus,
} from 'lucide-react';
import { SpendingStats } from '../types';
import { Button } from '@/components/ui/button';

interface SpendingOverviewCardsProps {
  stats: SpendingStats;
  onOpenBudgetModal: () => void;
  onOpenCreateExpense: () => void;
  onOpenCreateIncome?: () => void;
}

export const SpendingOverviewCards: React.FC<SpendingOverviewCardsProps> = ({
  stats,
  onOpenBudgetModal,
  onOpenCreateExpense,
  onOpenCreateIncome,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isOverBudget = stats.monthlyBudget > 0 && stats.totalExpense > stats.monthlyBudget;
  const isNearBudget =
    stats.monthlyBudget > 0 &&
    !isOverBudget &&
    stats.percentUsed >= 85;

  const isPositiveNet = stats.netBalance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Tổng Thu Nhập */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-card via-card to-emerald-500/5 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Tổng thu nhập tháng
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            +{formatVND(stats.totalIncome)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span className="truncate">
              {stats.topIncomeCategory
                ? `Chủ yếu: ${stats.topIncomeCategory.label}`
                : 'Chưa có khoản thu'}
            </span>
            {onOpenCreateIncome && (
              <button
                onClick={onOpenCreateIncome}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[11px] shrink-0"
              >
                + Ghi thu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tổng Chi Tiêu */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-b from-card via-card to-rose-500/5 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Tổng chi tiêu tháng
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            -{formatVND(stats.totalExpense)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span className="truncate">
              Trung bình: {formatVND(stats.dailyAverage)}/ngày
            </span>
            <button
              onClick={onOpenCreateExpense}
              className="text-rose-600 dark:text-rose-400 hover:underline font-medium text-[11px] shrink-0"
            >
              + Ghi chi
            </button>
          </div>
        </div>
      </div>

      {/* 3. Số Dư Ròng (Thu - Chi) */}
      <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group ${
        isPositiveNet
          ? 'border-border/60 bg-gradient-to-b from-card to-card/60'
          : 'border-rose-500/30 bg-rose-500/5'
      }`}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-primary" />
            Số dư tích lũy
          </span>
          <div className={`p-2 rounded-xl ${
            isPositiveNet ? 'bg-primary/10 text-primary' : 'bg-rose-500/10 text-rose-500'
          }`}>
            <Wallet className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <div className={`text-2xl font-bold tracking-tight ${
            isPositiveNet
              ? 'text-foreground'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isPositiveNet ? '+' : ''}{formatVND(stats.netBalance)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <span className={isPositiveNet ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400 font-medium'}>
              {isPositiveNet ? 'Thặng dư tài chính' : 'Thâm hụt chi tiêu'}
            </span>
            {stats.totalIncome > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted font-semibold">
                Tiết kiệm {stats.savingsRate}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Ngân Sách Chi Tiêu */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Hạn mức ngân sách
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenBudgetModal}
            className="h-6 text-xs px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <Target className="h-3.5 w-3.5 mr-1" />
            {stats.monthlyBudget > 0 ? 'Sửa' : 'Đặt'}
          </Button>
        </div>
        <div className="space-y-1.5">
          {stats.monthlyBudget > 0 ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-tight text-foreground">
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
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
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
                    Vượt {formatVND(stats.totalExpense - stats.monthlyBudget)}
                  </span>
                ) : (
                  <span>Còn lại {formatVND(stats.remainingBudget)}</span>
                )}
                <span>100%</span>
              </div>
            </>
          ) : (
            <div className="py-0.5">
              <p className="text-xs text-muted-foreground mb-1.5">Chưa đặt hạn mức tháng</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenBudgetModal}
                className="w-full text-xs h-7 border-dashed"
              >
                + Đặt hạn mức chi
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
