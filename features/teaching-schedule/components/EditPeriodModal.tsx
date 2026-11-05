'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Trash2,
  Clock,
  UserCheck,
  BookOpen,
  GraduationCap,
  MapPin,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  DEFAULT_PERIOD_TIMES,
  Session,
  TimetableEntry,
} from '../types';
import { useAuth } from '@/core/firebase';

interface EditPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: TimetableEntry | null;
  defaultDay?: DayOfWeek;
  defaultSession?: Session;
  defaultPeriod?: number;
}

export const EditPeriodModal: React.FC<EditPeriodModalProps> = ({
  isOpen,
  onClose,
  entry,
  defaultDay = 'Hai',
  defaultSession = 'Sáng',
  defaultPeriod = 1,
}) => {
  const { user } = useAuth();
  const {
    timetable,
    selectedTeacher,
    myTeacher,
    updateTimetableEntry,
    addTimetableEntry,
    deleteTimetableEntry,
  } = useTeachingScheduleStore();

  const isEditing = Boolean(entry);

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(defaultDay);
  const [session, setSession] = useState<Session>(defaultSession);
  const [period, setPeriod] = useState<number>(defaultPeriod);
  const [className, setClassName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [teacher, setTeacher] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (entry) {
      setDayOfWeek(entry.dayOfWeek);
      setSession(entry.session);
      setPeriod(entry.period);
      setClassName(entry.className || '');
      setSubject(entry.subject || '');
      setTeacher(entry.teacher || '');
      setRoom(entry.room || '');
      setNote(entry.note || '');
    } else {
      setDayOfWeek(defaultDay);
      setSession(defaultSession);
      setPeriod(defaultPeriod);
      setClassName('');
      setSubject('');
      setTeacher(selectedTeacher || myTeacher || '');
      setRoom('');
      setNote('');
    }
    setIsDeleting(false);
    setErrorMsg('');
  }, [entry, defaultDay, defaultSession, defaultPeriod, selectedTeacher, myTeacher, isOpen]);

  if (!isOpen || !timetable) return null;

  const handleSave = async () => {
    if (!className.trim()) {
      setErrorMsg('Vui lòng nhập tên lớp học (ví dụ: 6A4).');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Vui lòng nhập tên môn học (ví dụ: Toán).');
      return;
    }
    if (!teacher.trim()) {
      setErrorMsg('Vui lòng chọn hoặc nhập tên giáo viên giảng dạy.');
      return;
    }

    try {
      if (isEditing && entry) {
        await updateTimetableEntry(
          entry.id,
          {
            dayOfWeek,
            session,
            period,
            className: className.trim(),
            subject: subject.trim(),
            teacher: teacher.trim(),
            room: room.trim(),
            note: note.trim(),
          },
          user?.uid
        );
      } else {
        await addTimetableEntry(
          {
            dayOfWeek,
            session,
            period,
            className: className.trim(),
            subject: subject.trim(),
            teacher: teacher.trim(),
            room: room.trim(),
            note: note.trim(),
          },
          user?.uid
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi khi lưu thông tin tiết học.');
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await deleteTimetableEntry(entry.id, user?.uid);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể xóa tiết học.');
    }
  };

  const timeConfig = DEFAULT_PERIOD_TIMES[session]?.[period] || { start: '--:--', end: '--:--' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Chỉnh Sửa Tiết Dạy' : 'Thêm Tiết Dạy Mới'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? `Mã tiết: #${entry?.id.slice(-6)}` : 'Thêm tiết bổ sung / dạy bù vào thời khóa biểu'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Chọn Thứ, Buổi, Tiết */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Thời gian học
            </label>

            {/* Thứ */}
            <div className="grid grid-cols-6 gap-1.5">
              {DAYS_OF_WEEK.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    dayOfWeek === d.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700'
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>

            {/* Buổi & Tiết */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Buổi */}
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1 block">Buổi</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  {(['Sáng', 'Chiều'] as Session[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSession(s)}
                      className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        session === s
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiết */}
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1 block flex items-center justify-between">
                  <span>Tiết học</span>
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                    {timeConfig.start} - {timeConfig.end}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-1 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={`py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        period === p
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lớp & Môn học */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Lớp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lớp học <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="classes-list"
                  placeholder="Ví dụ: 6A4, 9A1..."
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
                <datalist id="classes-list">
                  {timetable.classes.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Môn học */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Môn học <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="subjects-list"
                  placeholder="Ví dụ: Toán, KHTN 1..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
                <datalist id="subjects-list">
                  {timetable.subjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Giáo viên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Giáo viên giảng dạy (hoặc Dạy thay) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                list="teachers-list"
                placeholder="Chọn hoặc nhập tên giáo viên..."
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
              <datalist id="teachers-list">
                {timetable.teachers.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Phòng & Ghi chú */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Phòng học (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: P.201, Tin học..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ghi chú / Lưu ý
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Cô Mai dạy thay, Học bù..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            {isEditing && (
              isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-semibold">Chắc chắn xóa?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                  >
                    Xóa luôn
                  </button>
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="px-2 py-1 text-xs font-medium rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa tiết</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Thêm Tiết'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
