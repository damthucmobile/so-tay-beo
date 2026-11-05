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
  Bookmark,
  BookmarkCheck,
  LayoutGrid,
  ListOrdered,
  Printer,
  CalendarDays,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { DAYS_OF_WEEK, DayOfWeek, DEFAULT_PERIOD_TIMES, Session, TimetableEntry } from '../types';
import { getSubjectTheme } from '../utils/subjectColors';
import { LiveScheduleTrackerBanner } from './LiveScheduleTrackerBanner';
import { TeacherWeeklyGridView } from './TeacherWeeklyGridView';
import { PrintTimetableModal } from './PrintTimetableModal';
import { getTodayDayOfWeekVietnamese } from '../utils/timetableLiveTracker';

export const TeacherScheduleView: React.FC = () => {
  const {
    timetable,
    selectedTeacher,
    setSelectedTeacher,
    myTeacher,
    setMyTeacher,
    selectedDay,
    setSelectedDay,
    setSelectedClass,
    setViewMode,
    displayMode,
    setDisplayMode,
    isCompactView,
  } = useTeachingScheduleStore();

  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const todayDayOfWeek = useMemo(() => getTodayDayOfWeekVietnamese(), []);

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

  // Tiết dạy của hôm nay (để phục vụ Live Tracker)
  const todayEntries = useMemo(() => {
    if (!todayDayOfWeek) return [];
    return teacherAllEntries.filter((e) => e.dayOfWeek === todayDayOfWeek);
  }, [teacherAllEntries, todayDayOfWeek]);

  // Tiết dạy của ngày được chọn trong chế độ Agenda
  const currentDayEntries = useMemo(() => {
    return teacherAllEntries.filter((e) => e.dayOfWeek === selectedDay);
  }, [teacherAllEntries, selectedDay]);

  // Phân theo Buổi Sáng và Buổi Chiều (Agenda)
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

  // Xử lý In thời khóa biểu
  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  if (!timetable) return null;

  const isMyTeacher = selectedTeacher && myTeacher === selectedTeacher;

  return (
    <div className="space-y-2 sm:space-y-4 pb-12 animate-fadeIn w-full">
      {/* 1. THANH CHỌN GIÁO VIÊN & ĐIỀU KHIỂN */}

      {/* A. BẢN MOBILE (sm:hidden) - Tinh giản, 1 dòng gọn gàng, loại bỏ hoàn toàn rối mắt */}
      <div className="sm:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm space-y-2 print:hidden">
        <div className="flex items-center justify-between gap-2">
          {/* Nút bấm để chọn/đổi giáo viên */}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isMobileMenuOpen) setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer active:opacity-75 transition"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedTeacher ? `Thầy/Cô: ${selectedTeacher}` : 'Chọn giáo viên'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isSearchOpen ? 'rotate-180' : ''}`} />
                {isMyTeacher && (
                  <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {teacherSubjects.length > 0 ? teacherSubjects.join(', ') : 'Lịch giảng dạy'}
              </p>
            </div>
          </button>

          {/* Các nút thao tác nhanh trên mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Pill số tiết hôm nay */}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
              <Clock className="w-3 h-3 text-emerald-500" />
              <span>{todayEntries.length}t</span>
            </span>

            {/* Toggle Lưới / Ngày */}
            <button
              onClick={() => setDisplayMode(displayMode === 'grid' ? 'agenda' : 'grid')}
              className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                displayMode === 'grid'
                  ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title={displayMode === 'grid' ? 'Đang xem Lưới tuần (Bấm để xem Theo ngày)' : 'Đang xem Theo ngày (Bấm để xem Lưới tuần)'}
            >
              {displayMode === 'grid' ? <LayoutGrid className="w-3.5 h-3.5" /> : <ListOrdered className="w-3.5 h-3.5" />}
            </button>

            {/* Menu More */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (isSearchOpen) setIsSearchOpen(false);
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Tùy chọn khác"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dropdown tìm kiếm & đổi giáo viên trên mobile */}
        {isSearchOpen && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên giáo viên..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Gợi ý giáo viên nhanh */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[10px] text-slate-400 shrink-0">Gợi ý:</span>
              {timetable.teachers.slice(0, 10).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTeacher(t);
                    setIsSearchOpen(false);
                    setTeacherSearch('');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 cursor-pointer ${
                    t === selectedTeacher
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Danh sách kết quả tìm kiếm */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-lg">
              {filteredTeachers.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTeacher(t);
                    setIsSearchOpen(false);
                    setTeacherSearch('');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                    t === selectedTeacher ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{t}</span>
                  {t === selectedTeacher && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Menu More trên mobile */}
        {isMobileMenuOpen && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-1.5 pb-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Tiết trong tuần</p>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{teacherAllEntries.length} tiết</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center">
                <p className="text-[10px] text-slate-400">Lớp phụ trách</p>
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{teacherClasses.length} lớp</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (isMyTeacher) {
                  setMyTeacher('');
                } else {
                  setMyTeacher(selectedTeacher);
                }
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isMyTeacher ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>{isMyTeacher ? 'Bỏ ghim giáo viên này' : 'Ghim làm giáo viên mặc định của tôi'}</span>
            </button>

            {myTeacher && myTeacher !== selectedTeacher && (
              <button
                onClick={() => {
                  setSelectedTeacher(myTeacher);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 font-semibold cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Quay lại lịch của tôi ({myTeacher})</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handlePrint();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-500" />
              <span>In / Xem trước TKB A4</span>
            </button>
          </div>
        )}
      </div>

      {/* B. BẢN DESKTOP (hidden sm:block) */}
      <div className={`hidden sm:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm print:hidden ${
        isCompactView ? 'rounded-2xl p-2.5 sm:p-3' : 'rounded-2xl sm:rounded-3xl p-3 sm:p-4'
      }`}>
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-2.5 sm:gap-3">
          {/* Cụm trái: Thông tin Giáo viên & Nút ghim */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className={`bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 ${
              isCompactView ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 sm:w-11 sm:h-11 rounded-2xl'
            }`}>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedTeacher ? `Thầy/Cô: ${selectedTeacher}` : 'Chưa chọn giáo viên'}
                </h3>

                {isMyTeacher && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    <BookmarkCheck className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                    Lịch của tôi
                  </span>
                )}

                {teacherSubjects.length > 0 && (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 truncate max-w-[150px] sm:max-w-none">
                    {teacherSubjects.join(', ')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {selectedTeacher && (
                  <button
                    onClick={() => {
                      if (isMyTeacher) {
                        setMyTeacher('');
                      } else {
                        setMyTeacher(selectedTeacher);
                      }
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer ${
                      isMyTeacher
                        ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                        : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                    title={isMyTeacher ? 'Bỏ ghim lịch cá nhân' : 'Ghim giáo viên này làm mặc định khi mở app'}
                  >
                    <Bookmark className={`w-3 h-3 ${isMyTeacher ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{isMyTeacher ? 'Đã ghim mặc định' : 'Đặt làm TKB của tôi'}</span>
                  </button>
                )}

                {myTeacher && myTeacher !== selectedTeacher && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      onClick={() => setSelectedTeacher(myTeacher)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Quay lại lịch của tôi ({myTeacher})
                    </button>
                  </>
                )}

                {/* 3 Chỉ số KPI dạng mini badge (Hiện khi ở Chế độ xem gọn) */}
                {isCompactView && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                    <div className="inline-flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                        <CalendarDays className="w-3 h-3 text-blue-500" />
                        <span>{teacherAllEntries.length} tiết/tuần</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>Hôm nay: {todayEntries.length}t</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        <span>{teacherClasses.length} lớp</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cụm phải: Tìm kiếm, Chế độ xem Lưới vs Ngày, Nút In - Tự xuống dòng ở màn hình nhỏ/vừa để không dồn ép cụm trái */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between 2xl:justify-end pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80 2xl:border-t-0 2xl:pt-0 shrink-0">
            {/* Chế độ hiển thị: Lưới tuần vs Theo ngày */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  displayMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem dạng Lưới cả tuần trực quan (Khuyên dùng)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới tuần</span>
              </button>

              <button
                onClick={() => setDisplayMode('agenda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  displayMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem danh sách chi tiết theo từng ngày"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Theo ngày</span>
              </button>
            </div>

            {/* Teacher Dropdown / Search Trigger */}
            <div className="relative w-full sm:w-56 shrink-0">
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
                  className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-base sm:text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
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
                        const isMy = t === myTeacher;
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
                            <span className="flex items-center gap-1.5 truncate">
                              <span>{t}</span>
                              {isMy && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                  Lịch của tôi
                                </span>
                              )}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Nút In & Xuất TKB */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/80 dark:border-blue-800 transition cursor-pointer shrink-0 shadow-xs"
              title="Xem trước, In A4 Ngang hoặc Xuất file ảnh PNG"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In / Xuất TKB</span>
              <span className="sm:hidden text-[11px]">In TKB</span>
            </button>
          </div>
        </div>

        {/* Quick Teacher Chips (Horizontal Scroll) - Ẩn khi xem gọn để tiết kiệm chiều dọc */}
        {!isCompactView && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                {t === myTeacher && ' ★'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Banner Trạng Thái Thực Tế (Live Tracker Widget) */}
      <div className="print:hidden">
        <LiveScheduleTrackerBanner
          todayEntries={todayEntries}
          teacherName={selectedTeacher}
          onSelectClass={(cls) => {
            setSelectedClass(cls);
            setViewMode('class');
          }}
        />
      </div>



      {/* 4. Khung Hiển Thị Chính: Lưới Cả Tuần (Grid) hoặc Theo Ngày (Agenda) */}
      {displayMode === 'grid' ? (
        <TeacherWeeklyGridView
          entries={teacherAllEntries}
          teacherName={selectedTeacher}
          onSelectClass={(cls) => {
            setSelectedClass(cls);
            setViewMode('class');
          }}
          onSelectDay={(day) => {
            setSelectedDay(day);
            setDisplayMode('agenda');
          }}
        />
      ) : (
        /* CHẾ ĐỘ XEM THEO NGÀY (AGENDA) */
        <div className={isCompactView ? 'space-y-2 sm:space-y-2.5' : 'space-y-3 sm:space-y-4'}>
          {/* Thanh chọn Thứ Hai -> Thứ Bảy */}
          <div className={`bg-slate-200/70 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between gap-1 shadow-inner overflow-x-auto print:hidden ${
            isCompactView ? 'p-1' : 'p-1.5'
          }`}>
            {DAYS_OF_WEEK.map((d) => {
              const isActive = selectedDay === d.id;
              const isToday = d.id === todayDayOfWeek;
              const count = periodsByDay[d.id] || 0;

              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`flex-1 min-w-[44px] px-1 rounded-xl text-center transition flex flex-col items-center justify-center cursor-pointer select-none ${
                    isCompactView ? 'py-1.5 sm:py-2' : 'py-2 sm:py-2.5 sm:px-2'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-bold scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-bold">{d.short}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </div>
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

          {/* Danh sách các tiết học của ngày được chọn */}
          {currentDayEntries.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Coffee className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Không có tiết dạy vào Thứ {selectedDay}!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Thầy/Cô {selectedTeacher} không có lịch lên lớp vào {selectedDay}. Thư thả chuẩn bị giáo án hoặc nghỉ ngơi.
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
      )}

      {/* Modal Xem trước & In / Xuất TKB A4 */}
      <PrintTimetableModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        type="teacher"
        name={selectedTeacher}
        schoolName={timetable.schoolName}
        subTitle={`${timetable.title} • ${timetable.subOrg || ''}`}
        entries={teacherAllEntries}
        subjects={teacherSubjects}
      />
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
          <span className="text-[10px] font-medium text-slate-400 uppercase">Tiết</span>
          <span className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
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
            {entry.room && (
              <>
                <span>•</span>
                <span>Phòng {entry.room}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cột phải: Badge Lớp học */}
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
