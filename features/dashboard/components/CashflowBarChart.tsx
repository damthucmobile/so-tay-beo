'use client';

import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ExpenseItem } from '@/features/spending/types';
import { IncomeTransaction } from '@/features/income/types';
import { ClassSessionEntity } from '@/features/class/types';
import { subMonths, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatCurrency } from '@/core/utils/formatters';

interface CashflowBarChartProps {
  expenses: ExpenseItem[];
  incomeTransactions: IncomeTransaction[];
  sessions: ClassSessionEntity[];
  onNavigateTab: (tab: any) => void;
}

const formatCompactVND = (amount: number): string => {
  if (!amount || amount <= 0) return '0';
  if (amount >= 1_000_000_000) {
    const val = Math.floor(amount / 100_000_000) / 10;
    return `${val.toFixed(1).replace('.', ',')}tỷ`;
  }
  if (amount >= 100_000) {
    const val = Math.floor(amount / 100_000) / 10;
    return `${val.toFixed(1).replace('.', ',')}tr`;
  }
  if (amount >= 1_000) {
    const val = Math.floor(amount / 100) / 10;
    return `${val.toFixed(1).replace('.', ',')}k`;
  }
  return `${amount}`;
};

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({
  expenses,
  incomeTransactions,
  sessions,
  onNavigateTab,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Tạo danh sách 6 tháng gần nhất (tính từ tháng hiện tại lùi về trước)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { monthKey: string; label: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const monthKey = format(d, 'yyyy-MM');
      const label = `Tháng ${format(d, 'M')}`;

      // 1. Tính Thu nhập:
      // a. Từ các buổi dạy lớp đã hoàn thành
      const monthSessions = sessions.filter(
        (s) => s.sessionDate && s.sessionDate.startsWith(monthKey) && s.status === 'COMPLETED'
      );
      const classIncome = monthSessions.reduce((sum, s) => sum + (s.calculatedSalary || 0), 0);

      // b. Từ giao dịch thu nhập ngoài
      const monthIncomeTx = incomeTransactions.filter(
        (tx) => tx.date && tx.date.startsWith(monthKey)
      );
      const freelanceIncome = monthIncomeTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // c. Từ các khoản ghi chép thu nhập trong phân hệ spending (nếu có)
      const spendingIncomes = expenses
        .filter((e) => e.date && e.date.startsWith(monthKey) && e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0);

      const totalIncome = classIncome + freelanceIncome + spendingIncomes;

      // 2. Tính Chi tiêu:
      const monthExpenses = expenses
        .filter((e) => e.date && e.date.startsWith(monthKey) && (e.type === 'expense' || !e.type))
        .reduce((sum, e) => sum + e.amount, 0);

      months.push({
        monthKey,
        label,
        income: totalIncome,
        expense: monthExpenses,
      });
    }

    return months;
  }, [expenses, incomeTransactions, sessions]);

  // Giá trị max để tính tỷ lệ phần trăm chiều cao cột
  const maxVal = useMemo(() => {
    let max = 1000000; // Mặc định ít nhất 1 triệu để tránh chia 0
    monthlyData.forEach((m) => {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    });
    return max * 1.25; // Thêm 25% headroom để số liệu trên đầu cột luôn hiển thị đẹp
  }, [monthlyData]);

  // Kích thước SVG
  const svgWidth = 520;
  const svgHeight = 195;
  const chartBottom = 160;
  const chartTop = 28;
  const chartHeight = chartBottom - chartTop;

  // Tính tổng dòng tiền tháng này (tháng cuối cùng trong mảng)
  const currentMonthData = monthlyData[monthlyData.length - 1] || { income: 0, expense: 0 };
  const netCashflow = currentMonthData.income - currentMonthData.expense;

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-3 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Tương Quan Thu - Chi
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-700/60">
                6 Tháng gần nhất
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Đối soát thù lao thu nhập và chi tiêu sinh hoạt hàng tháng
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold self-start sm:self-auto">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span>Thu nhập</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span>Chi tiêu</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Dotted horizontal guidelines */}
          {[0, 0.33, 0.66, 1].map((ratio) => {
            const y = chartBottom - ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1="20"
                y1={y}
                x2={svgWidth - 20}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
              />
            );
          })}

          {/* Render Bars for each month */}
          {monthlyData.map((m, idx) => {
            const totalSlots = monthlyData.length;
            const slotWidth = (svgWidth - 60) / totalSlots;
            const groupX = 35 + idx * slotWidth;

            const barW = Math.min(18, slotWidth * 0.32);
            const gap = 4;

            const incomeH = Math.max(4, (m.income / maxVal) * chartHeight);
            const expenseH = Math.max(4, (m.expense / maxVal) * chartHeight);

            const incomeY = chartBottom - incomeH;
            const expenseY = chartBottom - expenseH;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={m.monthKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupX - 6}
                    y={chartTop - 5}
                    width={barW * 2 + gap + 12}
                    height={chartHeight + 15}
                    rx="8"
                    className="fill-slate-100/70 dark:fill-slate-800/60"
                  />
                )}

                {/* Income Bar (Blue) */}
                <rect
                  x={groupX}
                  y={incomeY}
                  width={barW}
                  height={incomeH}
                  rx="4"
                  fill="url(#incomeBarGrad)"
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Số tiền Thu nhập trên đầu cột */}
                <text
                  x={groupX + barW / 2}
                  y={incomeY - 4}
                  textAnchor="middle"
                  className="text-[9px] font-extrabold font-mono fill-blue-600 dark:fill-blue-400 select-none pointer-events-none"
                >
                  {formatCompactVND(m.income)}
                </text>

                {/* Expense Bar (Rose) */}
                <rect
                  x={groupX + barW + gap}
                  y={expenseY}
                  width={barW}
                  height={expenseH}
                  rx="4"
                  fill="url(#expenseBarGrad)"
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Số tiền Chi tiêu trên đầu cột */}
                <text
                  x={groupX + barW + gap + barW / 2}
                  y={expenseY - 4}
                  textAnchor="middle"
                  className="text-[9px] font-extrabold font-mono fill-rose-500 dark:fill-rose-400 select-none pointer-events-none"
                >
                  {formatCompactVND(m.expense)}
                </text>

                {/* Month label */}
                <text
                  x={groupX + barW + gap / 2}
                  y={chartBottom + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors ${
                    isHovered
                      ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-4 bg-slate-900/95 dark:bg-slate-800/95 text-white p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-xs pointer-events-none space-y-1 animate-fadeIn">
            <div className="font-bold border-b border-slate-700 pb-1 text-slate-200">
              {monthlyData[hoveredIndex].label}
            </div>
            <div className="flex items-center justify-between gap-4 text-blue-400">
              <span>Thu nhập:</span>
              <span className="font-mono font-bold">
                {formatCurrency(monthlyData[hoveredIndex].income)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span>Chi tiêu:</span>
              <span className="font-mono font-bold">
                {formatCurrency(monthlyData[hoveredIndex].expense)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-slate-700 text-slate-300">
              <span>Chênh lệch:</span>
              <span
                className={`font-mono font-bold ${
                  monthlyData[hoveredIndex].income >= monthlyData[hoveredIndex].expense
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {formatCurrency(
                  monthlyData[hoveredIndex].income - monthlyData[hoveredIndex].expense
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer Pill */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400">Tháng này:</span>
          <span
            className={`font-bold inline-flex items-center gap-0.5 ${
              netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {netCashflow >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {netCashflow >= 0 ? 'Thặng dư' : 'Thâm hụt'} {formatCurrency(Math.abs(netCashflow))}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('income')}
          className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
        >
          Chi tiết đối soát →
        </button>
      </div>
    </div>
  );
};
