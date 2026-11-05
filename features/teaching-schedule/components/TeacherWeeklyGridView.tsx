'use client';

import React, { useMemo } from 'react';
import {
  Clock,
  GraduationCap,
  Sparkles,
  MapPin,
  Coffee,
  CheckCircle2,
  Calendar,
  Flame,
  ChevronRight,
  Pencil,
  Plus,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  DEFAULT_PERIOD_TIMES,
  Session,
  TimetableEntry,
} from '../types';
import { getSubjectTheme } from '../utils/subjectColors';
import { getTodayDayOfWeekVietnamese, timeToMinutes } from '../utils/timetableLiveTracker';

interface TeacherWeeklyGridViewProps {
  entries: TimetableEntry[];
  teacherName: string;
  onSelectClass?: (className: string) => void;
  onSelectDay?: (day: DayOfWeek) => void;
  onEditEntry?: (entry: TimetableEntry) => void;
  onAddEntry?: (defaults: { day: DayOfWeek; session: Session; period: number }) => void;
}

export const TeacherWeeklyGridView: React.FC<TeacherWeeklyGridViewProps> = ({
  entries,
  teacherName,
  onSelectClass,
  onSelectDay,
  onEditEntry,
  onAddEntry,
}) => {
  const todayDayOfWeek = useMemo(() => getTodayDayOfWeekVietnamese(), []);

  // Xác định thời gian thực để highlight tiết đang diễn ra
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

  // Kiểm tra xem giáo viên có tiết dạy vào buổi chiều không
  const hasAfternoon = useMemo(() => {
    return entries.some((e) => e.session === 'Chiều');
  }, [entries]);

  // Kiểm tra xem có tiết vào Thứ Bảy không
  const hasSaturday = useMemo(() => {
    return entries.some((e) => e.dayOfWeek === 'Bảy');
  }, [entries]);

  // Danh sách các ngày hiển thị (nếu không có Thứ Bảy và hôm nay không phải Thứ Bảy thì hiển thị 5 ngày hoặc cả 6 ngày)
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
      {/* Khung cuộn ngang mượt mà trên thiết bị nhỏ */}
      <div className="overflow-x-auto select-none print:overflow-visible">
        <table className="w-full border-collapse text-left min-w-[700px] sm:min-w-[850px]">
          {/* Header Bảng: Các Thứ */}
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
                        ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold">{d.label}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          count > 0
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800'
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
                  key={`morning_${period}`}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Cột hiển thị Tiết & Giờ */}
                  <td className="py-2.5 px-2 sm:px-3 text-center border-r border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Tiết {period}
                    </span>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {timeConfig.start}
                    </div>
                  </td>

                  {/* Các ô của từng Thứ */}
                  {displayDays.map((d) => {
                    const isToday = d.id === todayDayOfWeek;
                    const key = `${d.id}_Sáng_${period}`;
                    const entry = entryMap.get(key);

                    // Kiểm tra xem tiết này có đang diễn ra ngay bây giờ không
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
                          isToday ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                        }`}
                      >
                        {entry ? (
                          <GridPeriodCell
                            entry={entry}
                            isLive={isLive}
                            onSelectClass={onSelectClass}
                            onEditEntry={onEditEntry}
                          />
                        ) : (
                          <button
                            onClick={() => onAddEntry?.({ day: d.id, session: 'Sáng', period })}
                            className="w-full h-full min-h-[52px] sm:min-h-[58px] flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-xs font-medium transition cursor-pointer group"
                            title={`Thêm tiết vào Thứ ${d.id} Tiết ${period} (Sáng)`}
                          >
                            <span className="group-hover:hidden">-</span>
                            <Plus className="w-4 h-4 hidden group-hover:block text-blue-500" />
                          </button>
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
                    (Thầy/Cô không có lịch dạy buổi chiều)
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
                  key={`afternoon_${period}`}
                  className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Cột hiển thị Tiết & Giờ */}
                  <td className="py-2.5 px-2 sm:px-3 text-center border-r border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Tiết {period}
                    </span>
                    <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      {timeConfig.start}
                    </div>
                  </td>

                  {/* Các ô của từng Thứ */}
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
                          isToday ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''
                        }`}
                      >
                        {entry ? (
                          <GridPeriodCell
                            entry={entry}
                            isLive={isLive}
                            onSelectClass={onSelectClass}
                            onEditEntry={onEditEntry}
                          />
                        ) : (
                          <button
                            onClick={() => onAddEntry?.({ day: d.id, session: 'Chiều', period })}
                            className="w-full h-full min-h-[52px] sm:min-h-[58px] flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 text-xs font-medium transition cursor-pointer group"
                            title={`Thêm tiết vào Thứ ${d.id} Tiết ${period} (Chiều)`}
                          >
                            <span className="group-hover:hidden">-</span>
                            <Plus className="w-4 h-4 hidden group-hover:block text-blue-500" />
                          </button>
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

interface GridPeriodCellProps {
  entry: TimetableEntry;
  isLive?: boolean;
  onSelectClass?: (className: string) => void;
  onEditEntry?: (entry: TimetableEntry) => void;
}

const GridPeriodCell: React.FC<GridPeriodCellProps> = ({
  entry,
  isLive,
  onSelectClass,
  onEditEntry,
}) => {
  const theme = getSubjectTheme(entry.subject);

  return (
    <div
      onClick={() => onEditEntry?.(entry)}
      className={`group relative rounded-xl p-2 sm:p-2.5 transition-all duration-200 border shadow-xs hover:shadow-md flex flex-col justify-between gap-1.5 min-h-[56px] sm:min-h-[62px] cursor-pointer ${
        theme.bg
      } ${theme.border} ${
        isLive
          ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md shadow-emerald-500/20 animate-pulse'
          : ''
      }`}
    >
      {/* Live Badge */}
      {isLive && (
        <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium uppercase tracking-wider bg-emerald-600 text-white shadow-xs z-10 flex items-center gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          Live
        </span>
      )}

      {/* Dòng trên: Tên Môn học & Nút sửa */}
      <div className="flex items-start justify-between gap-1">
        <span
          className={`text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 ${theme.text}`}
          title={entry.subject}
        >
          {entry.subject}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditEntry?.(entry);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition cursor-pointer shrink-0"
          title="Sửa tiết học"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      {/* Ghi chú hoặc Giáo viên dạy thay nếu có */}
      {(entry.note || entry.room) && (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
          {entry.room && <span>P.{entry.room}</span>}
          {entry.room && entry.note && <span>•</span>}
          {entry.note && <span className="italic truncate">{entry.note}</span>}
        </div>
      )}

      {/* Dòng dưới: Badge Lớp học */}
      <div className="flex items-center justify-between gap-1 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectClass) onSelectClass(entry.className);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-[10px] sm:text-[11px] font-medium transition cursor-pointer shadow-2xs group/btn"
          title={`Xem thời khóa biểu Lớp ${entry.className}`}
        >
          <GraduationCap className="w-3 h-3 text-blue-500 group-hover/btn:text-white transition-colors" />
          <span>{entry.className}</span>
        </button>
      </div>
    </div>
  );
};
