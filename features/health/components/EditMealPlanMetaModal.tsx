// features/health/components/EditMealPlanMetaModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit,
  Flame,
  Droplets,
  CheckCircle2,
  FileText,
  PieChart,
} from 'lucide-react';
import { MealPlan } from '../types';

interface EditMealPlanMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  onSave: (updates: Partial<MealPlan>) => Promise<void>;
}

export const EditMealPlanMetaModal: React.FC<EditMealPlanMetaModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [targetCalories, setTargetCalories] = useState<number>(1800);
  const [targetWaterMl, setTargetWaterMl] = useState<number>(2500);
  const [carbsPct, setCarbsPct] = useState<number>(50);
  const [proteinPct, setProteinPct] = useState<number>(25);
  const [fatPct, setFatPct] = useState<number>(25);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title || '');
      setTargetCalories(plan.targetCalories || 1800);
      setTargetWaterMl(plan.targetWaterMl || 2500);
      setCarbsPct(plan.macroRatio?.carbsPct || 50);
      setProteinPct(plan.macroRatio?.proteinPct || 25);
      setFatPct(plan.macroRatio?.fatPct || 25);
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
        targetCalories: Math.max(1000, targetCalories),
        targetWaterMl: Math.max(1000, targetWaterMl),
        macroRatio: {
          carbsPct,
          proteinPct,
          fatPct,
        },
        aiAnalysisSummary: aiAnalysisSummary.trim(),
      });
      onClose();
    } catch (err) {
      console.error('Lỗi lưu thông tin thực đơn:', err);
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Edit className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Chỉnh Sửa Thông Tin Thực Đơn
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Cập nhật tiêu đề, mục tiêu năng lượng và tỷ lệ dinh dưỡng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên kế hoạch thực đơn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Mục tiêu Calo (kcal/ngày)</span>
              </label>
              <input
                type="number"
                step="50"
                value={targetCalories}
                onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span>Mục tiêu Nước (ml/ngày)</span>
              </label>
              <input
                type="number"
                step="100"
                value={targetWaterMl}
                onChange={(e) => setTargetWaterMl(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-sky-600 dark:text-sky-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Macro Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tỷ lệ thành phần dinh dưỡng (%)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">Carbs (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={carbsPct}
                  onChange={(e) => setCarbsPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">Protein (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={proteinPct}
                  onChange={(e) => setProteinPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold">Fat (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fatPct}
                  onChange={(e) => setFatPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* AI Analysis / Plan note */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú & Nhận định kế hoạch:</span>
            </label>
            <textarea
              rows={3}
              value={aiAnalysisSummary}
              onChange={(e) => setAiAnalysisSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
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
