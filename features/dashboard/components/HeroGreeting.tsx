'use client';

import React, { useMemo } from 'react';
import { Sun, Sunset, Moon, Calendar, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

interface HeroGreetingProps {
  userName?: string | null;
  todayCount: number;
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const HeroGreeting: React.FC<HeroGreetingProps> = ({
  userName = 'Cô Phương',
  todayCount,
  selectedDate,
  onSelectDate,
  onNavigateTab,
}) => {
  const { greetingText, GreetingIcon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { greetingText: 'Chào buổi sáng', GreetingIcon: Sun };
    } else if (hour >= 12 && hour < 18) {
      return { greetingText: 'Chào buổi chiều', GreetingIcon: Sunset };
    } else {
      return { greetingText: 'Chào buổi tối', GreetingIcon: Moon };
    }
  }, []);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Tính 7 ngày trong tuần hiện tại (bắt đầu từ Thứ 2)
  const weekDays = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 }); // 1 = Monday
    const days = [];

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      days.push({
        date: d,
        dateStr,
        label: dayLabels[i],
        dayNum: format(d, 'dd'),
        isToday,
        isSelected,
      });
    }

    return days;
  }, [todayStr, selectedDate]);

  const formattedToday = useMemo(() => {
    const now = new Date();
    const dayName = format(now, 'EEEE', { locale: vi });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateStr = format(now, 'dd/MM/yyyy');
    return `${capitalizedDay}, ngày ${dateStr}`;
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-5 sm:p-7 shadow-xl shadow-blue-500/15">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-12 w-48 h-48 bg-purple-400/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-5">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
              <GreetingIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{formattedToday}</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              {greetingText}, <span className="text-amber-200">{userName || 'Cô Phương'}</span>! 👋
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 max-w-xl leading-relaxed">
              {todayCount > 0
                ? `Hôm nay bạn có ${todayCount} hoạt động giảng dạy & lịch hẹn trong ngày. Chúc bạn có một ngày làm việc hiệu quả!`
                : 'Hôm nay bạn chưa có lịch giảng dạy nào. Hãy tận hưởng một ngày nghỉ ngơi thư thái và tái tạo năng lượng!'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onNavigateTab('teaching_schedule')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Thời khóa biểu</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('ai_assistant')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/30 transition cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Hỏi Trợ lý AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Weekly Mini Strip (Dải lịch 7 ngày trong tuần) */}
        <div className="pt-3 border-t border-white/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
              Lịch Tuần Này • Chọn ngày để xem nhanh
            </span>
            {selectedDate !== todayStr && (
              <button
                type="button"
                onClick={() => onSelectDate(todayStr)}
                className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
              >
                ← Quay về Hôm nay
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((day) => {
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => onSelectDate(day.dateStr)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
                    day.isSelected
                      ? 'bg-white text-blue-700 shadow-lg scale-105 font-bold ring-2 ring-white/50'
                      : day.isToday
                      ? 'bg-white/25 text-white font-bold border border-white/40'
                      : 'bg-white/10 hover:bg-white/20 text-blue-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold tracking-tight uppercase">
                    {day.label}
                  </span>
                  <span className="text-sm sm:text-base font-extrabold mt-0.5 font-mono">
                    {day.dayNum}
                  </span>
                  {day.isToday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        day.isSelected ? 'bg-blue-600' : 'bg-amber-300'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
