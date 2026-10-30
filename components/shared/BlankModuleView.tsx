// components/shared/BlankModuleView.tsx
'use client';

import React from 'react';
import {
  Sparkles,
  Plus,
  FolderOpen,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

interface BlankModuleViewProps {
  category: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: 'rose' | 'emerald' | 'cyan' | 'amber' | 'indigo' | 'purple' | 'blue';
  emptyStateTip?: string;
  suggestedCards?: Array<{
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    tag?: string;
  }>;
}

const COLOR_MAP = {
  rose: {
    bgLight: 'bg-rose-50/70 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900/40',
    text: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
    gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
  },
  emerald: {
    bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
  },
  cyan: {
    bgLight: 'bg-cyan-50/70 dark:bg-cyan-950/20',
    border: 'border-cyan-200 dark:border-cyan-900/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300',
    btn: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-500/20',
    gradient: 'from-cyan-500/10 via-sky-500/5 to-transparent',
  },
  amber: {
    bgLight: 'bg-amber-50/70 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
  },
  indigo: {
    bgLight: 'bg-indigo-50/70 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-900/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
    gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
  },
  purple: {
    bgLight: 'bg-purple-50/70 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-900/40',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20',
    gradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
  },
  blue: {
    bgLight: 'bg-blue-50/70 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/40',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
  },
};

export const BlankModuleView: React.FC<BlankModuleViewProps> = ({
  category,
  title,
  subtitle,
  description,
  icon: Icon,
  accentColor = 'blue',
  emptyStateTip,
  suggestedCards = [],
}) => {
  const colors = COLOR_MAP[accentColor] || COLOR_MAP.blue;

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div
        className={`relative overflow-hidden rounded-3xl border ${colors.border} bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-sm backdrop-blur-xl`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} pointer-events-none opacity-80`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${colors.bgLight} ${colors.text} border ${colors.border} flex items-center justify-center shrink-0 shadow-sm`}
            >
              <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors.badge}`}
                >
                  <Sparkles className="w-3 h-3" />
                  {category}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">• Không gian cá nhân</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tùy chỉnh</span>
            </button>

            <button
              type="button"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 ${colors.btn}`}
            >
              <Plus className="w-4 h-4" />
              <span>Tạo mục mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Sub-features / Starter Cards */}
      {suggestedCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Tính năng gợi ý</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedCards.map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl ${colors.bgLight} ${colors.text} flex items-center justify-center`}
                      >
                        <CardIcon className="w-5 h-5" />
                      </div>
                      {card.tag && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {card.tag}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Khám phá ngay</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State Showcase */}
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div
          className={`w-16 h-16 rounded-3xl ${colors.bgLight} ${colors.text} border ${colors.border} flex items-center justify-center shadow-inner`}
        >
          <FolderOpen className="w-8 h-8 opacity-80" />
        </div>

        <div className="max-w-md space-y-1.5">
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">
            Không gian đang sẵn sàng khởi tạo
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
          {emptyStateTip && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium italic pt-1">
              💡 {emptyStateTip}
            </p>
          )}
        </div>

        <button
          type="button"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 ${colors.btn}`}
        >
          <Plus className="w-4 h-4" />
          <span>Bắt đầu ghi chú đầu tiên</span>
        </button>
      </div>
    </div>
  );
};
