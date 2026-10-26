'use client';

import React, { useState } from 'react';
import { SchedulePatternEntity } from '../types';
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react';

interface SchedulePatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  patterns: SchedulePatternEntity[];
  onSave: (patterns: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) => Promise<void>;
  classNameTitle: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ Nhật' },
];

export const SchedulePatternModal: React.FC<SchedulePatternModalProps> = ({
  isOpen,
  onClose,
  patterns,
  onSave,
  classNameTitle,
}) => {
  const [localPatterns, setLocalPatterns] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  >(() => {
    if (patterns.length > 0) {
      return patterns.map((p) => ({
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
      }));
    }
    return [{ dayOfWeek: 2, startTime: '18:30', endTime: '20:30' }];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPattern = () => {
    setLocalPatterns((prev) => [
      ...prev,
      { dayOfWeek: 3, startTime: '18:30', endTime: '20:30' },
    ]);
  };

  const handleRemovePattern = (index: number) => {
    setLocalPatterns((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime',
    value: any
  ) => {
    setLocalPatterns((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localPatterns.length === 0) {
      alert('Vui lòng thêm ít nhất một khung giờ học định kỳ trong tuần.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(localPatterns);
      onClose();
    } catch (err) {
      alert('Lỗi lưu lịch định kỳ: ' + String(err));
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
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Lịch Học Định Kỳ Tuần</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{classNameTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Thiết lập các thứ và khung giờ học cố định trong tuần. Hệ thống sẽ tự động đối soát và
            sinh lịch học toàn bộ tháng tương ứng.
          </p>

          <div className="space-y-3">
            {localPatterns.map((pat, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-wrap sm:flex-nowrap items-center gap-3"
              >
                {/* Thứ trong tuần */}
                <div className="w-full sm:w-36">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Thứ</label>
                  <select
                    value={pat.dayOfWeek}
                    onChange={(e) => handleChange(idx, 'dayOfWeek', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Giờ bắt đầu */}
                <div className="flex-1 min-w-[110px]">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={pat.startTime}
                    onChange={(e) => handleChange(idx, 'startTime', e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Giờ kết thúc */}
                <div className="flex-1 min-w-[110px]">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={pat.endTime}
                    onChange={(e) => handleChange(idx, 'endTime', e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Nút Xóa */}
                <div className="pt-5 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemovePattern(idx)}
                    className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    title="Xóa khung giờ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddPattern}
            className="w-full py-2.5 border border-dashed border-slate-300 dark:border-slate-700/80 hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khung Giờ Học Khác</span>
          </button>

          {/* Footer actions */}
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Lịch Định Kỳ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
