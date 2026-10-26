'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Layers,
  GraduationCap,
  UserCheck,
  Clock,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { DAYS_OF_WEEK, DayOfWeek, Session } from '../types';
import { getSubjectTheme } from '../utils/subjectColors';

export const MatrixTimetableDesktop: React.FC = () => {
  const {
    timetable,
    selectedDay,
    setSelectedDay,
    setSelectedTeacher,
    setSelectedClass,
    setViewMode,
  } = useTeachingScheduleStore();

  const [activeSession, setActiveSession] = useState<Session>('Sáng');
  const [filterQuery, setFilterQuery] = useState('');

  // Lọc danh sách entries theo ngày và buổi hiện tại
  const sessionEntries = useMemo(() => {
    if (!timetable) return [];
    return timetable.entries.filter(
      (e) => e.dayOfWeek === selectedDay && e.session === activeSession
    );
  }, [timetable, selectedDay, activeSession]);

  // Tìm kiếm theo tên môn, giáo viên hoặc lớp
  const filteredEntries = useMemo(() => {
    if (!filterQuery.trim()) return sessionEntries;
    const q = filterQuery.toLowerCase().trim();
    return sessionEntries.filter(
      (e) =>
        e.className.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.teacher.toLowerCase().includes(q)
    );
  }, [sessionEntries, filterQuery]);

  // Gom theo lớp học
  const entriesByClass = useMemo(() => {
    if (!timetable) return new Map<string, typeof filteredEntries>();
    const map = new Map<string, typeof filteredEntries>();
    for (const cls of timetable.classes) {
      map.set(cls, []);
    }
    for (const e of filteredEntries) {
      const list = map.get(e.className);
      if (list) {
        list.push(e);
      } else {
        map.set(e.className, [e]);
      }
    }
    return map;
  }, [timetable, filteredEntries]);

  if (!timetable) return null;

  const periods = activeSession === 'Sáng' ? [1, 2, 3, 4, 5] : [1, 2, 3];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Thanh điều khiển lọc: Thứ, Buổi, Tìm kiếm */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Chọn Thứ */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shrink-0 ${
                selectedDay === d.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Chọn Buổi & Tìm kiếm */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveSession('Sáng')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeSession === 'Sáng'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sáng
            </button>
            <button
              onClick={() => setActiveSession('Chiều')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeSession === 'Chiều'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Chiều
            </button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Lọc lớp, môn, GV..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Bảng tổng quan ma trận */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <th className="py-3 px-4 w-24 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">
                  Lớp học
                </th>
                {periods.map((p) => (
                  <th key={p} className="py-3 px-3 min-w-[140px] text-center border-r border-slate-100 dark:border-slate-800/80">
                    Tiết {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {timetable.classes.map((cls) => {
                const classEntries = entriesByClass.get(cls) || [];
                // Nếu đang tìm kiếm và lớp này không có kết quả khớp thì bỏ qua
                if (filterQuery.trim() && classEntries.length === 0) return null;

                return (
                  <tr key={cls} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setSelectedClass(cls);
                          setViewMode('class');
                        }}
                        className="hover:text-blue-600 dark:hover:text-blue-400 font-extrabold cursor-pointer flex items-center gap-1"
                        title="Bấm để xem lịch lớp"
                      >
                        <span>{cls}</span>
                      </button>
                    </td>

                    {periods.map((p) => {
                      const entry = classEntries.find((e) => e.period === p);
                      if (!entry) {
                        return (
                          <td key={p} className="py-2.5 px-3 text-center text-slate-300 dark:text-slate-600 border-r border-slate-100 dark:border-slate-800/80">
                            -
                          </td>
                        );
                      }

                      const theme = getSubjectTheme(entry.subject);
                      return (
                        <td key={p} className="py-2 px-2 text-center border-r border-slate-100 dark:border-slate-800/80">
                          <div className={`p-1.5 rounded-xl border text-[11px] leading-tight space-y-0.5 ${theme.bg} ${theme.border}`}>
                            <span className={`block font-bold ${theme.text} truncate`}>
                              {entry.subject}
                            </span>
                            {entry.teacher && (
                              <button
                                onClick={() => {
                                  setSelectedTeacher(entry.teacher);
                                  setViewMode('teacher');
                                }}
                                className="block font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer truncate w-full"
                                title={`GV: ${entry.teacher}`}
                              >
                                {entry.teacher}
                              </button>
                            )}
                          </div>
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
    </div>
  );
};
