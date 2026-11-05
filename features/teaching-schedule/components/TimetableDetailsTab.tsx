'use client';

import React, { useMemo, useState } from 'react';
import {
  School,
  Sparkles,
  Calendar,
  Clock,
  GraduationCap,
  BookOpen,
  UserCheck,
  Bookmark,
  BookmarkCheck,
  Upload,
  Bell,
  Printer,
  Trash2,
  CalendarDays,
  CheckCircle2,
  Search,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { DAYS_OF_WEEK, DayOfWeek, TimetableEntry } from '../types';
import { LiveScheduleTrackerBanner } from './LiveScheduleTrackerBanner';
import { PrintTimetableModal } from './PrintTimetableModal';

interface TimetableDetailsTabProps {
  onOpenImport: () => void;
  onOpenReminder: () => void;
  onDeleteTimetable: () => void;
}

export const TimetableDetailsTab: React.FC<TimetableDetailsTabProps> = ({
  onOpenImport,
  onOpenReminder,
  onDeleteTimetable,
}) => {
  const {
    timetable,
    selectedTeacher,
    setSelectedTeacher,
    myTeacher,
    setMyTeacher,
    setViewMode,
  } = useTeachingScheduleStore();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  // Lấy toàn bộ tiết của giáo viên đang chọn
  const teacherEntries = useMemo(() => {
    if (!timetable || !selectedTeacher) return [];
    return timetable.entries.filter(
      (e) => e.teacher.toLowerCase() === selectedTeacher.toLowerCase()
    );
  }, [timetable, selectedTeacher]);

  // Các môn giảng dạy
  const teacherSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const e of teacherEntries) {
      if (e.subject) set.add(e.subject);
    }
    return Array.from(set).sort();
  }, [teacherEntries]);

  // Các lớp phụ trách
  const teacherClasses = useMemo(() => {
    const set = new Set<string>();
    for (const e of teacherEntries) {
      if (e.className) set.add(e.className);
    }
    return Array.from(set).sort();
  }, [teacherEntries]);

  // Phân bổ tiết theo từng thứ
  const periodsByDay = useMemo(() => {
    const counts: Record<DayOfWeek, number> = {
      Hai: 0,
      Ba: 0,
      Tư: 0,
      Năm: 0,
      Sáu: 0,
      Bảy: 0,
    };
    for (const e of teacherEntries) {
      if (counts[e.dayOfWeek] !== undefined) {
        counts[e.dayOfWeek]++;
      }
    }
    return counts;
  }, [teacherEntries]);

  // Đếm tiết Sáng và Chiều
  const sessionCounts = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    for (const e of teacherEntries) {
      if (e.session === 'Sáng') morning++;
      else if (e.session === 'Chiều') afternoon++;
    }
    return { morning, afternoon };
  }, [teacherEntries]);

  const isMyTeacher = selectedTeacher && myTeacher === selectedTeacher;

  if (!timetable) return null;

  return (
    <div className="space-y-4 pb-12 animate-fadeIn w-full max-w-6xl mx-auto">
      {/* 1. THẺ THÔNG TIN TRƯỜNG HỌC & ĐỢT ÁP DỤNG */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">
                  {timetable.schoolName}
                </h2>
                {timetable.description && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {timetable.description}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {timetable.title} • {timetable.subOrg} • Tổng số {timetable.totalEntries} tiết học toàn trường
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nhập lúc: {new Date(timetable.importedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Cụm 4 nút quản lý chính */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onOpenImport}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Đổi / Nhập Excel</span>
          </button>

          <button
            onClick={onOpenReminder}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition cursor-pointer border border-blue-200/60 dark:border-blue-800/40"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Nhắc Lịch Dạy</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200/80 dark:border-slate-700/80"
          >
            <Printer className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>In / Xuất TKB A4</span>
          </button>

          <button
            onClick={onDeleteTimetable}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold transition cursor-pointer border border-red-200/80 dark:border-red-900/40"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>Xóa TKB Này</span>
          </button>
        </div>
      </div>

      {/* 2. CHỌN GIÁO VIÊN & THỐNG KÊ CHI TIẾT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        {/* Tiêu đề & Chọn giáo viên */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Thầy/Cô: {selectedTeacher || 'Chưa chọn'}
                </h3>
                {isMyTeacher && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <BookmarkCheck className="w-3 h-3 text-amber-500" />
                    Lịch của tôi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {teacherSubjects.length > 0 ? `Bộ môn: ${teacherSubjects.join(', ')}` : 'Chưa có môn dạy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Ghim làm lịch của tôi */}
            {selectedTeacher && (
              <button
                onClick={() => {
                  if (isMyTeacher) {
                    setMyTeacher('');
                  } else {
                    setMyTeacher(selectedTeacher);
                  }
                }}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                  isMyTeacher
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isMyTeacher ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{isMyTeacher ? 'Đã ghim mặc định' : 'Ghim làm TKB của tôi'}</span>
              </button>
            )}

            {/* Chuyển nhanh sang xem lịch dạy */}
            <button
              onClick={() => setViewMode('teacher')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <span>Xem Lịch Dạy</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI thống kê chuyên sâu */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                Tiết Trong Tuần
              </span>
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-blue-950 dark:text-blue-100">
              {teacherEntries.length} <span className="text-xs font-normal text-slate-500">tiết</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                Lớp Phụ Trách
              </span>
              <GraduationCap className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-950 dark:text-emerald-100">
              {teacherClasses.length} <span className="text-xs font-normal text-slate-500">lớp</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                Môn Giảng Dạy
              </span>
              <BookOpen className="w-4 h-4 text-purple-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-purple-950 dark:text-purple-100">
              {teacherSubjects.length} <span className="text-xs font-normal text-slate-500">môn</span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                Sáng / Chiều
              </span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-950 dark:text-amber-100">
              {sessionCounts.morning}s <span className="text-xs font-normal text-slate-400">/</span> {sessionCounts.afternoon}c
            </p>
          </div>
        </div>

        {/* Phân bổ tiết từng ngày trong tuần */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Phân Bổ Tiết Theo Thứ Trong Tuần
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DAYS_OF_WEEK.map((d) => {
              const count = periodsByDay[d.id] || 0;
              return (
                <div
                  key={d.id}
                  className={`p-3 rounded-2xl border text-center transition ${
                    count > 0
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-50/40 dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.label}</p>
                  <p className="text-lg font-black mt-1 text-slate-900 dark:text-white">
                    {count > 0 ? `${count}t` : '-'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danh sách lớp phụ trách */}
        {teacherClasses.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh Sách Lớp Phụ Trách ({teacherClasses.length} lớp)
            </h4>
            <div className="flex items-center gap-2 flex-wrap">
              {teacherClasses.map((cls) => (
                <span
                  key={cls}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700/80"
                >
                  Lớp {cls}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. MODAL IN TKB */}
      <PrintTimetableModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        type="teacher"
        name={selectedTeacher}
        schoolName={timetable.schoolName}
        subTitle={`${timetable.title} • ${timetable.subOrg || ''}`}
        entries={teacherEntries}
        subjects={teacherSubjects}
      />
    </div>
  );
};
