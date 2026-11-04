'use client';

import React from 'react';
import { PieChart } from 'lucide-react';
import { SpendingStats, ExpenseCategory } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBreakdownProps {
  stats: SpendingStats;
  selectedCategory: ExpenseCategory | 'all';
  onSelectCategory: (cat: ExpenseCategory | 'all') => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  stats,
  selectedCategory,
  onSelectCategory,
}) => {
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!stats.categoryBreakdown || stats.categoryBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Phân Bổ Chi Tiêu Theo Danh Mục</h3>
            <p className="text-xs text-muted-foreground">Tỷ lệ chi tiêu theo các nhóm sinh hoạt trong tháng</p>
          </div>
        </div>

        {selectedCategory !== 'all' && (
          <button
            onClick={() => onSelectCategory('all')}
            className="text-xs text-primary hover:underline font-medium"
          >
            Xem tất cả nhóm
          </button>
        )}
      </div>

      {/* Multi-segmented stacked bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-muted/60">
        {stats.categoryBreakdown.map((item) => (
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
        {stats.categoryBreakdown.map((item) => {
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
