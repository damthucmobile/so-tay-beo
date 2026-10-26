'use client';

import React, { useMemo, useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  UserCheck,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { DAYS_OF_WEEK, DayOfWeek, DEFAULT_PERIOD_TIMES, TimetableEntry } from '../types';
import { getSubjectTheme } from '../utils/subjectColors';

export const ClassScheduleView: React.FC = () => {
  const {
    timetable,
    selectedClass,
    setSelectedClass,
    selectedDay,
    setSelectedDay,
    setSelectedTeacher,
    setViewMode,
  } = useTeachingScheduleStore();

  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

  // Phân loại khối lớp (6, 7, 8, 9)
  const grades = useMemo(() => {
    if (!timetable) return [];
    const set = new Set<string>();
    for (const c of timetable.classes) {
      const match = c.match(/^[0-9]+/);
      if (match) set.add(match[0]);
    }
    return Array.from(set).sort();
  }, [timetable]);

  const filteredClasses = useMemo(() => {
    if (!timetable) return [];
    if (selectedGrade === 'ALL') return timetable.classes;
    return timetable.classes.filter((c) => c.startsWith(selectedGrade));
  }, [timetable, selectedGrade]);

  // Toàn bộ tiết của lớp này trong tuần
  const classAllEntries = useMemo(() => {
    if (!timetable || !selectedClass) return [];
    return timetable.entries.filter((e) => e.className.toLowerCase() === selectedClass.toLowerCase());
  }, [timetable, selectedClass]);

  // Đếm số tiết theo từng thứ
  const periodsByDay = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      Hai: 0,
      Ba: 0,
      Tư: 0,
      Năm: 0,
      Sáu: 0,
      Bảy: 0,
    };
    for (const e of classAllEntries) {
      if (counts[e.dayOfWeek] !== undefined) {
        counts[e.dayOfWeek]++;
      }
    }
    return counts;
  }, [classAllEntries]);

  // Tiết trong ngày được chọn
  const currentDayEntries = useMemo(() => {
    return classAllEntries.filter((e) => e.dayOfWeek === selectedDay);
  }, [classAllEntries, selectedDay]);

  const morningEntries = useMemo(() => {
    return currentDayEntries
      .filter((e) => e.session === 'Sáng')
      .sort((a, b) => a.period - b.period);
  }, [currentDayEntries]);

  const afternoonEntries = useMemo(() => {
    return currentDayEntries
      .filter((e) => e.session === 'Chiều')
      .sort((a, b) => a.period - b.period);
  }, [currentDayEntries]);

  if (!timetable) return null;

  return (
    <div className="space-y-3 sm:space-y-4 pb-12 animate-fadeIn w-full">
      {/* 1. Bộ chọn Lớp học & Khối */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                Lớp {selectedClass || 'Chưa chọn'}
              </h3>
            </div>
          </div>

          {/* Lọc nhanh theo Khối */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:p-1 rounded-lg sm:rounded-xl shrink-0">
            <button
              onClick={() => setSelectedGrade('ALL')}
              className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition cursor-pointer ${
                selectedGrade === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-md sm:rounded-lg transition cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                K{g}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách nút chọn Lớp học (Pill chips ngang) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {filteredClasses.map((cls) => {
            const isSelected = cls === selectedClass;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Thanh chọn Thứ Hai -> Thứ Sáu */}
      <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl sm:rounded-2xl flex items-center justify-between gap-1 border border-slate-200/60 dark:border-slate-700/60">
        {DAYS_OF_WEEK.map((d) => {
          const isActive = selectedDay === d.id;
          const count = periodsByDay[d.id] || 0;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`flex-1 py-1.5 sm:py-2.5 px-1 rounded-lg sm:rounded-xl text-center transition flex flex-col items-center justify-center cursor-pointer select-none ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="text-xs sm:text-sm font-bold">{d.short}</span>
              <span
                className={`text-[9px] sm:text-[10px] font-medium mt-0.5 px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : count > 0
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {count > 0 ? `${count}t` : '-'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Danh sách tiết học của lớp */}
      {currentDayEntries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Không có lịch học vào {selectedDay}
          </p>
          <p className="text-xs text-slate-400">
            Lớp {selectedClass} không có tiết học nào được xếp trong ngày này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Buổi Sáng */}
          {morningEntries.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Buổi Sáng ({morningEntries.length} tiết)
                </h4>
              </div>

              <div className="space-y-2">
                {morningEntries.map((entry) => (
                  <ClassPeriodCard
                    key={entry.id}
                    entry={entry}
                    onSelectTeacher={(teacher) => {
                      if (teacher) {
                        setSelectedTeacher(teacher);
                        setViewMode('teacher');
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Buổi Chiều */}
          {afternoonEntries.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 px-1">
                <Moon className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Buổi Chiều ({afternoonEntries.length} tiết)
                </h4>
              </div>

              <div className="space-y-2">
                {afternoonEntries.map((entry) => (
                  <ClassPeriodCard
                    key={entry.id}
                    entry={entry}
                    onSelectTeacher={(teacher) => {
                      if (teacher) {
                        setSelectedTeacher(teacher);
                        setViewMode('teacher');
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ClassPeriodCardProps {
  entry: TimetableEntry;
  onSelectTeacher: (teacher: string) => void;
}

const ClassPeriodCard: React.FC<ClassPeriodCardProps> = ({ entry, onSelectTeacher }) => {
  const theme = getSubjectTheme(entry.subject);
  const timeConfig = DEFAULT_PERIOD_TIMES[entry.session]?.[entry.period] || {
    start: '--:--',
    end: '--:--',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3 ${theme.border}`}
    >
      {/* Tiết + Thời gian */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-700">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Tiết</span>
          <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 leading-none">
            {entry.period}
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${theme.bg} ${theme.text}`}>
              {entry.subject}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-mono">
              {timeConfig.start} - {timeConfig.end}
            </span>
          </div>
        </div>
      </div>

      {/* Giáo viên phụ trách */}
      {entry.teacher ? (
        <button
          onClick={() => onSelectTeacher(entry.teacher)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer text-xs font-bold group shrink-0"
          title={`Bấm để xem lịch dạy của GV ${entry.teacher}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
          <span>GV: {entry.teacher}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      ) : (
        <span className="text-xs text-slate-400 italic">Tự quản / Tập thể</span>
      )}
    </div>
  );
};
