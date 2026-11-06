// features/health/components/CreateCheckupModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Building2,
  FileCheck2,
  Sparkles,
  Info,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { HealthService } from '../services/healthService';
import { HealthCheckupSession } from '../types';

interface CreateCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (sessionId: string) => void;
  initialData?: Partial<HealthCheckupSession>;
}

const QUICK_TITLES = [
  'Khám sức khỏe định kỳ 2026',
  'Khám tổng quát định kỳ',
  'Khám sức khỏe công ty',
  'Khám chuyên khoa',
];

const QUICK_HOSPITALS = [
  'Bệnh viện Đại học Y Hà Nội',
  'Bệnh viện Bạch Mai',
  'Bệnh viện Đa khoa Quốc tế Vinmec',
  'Bệnh viện Quân y 108',
  'Phòng khám Đa khoa Medlatec',
];

export const CreateCheckupModal: React.FC<CreateCheckupModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialData,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState(initialData?.title || 'Khám sức khỏe định kỳ 2026');
  const [checkupDate, setCheckupDate] = useState(
    initialData?.checkupDate || new Date().toISOString().split('T')[0]
  );
  const [hospitalName, setHospitalName] = useState(
    initialData?.hospitalName || 'Bệnh viện Đại học Y Hà Nội'
  );
  const [doctorName, setDoctorName] = useState(initialData?.doctorName || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      alert('Vui lòng đăng nhập để tạo đợt khám.');
      return;
    }
    if (!title.trim() || !hospitalName.trim()) {
      alert('Vui lòng nhập tên đợt khám và bệnh viện.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionId = await HealthService.saveCheckupSession(user.uid, {
        title: title.trim(),
        checkupDate,
        hospitalName: hospitalName.trim(),
        doctorName: doctorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (onCreated) {
        onCreated(sessionId);
      }
      onClose();
    } catch (err: any) {
      console.error('Lỗi lưu đợt khám:', err);
      alert(err.message || 'Lỗi khi lưu đợt khám');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tạo Đợt Khám Sức Khỏe Mới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tạo mã đợt khám để import bằng AI hoặc bổ sung kết quả sau
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông báo hướng dẫn ngắn */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Chỉ cần tạo tên và ngày khám. Các kết quả xét nghiệm, chỉ số sinh học và kết luận chuyên khoa sẽ được nạp tự động qua <strong>AI Quét tài liệu</strong> hoặc thêm thủ công bất cứ khi nào có kết quả.
            </span>
          </div>

          {/* Tên Đợt Khám */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên Đợt Khám <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Khám sức khỏe định kỳ T10/2026, Khám tổng quát Vinmec..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {QUICK_TITLES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTitle(t)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Cơ sở y tế */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bệnh Viện / Cơ Sở Khám</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="VD: Bệnh viện Đại học Y Hà Nội, Vinmec..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            {/* Quick hospital chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {QUICK_HOSPITALS.map((h) => (
                <button
                  type="button"
                  key={h}
                  onClick={() => setHospitalName(h)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Ngày Khám */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Ngày Khám</span>
              </label>
              <input
                type="date"
                required
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Bác Sĩ (Tùy chọn) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bác Sĩ Phụ Trách (Tùy chọn)</span>
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="VD: BS. Vũ Thùy Linh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Ghi Chú Ban Đầu (Tùy chọn) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi Chú Ban Đầu (Tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Gói khám sức khỏe công ty, nhịn ăn sáng..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo đợt khám...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Tạo Đợt Khám</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
