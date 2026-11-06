'use client';

import React, { useState } from 'react';
import { CashflowBarChart } from './CashflowBarChart';
import { TeachingLoadBarChart } from './TeachingLoadBarChart';
import { SpendingDonutChart } from './SpendingDonutChart';
import { ExpenseItem } from '@/features/spending/types';
import { IncomeTransaction } from '@/features/income/types';
import { ClassSessionEntity } from '@/features/class/types';
import { SchoolTimetable } from '@/features/teaching-schedule/types';
import { BarChart3, CalendarDays } from 'lucide-react';

interface DashboardChartsSectionProps {
  expenses: ExpenseItem[];
  incomeTransactions: IncomeTransaction[];
  sessions: ClassSessionEntity[];
  timetable: SchoolTimetable | null;
  myTeacher: string;
  selectedMonth: string;
  onNavigateTab: (tab: any) => void;
}

export const DashboardChartsSection: React.FC<DashboardChartsSectionProps> = ({
  expenses,
  incomeTransactions,
  sessions,
  timetable,
  myTeacher,
  selectedMonth,
  onNavigateTab,
}) => {
  const [activeMainChart, setActiveMainChart] = useState<'cashflow' | 'teaching'>('cashflow');

  return (
    <div className="space-y-3">
      {/* Chart Selector Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Trung Tâm Phân Tích & Biểu Đồ
          </span>
        </div>

        {/* Segmented Control Switcher */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMainChart('cashflow')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMainChart === 'cashflow'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dòng Tiền Thu - Chi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainChart('teaching')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeMainChart === 'teaching'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mật Độ Giảng Dạy Tuần</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 columns on desktop (Left: Main Bar/Trend Chart, Right: Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
        {/* Cột trái (Chiếm 2 phần trên desktop) */}
        <div className="lg:col-span-2 flex flex-col">
          {activeMainChart === 'cashflow' ? (
            <CashflowBarChart
              expenses={expenses}
              incomeTransactions={incomeTransactions}
              sessions={sessions}
              onNavigateTab={onNavigateTab}
            />
          ) : (
            <TeachingLoadBarChart
              timetable={timetable}
              myTeacher={myTeacher}
              sessions={sessions}
              onNavigateTab={onNavigateTab}
            />
          )}
        </div>

        {/* Cột phải (Chiếm 1 phần trên desktop): Donut Chart cơ cấu chi tiêu */}
        <div className="lg:col-span-1 flex flex-col">
          <SpendingDonutChart
            expenses={expenses}
            selectedMonth={selectedMonth}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>
    </div>
  );
};
