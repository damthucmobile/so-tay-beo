'use client';

import React, { useMemo } from 'react';
import {
  Clock,
  UserCheck,
  GraduationCap,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  DEFAULT_PERIOD_TIMES,
  TimetableEntry,
} from '../types';
import { getSubjectTheme } from '../utils/subjectColors';
import { getTodayDayOfWeekVietnamese, timeToMinutes } from '../utils/timetableLiveTracker';

interface ClassWeeklyGridViewProps {
  entries: TimetableEntry[];
  className: string;
  onSelectTeacher?: (teacherName: string) => void;
  onSelectDay?: (day: DayOfWeek) => void;
}

export const ClassWeeklyGridView: React.FC<ClassWeeklyGridViewProps> = ({
  entries,
  className,
  onSelectTeacher,
  onSelectDay,
}) => {
  const todayDayOfWeek = useMemo(() => getTodayDayOfWeekVietnamese(), []);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Đếm số tiết theo ngày
  const countsByDay = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      Hai: 0,
      Ba: 0,
      Tư: 0,
      Năm: 0,
      Sáu: 0,
      Bảy: 0,
    };
    for (const e of entries) {
      if (counts[e.dayOfWeek] !== undefined) {
        counts[e.dayOfWeek]++;
      }
    }
    return counts;
  }, [entries]);

  // Kiểm tra xem lớp này có học chiều không
  const hasAfternoon = useMemo(() => {
    return entries.some((e) => e.session === 'Chiều');
  }, [entries]);

  // Kiểm tra xem có học Thứ Bảy không
  const hasSaturday = useMemo(() => {
    return entries.some((e) => e.dayOfWeek === 'Bảy');
  }, [entries]);

  const displayDays = useMemo(() => {
    if (hasSaturday || todayDayOfWeek === 'Bảy') {
      return DAYS_OF_WEEK;
    }
    return DAYS_OF_WEEK.filter((d) => d.id !== 'Bảy');
  }, [hasSaturday, todayDayOfWeek]);

  // Tạo Map tra cứu nhanh: `${dayOfWeek}_${session}_${period}` -> TimetableEntry
  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>();
    for (const e of entries) {
      map.set(`${e.dayOfWeek}_${e.session}_${e.period}`, e);
    }
    return map;
  }, [entries]);

  const morningPeriods = [1, 2, 3, 4, 5];
  const afternoonPeriods = [1, 2, 3, 4, 5];

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden animate-fadeIn">
      <div className="overflow-x-auto select-none print:overflow-visible">
        <table className="w-full border-collapse text-left min-w-[700px] sm:min-w-[850px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              <th className="py-3 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider w-24 sm:w-28 text-center border-r border-slate-200/80 dark:border-slate-800">
                Tiết / Giờ
              </th>
              {displayDays.map((d) => {
                const isToday = d.id === todayDayOfWeek;
                const count = countsByDay[d.id] || 0;

                return (
                  <th
                    key={d.id}
                    onClick={() => onSelectDay && onSelectDay(d.id)}
                    className={`py-2.5 sm:py-3 px-2 sm:px-3 text-center border-r last:border-r-0 border-slate-200/80 dark:border-slate-800 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 ${
                      isToday
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold">{d.label}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          count > 0
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {count > 0 ? `${count} tiết` : 'Nghỉ'}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Phân nhóm: BUỔI SÁNG */}
            <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-y border-amber-500/20 text-amber-800 dark:text-amber-300">
              <td
                colSpan={displayDays.length + 1}
                className="py-1.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-wider"
              >
                ☀️ Buổi Sáng (Tiết 1 đến Tiết 5)
              </td>
            </tr>

            {morningPeriods.map((period) => {
              const timeConfig = DEFAULT_PERIOD_TIMES.Sáng[period] || {
                start: '--:--',
                end: '--:--',
              };

              return (
                <tr
                  key={`class_morning_${period}`}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-2 sm:px-3 text-center border-r border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Tiết {period}
                    </span>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {timeConfig.start}
                    </div>
                  </td>

                  {displayDays.map((d) => {
                    const isToday = d.id === todayDayOfWeek;
                    const key = `${d.id}_Sáng_${period}`;
                    const entry = entryMap.get(key);

                    let isLive = false;
                    if (isToday && entry) {
                      const startMin = timeToMinutes(timeConfig.start);
                      const endMin = timeToMinutes(timeConfig.end);
                      if (currentMinutes >= startMin && currentMinutes < endMin) {
                        isLive = true;
                      }
                    }

                    return (
                      <td
                        key={key}
                        className={`p-1.5 sm:p-2 border-r last:border-r-0 border-slate-200/70 dark:border-slate-800 align-top transition ${
                          isToday ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                        }`}
                      >
                        {entry ? (
                          <ClassPeriodCell
                            entry={entry}
                            isLive={isLive}
                            onSelectTeacher={onSelectTeacher}
                          />
                        ) : (
                          <div className="h-full min-h-[52px] sm:min-h-[58px] flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 text-xs font-medium">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Phân nhóm: BUỔI CHIỀU */}
            <tr className="bg-indigo-500/10 dark:bg-indigo-500/15 border-y border-indigo-500/20 text-indigo-800 dark:text-indigo-300">
              <td
                colSpan={displayDays.length + 1}
                className="py-1.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-wider"
              >
                🌙 Buổi Chiều (Tiết 1 đến Tiết 5)
                {!hasAfternoon && (
                  <span className="ml-2 font-normal lowercase text-[10px] text-slate-400">
                    (Lớp không có lịch học buổi chiều)
                  </span>
                )}
              </td>
            </tr>

            {afternoonPeriods.map((period) => {
              const timeConfig = DEFAULT_PERIOD_TIMES.Chiều[period] || {
                start: '--:--',
                end: '--:--',
              };

              return (
                <tr
                  key={`class_afternoon_${period}`}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-2.5 px-2 sm:px-3 text-center border-r border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Tiết {period}
                    </span>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {timeConfig.start}
                    </div>
                  </td>

                  {displayDays.map((d) => {
                    const isToday = d.id === todayDayOfWeek;
                    const key = `${d.id}_Chiều_${period}`;
                    const entry = entryMap.get(key);

                    let isLive = false;
                    if (isToday && entry) {
                      const startMin = timeToMinutes(timeConfig.start);
                      const endMin = timeToMinutes(timeConfig.end);
                      if (currentMinutes >= startMin && currentMinutes < endMin) {
                        isLive = true;
                      }
                    }

                    return (
                      <td
                        key={key}
                        className={`p-1.5 sm:p-2 border-r last:border-r-0 border-slate-200/70 dark:border-slate-800 align-top transition ${
                          isToday ? 'bg-indigo-500/5 dark:bg-indigo-500/10' : ''
                        }`}
                      >
                        {entry ? (
                          <ClassPeriodCell
                            entry={entry}
                            isLive={isLive}
                            onSelectTeacher={onSelectTeacher}
                          />
                        ) : (
                          <div className="h-full min-h-[52px] sm:min-h-[58px] flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 text-xs font-medium">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ClassPeriodCellProps {
  entry: TimetableEntry;
  isLive?: boolean;
  onSelectTeacher?: (teacherName: string) => void;
}

const ClassPeriodCell: React.FC<ClassPeriodCellProps> = ({
  entry,
  isLive,
  onSelectTeacher,
}) => {
  const theme = getSubjectTheme(entry.subject);

  return (
    <div
      className={`group relative rounded-xl p-2 sm:p-2.5 transition-all duration-200 border shadow-xs hover:shadow-md flex flex-col justify-between gap-1.5 min-h-[56px] sm:min-h-[62px] ${
        theme.bg
      } ${theme.border} ${
        isLive
          ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md shadow-emerald-500/20 animate-pulse'
          : ''
      }`}
    >
      {/* Tên Môn học */}
      <div className="flex items-start justify-between gap-1">
        <span
          className={`text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 ${theme.text}`}
          title={entry.subject}
        >
          {entry.subject}
        </span>
      </div>

      {/* Giáo viên giảng dạy */}
      <div className="flex items-center justify-between gap-1 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectTeacher && entry.teacher) onSelectTeacher(entry.teacher);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-[10px] sm:text-[11px] font-medium transition cursor-pointer shadow-2xs group/btn truncate max-w-[120px]"
          title={`Xem lịch dạy của Thầy/Cô ${entry.teacher}`}
        >
          <UserCheck className="w-3 h-3 text-indigo-500 group-hover/btn:text-white transition-colors shrink-0" />
          <span className="truncate">{entry.teacher || 'Chưa xếp'}</span>
        </button>

        {entry.room && (
          <span
            className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[50px]"
            title={`Phòng: ${entry.room}`}
          >
            P.{entry.room}
          </span>
        )}
      </div>
    </div>
  );
};
