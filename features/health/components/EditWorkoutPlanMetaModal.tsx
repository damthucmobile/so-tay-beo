// features/health/components/EditWorkoutPlanMetaModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit, Flame, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WorkoutPlan } from '../types';

interface EditWorkoutPlanMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: WorkoutPlan | null;
  onSave: (updates: Partial<WorkoutPlan>) => Promise<void>;
}

export const EditWorkoutPlanMetaModal: React.FC<EditWorkoutPlanMetaModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [weeklyTargetCalories, setWeeklyTargetCalories] = useState<number>(1600);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || '');
      setWeeklyTargetCalories(plan.weeklyTargetCalories || 1600);
      setAiAnalysisSummary(plan.aiAnalysisSummary || '');
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        weeklyTargetCalories: Math.max(500, weeklyTargetCalories),
        aiAnalysisSummary: aiAnalysisSummary.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Lỗi lưu thông tin lịch tập:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Edit className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                Chỉnh Sửa Thông Tin Lịch Tập
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Cập nhật tiêu đề và mục tiêu calo tiêu hao tuần
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên kế hoạch lịch tập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Mục tiêu Calo tiêu hao / Tuần (kcal)</span>
            </label>
            <input
              type="number"
              min="500"
              step="100"
              value={weeklyTargetCalories}
              onChange={(e) => setWeeklyTargetCalories(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Nhận định y học thể thao & Lý giải chiến lược của AI:</span>
            </label>
            <textarea
              rows={4}
              value={aiAnalysisSummary}
              onChange={(e) => setAiAnalysisSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
