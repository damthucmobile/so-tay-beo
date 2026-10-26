'use client';

import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  Search,
  Calendar,
  Clock,
  GraduationCap,
  Sparkles,
  BookOpen,
  Coffee,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { DAYS_OF_WEEK, DayOfWeek, DEFAULT_PERIOD_TIMES, Session, TimetableEntry } from '../types';
import { getSubjectTheme } from '../utils/subjectColors';

export const TeacherScheduleView: React.FC = () => {
  const {
    timetable,
    selectedTeacher,
    setSelectedTeacher,
    selectedDay,
    setSelectedDay,
    setSelectedClass,
    setViewMode,
  } = useTeachingScheduleStore();

  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Danh sách giáo viên được lọc theo tìm kiếm
  const filteredTeachers = useMemo(() => {
    if (!timetable) return [];
    if (!teacherSearch.trim()) return timetable.teachers;
    const q = teacherSearch.toLowerCase().trim();
    return timetable.teachers.filter((t) => t.toLowerCase().includes(q));
  }, [timetable, teacherSearch]);

  // Toàn bộ các tiết dạy trong tuần của giáo viên này
  const teacherAllEntries = useMemo(() => {
    if (!timetable || !selectedTeacher) return [];
    return timetable.entries.filter((e) => e.teacher.toLowerCase() === selectedTeacher.toLowerCase());
  }, [timetable, selectedTeacher]);

  // Các môn chính giáo viên này giảng dạy
  const teacherSubjects = useMemo(() => {
    return Array.from(new Set(teacherAllEntries.map((e) => e.subject).filter(Boolean)));
  }, [teacherAllEntries]);

  // Các lớp giáo viên này dạy
  const teacherClasses = useMemo(() => {
    return Array.from(new Set(teacherAllEntries.map((e) => e.className).filter(Boolean))).sort();
  }, [teacherAllEntries]);

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
    for (const e of teacherAllEntries) {
      if (counts[e.dayOfWeek] !== undefined) {
        counts[e.dayOfWeek]++;
      }
    }
    return counts;
  }, [teacherAllEntries]);

  // Tiết dạy của ngày được chọn
  const currentDayEntries = useMemo(() => {
    return teacherAllEntries.filter((e) => e.dayOfWeek === selectedDay);
  }, [teacherAllEntries, selectedDay]);

  // Phân theo Buổi Sáng và Buổi Chiều
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
      {/* 1. Thanh chọn giáo viên (Quick Teacher Selector with Instant Search) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {selectedTeacher ? `Thầy/Cô: ${selectedTeacher}` : 'Chưa chọn giáo viên'}
                </h3>
                {teacherSubjects.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 truncate max-w-[150px] sm:max-w-none">
                    {teacherSubjects.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Teacher Dropdown / Search Trigger */}
          <div className="relative w-full sm:w-60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên..."
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {/* Dropdown suggestions */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-full sm:w-72 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-40 p-1.5 space-y-1">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Không tìm thấy giáo viên nào
                    </div>
                  ) : (
                    filteredTeachers.map((t) => {
                      const isSelected = t === selectedTeacher;
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            setSelectedTeacher(t);
                            setIsSearchOpen(false);
                            setTeacherSearch('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{t}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Teacher Chips (Horizontal Scroll) */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 shrink-0 mr-0.5">
            Gợi ý:
          </span>
          {timetable.teachers.slice(0, 15).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTeacher(t)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
                t === selectedTeacher
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Thống kê KPI: Dạng thanh 1 dòng gọn gàng trên mobile, dạng 3 card trên desktop */}
      <div className="sm:hidden flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">Tuần:</span>
          <span className="font-extrabold text-blue-600 dark:text-blue-400">{teacherAllEntries.length} tiết</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">{selectedDay}:</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{currentDayEntries.length} tiết</span>
          <span className="text-[10px] text-slate-400">(S:{morningEntries.length} C:{afternoonEntries.length})</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[11px]">Dạy:</span>
          <span className="font-extrabold text-purple-600 dark:text-purple-400">{teacherClasses.length} lớp</span>
        </div>
      </div>

      {/* 3 cards trên desktop */}
      <div className="hidden sm:grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tiết Trong Tuần
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {teacherAllEntries.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">tiết</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Hôm Nay ({selectedDay})
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {currentDayEntries.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              (Sáng: {morningEntries.length} | Chiều: {afternoonEntries.length})
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Số Lớp Phụ Trách
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {teacherClasses.length}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">lớp</span>
          </div>
        </div>
      </div>

      {/* 3. Thanh chọn Thứ Hai -> Thứ Sáu (Mobile Touch Tabs with period counts) */}
      <div className="bg-slate-200/70 dark:bg-slate-800/60 p-1.5 rounded-2xl flex items-center justify-between gap-1 shadow-inner">
        {DAYS_OF_WEEK.map((d) => {
          const isActive = selectedDay === d.id;
          const count = periodsByDay[d.id] || 0;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-center transition flex flex-col items-center justify-center cursor-pointer select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold scale-[1.02]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="text-xs sm:text-sm font-bold">{d.short}</span>
              <span
                className={`text-[10px] font-medium mt-0.5 px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : count > 0
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {count > 0 ? `${count}t` : '-'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Danh sách các tiết học trong ngày (Timeline Session Cards) */}
      {currentDayEntries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <Coffee className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Hôm nay không có tiết dạy!
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Thầy/cô {selectedTeacher} không có lịch lên lớp vào {selectedDay}. Thư thả chuẩn bị giáo án hoặc nghỉ ngơi.
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
                  <PeriodCard
                    key={entry.id}
                    entry={entry}
                    onSelectClass={(cls) => {
                      setSelectedClass(cls);
                      setViewMode('class');
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
                  <PeriodCard
                    key={entry.id}
                    entry={entry}
                    onSelectClass={(cls) => {
                      setSelectedClass(cls);
                      setViewMode('class');
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

interface PeriodCardProps {
  entry: TimetableEntry;
  onSelectClass: (className: string) => void;
}

const PeriodCard: React.FC<PeriodCardProps> = ({ entry, onSelectClass }) => {
  const theme = getSubjectTheme(entry.subject);
  const timeConfig = DEFAULT_PERIOD_TIMES[entry.session]?.[entry.period] || {
    start: '--:--',
    end: '--:--',
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition flex items-center justify-between gap-3 ${theme.border}`}
    >
      {/* Cột trái: Tiết & Thời gian */}
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

      {/* Cột phải: Badge Lớp học (bấm để xem TKB của lớp) */}
      <button
        onClick={() => onSelectClass(entry.className)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer text-xs font-bold group shrink-0"
        title={`Xem thời khóa biểu lớp ${entry.className}`}
      >
        <GraduationCap className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
        <span>Lớp {entry.className}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};
