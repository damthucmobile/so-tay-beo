'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, ArrowUpRight } from 'lucide-react';
import { ExpenseItem } from '@/features/spending/types';
import { formatCurrency } from '@/core/utils/formatters';

interface SpendingDonutChartProps {
  expenses: ExpenseItem[];
  selectedMonth: string;
  onNavigateTab: (tab: any) => void;
}

const CATEGORY_COLORS: Record<string, { label: string; color: string }> = {
  food: { label: 'Ăn uống', color: '#f97316' },
  shopping: { label: 'Mua sắm', color: '#ec4899' },
  transport: { label: 'Đi lại', color: '#3b82f6' },
  education: { label: 'Giáo dục', color: '#8b5cf6' },
  housing: { label: 'Nhà cửa & Điện nước', color: '#10b981' },
  entertainment: { label: 'Giải trí', color: '#06b6d4' },
  health: { label: 'Sức khỏe', color: '#ef4444' },
  savings: { label: 'Tiết kiệm & Đầu tư', color: '#14b8a6' },
  family: { label: 'Gia đình & Con cái', color: '#f59e0b' },
  other: { label: 'Khác', color: '#64748b' },
};

export const SpendingDonutChart: React.FC<SpendingDonutChartProps> = ({
  expenses,
  selectedMonth,
  onNavigateTab,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Lọc các khoản chi (expense) trong tháng hiện tại
  const { categoryList, totalExpense } = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => e.date && e.date.startsWith(selectedMonth) && (e.type === 'expense' || !e.type)
    );

    const grouped: Record<string, number> = {};
    let total = 0;

    monthExpenses.forEach((e) => {
      const cat = e.category || 'other';
      grouped[cat] = (grouped[cat] || 0) + e.amount;
      total += e.amount;
    });

    const list = Object.entries(grouped)
      .map(([cat, amount]) => {
        const meta = CATEGORY_COLORS[cat] || { label: cat, color: '#64748b' };
        const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
        return {
          id: cat,
          label: meta.label,
          color: meta.color,
          amount,
          percent,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { categoryList: list, totalExpense: total };
  }, [expenses, selectedMonth]);

  // Chu vi hình tròn R = 42
  const R = 42;
  const C = 2 * Math.PI * R;

  // Tính toán offset của từng phân đoạn
  const slices = useMemo(() => {
    let accumulatedPercent = 0;
    return categoryList.map((item) => {
      const strokeDasharray = `${(item.percent * C) / 100} ${C}`;
      const strokeDashoffset = -((accumulatedPercent * C) / 100);
      accumulatedPercent += item.percent;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [categoryList, C]);

  const activeItem = useMemo(() => {
    if (!hoveredCategory) return null;
    return categoryList.find((c) => c.id === hoveredCategory) || null;
  }, [hoveredCategory, categoryList]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Cơ Cấu Chi Tiêu
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tỷ trọng các nhóm trong tháng {selectedMonth.split('-')[1]}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('spending')}
          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          title="Xem chi tiết phân hệ chi tiêu"
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {totalExpense === 0 || categoryList.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <PieChart className="w-6 h-6 opacity-40" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Chưa có khoản chi nào trong tháng</p>
          <button
            type="button"
            onClick={() => onNavigateTab('spending')}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Ghi chép chi tiêu ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Donut Chart SVG */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="11"
                className="text-slate-100 dark:text-slate-800/80"
              />

              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredCategory === slice.id;
                return (
                  <circle
                    key={slice.id}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 13 : 11}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(slice.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Total / Active category label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[120px]">
                {activeItem ? activeItem.label : 'Tổng Chi'}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate max-w-[130px]">
                {activeItem ? formatCurrency(activeItem.amount) : formatCurrency(totalExpense)}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                {activeItem ? `${activeItem.percent}% tổng chi` : `${categoryList.length} danh mục`}
              </span>
            </div>
          </div>

          {/* Category Badges Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
            {categoryList.slice(0, 6).map((item) => {
              const isHovered = hoveredCategory === item.id;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredCategory(item.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 shadow-sm'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white shrink-0 ml-1">
                    {item.percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
