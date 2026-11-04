'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { SpendingStats, ExpenseCategory, FinanceViewMode } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBreakdownProps {
  stats: SpendingStats;
  selectedCategory: ExpenseCategory | 'all';
  onSelectCategory: (cat: ExpenseCategory | 'all') => void;
  viewMode?: FinanceViewMode;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  stats,
  selectedCategory,
  onSelectCategory,
  viewMode = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (viewMode === 'income') setActiveTab('income');
    else if (viewMode === 'expense') setActiveTab('expense');
  }, [viewMode]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasExpenses = stats.categoryBreakdown && stats.categoryBreakdown.length > 0;
  const hasIncomes = stats.incomeBreakdown && stats.incomeBreakdown.length > 0;

  // Fallback nếu tab hiện tại không có dữ liệu nhưng tab kia có
  const effectiveTab =
    activeTab === 'income'
      ? hasIncomes ? 'income' : 'expense'
      : hasExpenses ? 'expense' : 'income';

  const currentBreakdown =
    effectiveTab === 'income' ? stats.incomeBreakdown : stats.categoryBreakdown;

  if (!hasExpenses && !hasIncomes) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            effectiveTab === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
          }`}>
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {effectiveTab === 'income' ? 'Phân Bổ Nguồn Thu Nhập' : 'Phân Bổ Chi Tiêu Theo Danh Mục'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {effectiveTab === 'income'
                ? 'Tỷ lệ đóng góp theo từng nguồn thu nhập trong tháng'
                : 'Tỷ lệ chi tiêu theo các nhóm sinh hoạt trong tháng'}
            </p>
          </div>
        </div>

        {/* Breakdown Type Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {viewMode === 'all' && hasExpenses && hasIncomes && (
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/40 text-xs">
              <button
                onClick={() => setActiveTab('expense')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  effectiveTab === 'expense'
                    ? 'bg-card text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-3 w-3 text-rose-500" />
                <span>Chi tiêu ({stats.categoryBreakdown.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                  effectiveTab === 'income'
                    ? 'bg-card text-foreground shadow-xs font-semibold text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                <span>Thu nhập ({stats.incomeBreakdown.length})</span>
              </button>
            </div>
          )}

          {selectedCategory !== 'all' && (
            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs text-primary hover:underline font-medium"
            >
              Xem tất cả nhóm
            </button>
          )}
        </div>
      </div>

      {/* Multi-segmented stacked bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted/60">
        {currentBreakdown.map((item) => (
          <div
            key={item.category}
            className="h-full transition-all duration-300 hover:opacity-80"
            style={{
              width: `${Math.max(item.percent, 2)}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${formatVND(item.amount)} (${item.percent}%)`}
          />
        ))}
      </div>

      {/* Breakdown list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
        {currentBreakdown.map((item) => {
          const isSelected = selectedCategory === item.category;

          return (
            <button
              key={item.category}
              onClick={() => onSelectCategory(isSelected ? 'all' : item.category)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-sm'
                  : 'border-border/60 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow-xs"
                  style={{ backgroundColor: item.color }}
                >
                  <CategoryIcon name={item.iconName} className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground">{item.percent}%</span>
              </div>
              <div className="font-medium text-xs text-foreground truncate">{item.label}</div>
              <div className="text-[11px] text-muted-foreground font-semibold">
                {formatVND(item.amount)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
