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
  CheckCircle2,
  Bookmark,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { UnifiedTimelineEvent } from '../types';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface TodayUnifiedTimelineProps {
  events: UnifiedTimelineEvent[];
  selectedDate: string; // 'YYYY-MM-DD'
  activeTeacher?: string;
  teachers?: string[];
  isMyTeacher?: boolean;
  onSelectTeacher?: (teacher: string) => void;
  onToggleMyTeacher?: () => void;
  onNavigateTab: (tab: any) => void;
}

export const TodayUnifiedTimeline: React.FC<TodayUnifiedTimelineProps> = ({
  events,
  selectedDate,
  activeTeacher,
  teachers = [],
  isMyTeacher = false,
  onSelectTeacher,
  onToggleMyTeacher,
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

  // Đếm số lượng theo loại
  const counts = useMemo(() => {
    const school = events.filter((e) => e.type === 'school').length;
    const classCount = events.filter((e) => e.type === 'class').length;
    const appointment = events.filter((e) => e.type === 'appointment').length;
    return {
      all: events.length,
      school,
      class: classCount,
      appointment,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const filterTabs = [
    { id: 'all', label: 'Tất cả', count: counts.all },
    { id: 'school', label: 'Trường học', count: counts.school },
    { id: 'class', label: 'Lớp ngoài', count: counts.class },
    { id: 'appointment', label: 'Lịch hẹn', count: counts.appointment },
  ];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3">
        {/* Row 1: Icon, Title & Date badge */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {isToday ? 'Lịch Trình Hôm Nay' : 'Lịch Trình Trong Ngày'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Tiết dạy nhà trường, lớp ngoài & lịch hẹn
              </p>
            </div>
          </div>

          {/* Date Badge */}
          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50 whitespace-nowrap shadow-xs">
              {formattedDateTitle}
            </span>
          </div>
        </div>

        {/* Row 2: Teacher Selector Bar (Hiển thị & chọn giáo viên của TKB) */}
        {teachers && teachers.length > 0 && activeTeacher && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Lịch dạy:
              </span>
              <div className="relative min-w-0 flex-1 max-w-[170px] sm:max-w-[240px]">
                <select
                  value={activeTeacher}
                  onChange={(e) => onSelectTeacher?.(e.target.value)}
                  className="w-full text-xs font-bold text-blue-700 dark:text-blue-300 bg-transparent pr-6 truncate focus:outline-none cursor-pointer py-0.5"
                >
                  {teachers.map((t) => (
                    <option key={t} value={t} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                      Thầy/Cô: {t} {t === activeTeacher && isMyTeacher ? '★ (Của tôi)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-blue-500 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Ghim làm TKB của tôi */}
              {onToggleMyTeacher && (
                <button
                  type="button"
                  onClick={onToggleMyTeacher}
                  title={isMyTeacher ? 'Đã ghim làm giáo viên mặc định của bạn' : 'Ghim làm giáo viên mặc định của bạn'}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition shrink-0 active:scale-95 cursor-pointer ${
                    isMyTeacher
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60'
                      : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-amber-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Bookmark className={`w-3 h-3 ${isMyTeacher ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span className="hidden sm:inline">{isMyTeacher ? 'Đã ghim' : 'Ghim'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('teaching_schedule')}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 px-1.5 py-0.5"
            >
              Xem TKB trường →
            </button>
          </div>
        )}

        {/* Row 3: Filter Pills with Count */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
          {filterTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterType(item.id as any)}
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  filterType === item.id
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.count}
              </span>
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
              {activeTeacher ? `Thầy/Cô ${activeTeacher} không có tiết dạy trường hay lịch hẹn nào.` : 'Không có tiết dạy trường hay lịch hẹn nào được ghi nhận.'}
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
        <div className="space-y-2.5 sm:space-y-3">
          {filteredEvents.map((event) => {
            let badgeBg = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60';
            let badgeBorder = 'border-l-blue-500';
            let badgeText = 'Nhà trường';
            let TypeIcon = CalendarDays;
            let targetTab = 'teaching_schedule';

            if (event.type === 'class') {
              badgeBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60';
              badgeBorder = 'border-l-emerald-500';
              badgeText = 'Lớp ngoài';
              TypeIcon = GraduationCap;
              targetTab = 'classes';
            } else if (event.type === 'appointment') {
              badgeBg = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60';
              badgeBorder = 'border-l-amber-500';
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
                className={`group relative flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 border-l-4 ${badgeBorder} shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer gap-2.5 sm:gap-3.5`}
              >
                {/* Left: Time Block */}
                <div className="flex flex-col items-center justify-center min-w-[58px] sm:min-w-[64px] py-1.5 px-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                    {event.timeStart}
                  </span>
                  {event.timeEnd && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {event.timeEnd}
                    </span>
                  )}
                </div>

                {/* Middle Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeBg}`}>
                      <TypeIcon className="w-3 h-3" />
                      <span>{badgeText}</span>
                    </span>

                    {event.status === 'ongoing' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Đang diễn ra</span>
                      </span>
                    )}

                    {event.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Đã xong</span>
                      </span>
                    )}

                    {event.location && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {event.title}
                  </h4>

                  {event.subtitle && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {event.subtitle}
                    </p>
                  )}
                </div>

                {/* Right Arrow */}
                <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 p-1">
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
