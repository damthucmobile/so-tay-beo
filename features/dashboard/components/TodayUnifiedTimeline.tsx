'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  MapPin,
  CalendarDays,
  Coffee,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { UnifiedTimelineEvent } from '../types';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TodayUnifiedTimelineProps {
  events: UnifiedTimelineEvent[];
  selectedDate: string; // 'YYYY-MM-DD'
  onNavigateTab: (tab: any) => void;
}

export const TodayUnifiedTimeline: React.FC<TodayUnifiedTimelineProps> = ({
  events,
  selectedDate,
  onNavigateTab,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'school' | 'class' | 'appointment'>('all');

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isToday = selectedDate === todayStr;

  const formattedDateTitle = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      const dayName = format(d, 'EEEE', { locale: vi });
      const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return `${capDay}, ${format(d, 'dd/MM/yyyy')}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isToday ? 'Lịch Trình Hôm Nay' : 'Lịch Trình Trong Ngày'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {formattedDateTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng hợp tiết dạy nhà trường, lớp ngoài & lịch hẹn
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'school', label: 'Trường học' },
            { id: 'class', label: 'Lớp ngoài' },
            { id: 'appointment', label: 'Lịch hẹn' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id as any)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                filterType === item.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List or Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Coffee className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Không có lịch trình nào vào {isToday ? 'hôm nay' : 'ngày này'}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Không có tiết dạy trường hay lịch hẹn nào được ghi nhận. Bạn có thể lên lịch hẹn mới hoặc nghỉ ngơi thư giãn.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab('teaching_schedule')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              Xem TKB trường
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('schedule')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition cursor-pointer"
            >
              + Lên lịch hẹn mới
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            let badgeBg = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
            let badgeText = 'Nhà trường';
            let TypeIcon = CalendarDays;
            let targetTab = 'teaching_schedule';

            if (event.type === 'class') {
              badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
              badgeText = 'Lớp ngoài';
              TypeIcon = GraduationCap;
              targetTab = 'classes';
            } else if (event.type === 'appointment') {
              badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
              badgeText = 'Lịch hẹn';
              TypeIcon = Briefcase;
              targetTab = 'schedule';
            }

            return (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => onNavigateTab(targetTab)}
                className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-50/70 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/40 transition-all duration-150 cursor-pointer gap-3"
              >
                {/* Left: Time and Icon */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center min-w-[56px] sm:min-w-[64px] py-1.5 px-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 shadow-sm shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                      {event.timeStart}
                    </span>
                    {event.timeEnd && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {event.timeEnd}
                      </span>
                    )}
                  </div>

                  {/* Info: Title & Subtitle / Room */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${badgeBg}`}>
                        <TypeIcon className="w-3 h-3" />
                        <span>{badgeText}</span>
                      </span>

                      {event.status === 'ongoing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Đang diễn ra</span>
                        </span>
                      )}

                      {event.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Đã xong</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {event.title}
                    </h4>

                    {(event.subtitle || event.location) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {event.subtitle && <span className="truncate">{event.subtitle}</span>}
                        {event.location && (
                          <span className="inline-flex items-center gap-0.5 shrink-0 text-slate-400 font-medium">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
