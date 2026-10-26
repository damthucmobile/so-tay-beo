'use client';

import React, { useState, useEffect } from 'react';
import { ClassSessionEntity, SessionStatus } from '../types';
import { X, Clock, Calendar, DollarSign, Users, BookOpen, FileText } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface SessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ClassSessionEntity | null;
  onSave: (sessionData: Partial<ClassSessionEntity>) => Promise<void>;
}

export const SessionEditModal: React.FC<SessionEditModalProps> = ({
  isOpen,
  onClose,
  session,
  onSave,
}) => {
  const [sessionDate, setSessionDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<SessionStatus>('SCHEDULED');
  const [calculatedHeadcount, setCalculatedHeadcount] = useState<number>(0);
  const [calculatedSalary, setCalculatedSalary] = useState<number>(0);
  const [lessonTopic, setLessonTopic] = useState('');
  const [homework, setHomework] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      setSessionDate(session.sessionDate || '');
      setStartTime(session.startTime || '18:30');
      setEndTime(session.endTime || '20:30');
      setStatus(session.status || 'SCHEDULED');
      setCalculatedHeadcount(session.calculatedHeadcount || 0);
      setCalculatedSalary(session.calculatedSalary || 0);
      setLessonTopic(session.lessonTopic || '');
      setHomework(session.homework || '');
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave({
        id: session.id,
        sessionDate,
        startTime,
        endTime,
        status,
        calculatedHeadcount: Number(calculatedHeadcount) || 0,
        calculatedSalary: Number(calculatedSalary) || 0,
        lessonTopic,
        homework,
        notes,
      });
      onClose();
    } catch (err) {
      alert('Lỗi lưu buổi học: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Chỉnh Sửa Buổi Học & Nhật Ký</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ngày {session.sessionDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Ngày & Trạng thái */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">Ngày học</label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SessionStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="COMPLETED">✅ Đã dạy hoàn thành</option>
                <option value="SCHEDULED">📅 Đã lên lịch</option>
                <option value="HOLIDAY">🏖️ Nghỉ lễ</option>
                <option value="CANCELLED">❌ Hủy buổi</option>
              </select>
            </div>
          </div>

          {/* Giờ học */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">Giờ kết thúc</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sỹ số & Thù lao buổi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Sỹ số hiệu lực (HS)</span>
              </label>
              <input
                type="number"
                min="0"
                value={calculatedHeadcount}
                onChange={(e) => setCalculatedHeadcount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Thù lao buổi (VNĐ)</span>
              </label>
              <CurrencyInput
                value={calculatedSalary}
                onChange={(val) => setCalculatedSalary(val)}
                placeholder="200.000"
                className="text-emerald-600 dark:text-emerald-400 font-semibold"
              />
            </div>
          </div>

          {/* Chủ đề bài học */}
          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>Chủ đề / Nội dung bài giảng</span>
            </label>
            <input
              type="text"
              placeholder="VD: Chuyên đề khảo sát hàm số bậc 3 & cực trị..."
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Bài tập về nhà */}
          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">Bài tập về nhà (BTVN)</label>
            <input
              type="text"
              placeholder="VD: Làm phiếu bài tập số 4 từ câu 1 đến 25..."
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Ghi chú buổi dạy */}
          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              <span>Nhật ký / Đánh giá buổi học</span>
            </label>
            <textarea
              rows={2}
              placeholder="Đánh giá không khí lớp học, học sinh nào chưa hiểu bài..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
