// features/health/components/EditExerciseModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Clock,
  Dumbbell,
} from 'lucide-react';
import { ExerciseItem, ExerciseCategory } from '../types';

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayName: string;
  item: ExerciseItem | null;
  onSave: (savedItem: ExerciseItem) => void;
  onDelete?: (itemId: string) => void;
}

const CATEGORY_NAMES: Record<ExerciseCategory, string> = {
  warmup: 'Khởi động (Warm-up)',
  main: 'Bài tập chính (Main)',
  cooldown: 'Dãn cơ & Hạ nhiệt (Cool-down)',
};

export const EditExerciseModal: React.FC<EditExerciseModalProps> = ({
  isOpen,
  onClose,
  dayName,
  item,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('main');
  const [targetMuscle, setTargetMuscle] = useState('Toàn thân');
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(12);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [restSeconds, setRestSeconds] = useState<number>(60);
  const [weightKg, setWeightKg] = useState<number>(0);
  const [formCues, setFormCues] = useState('');
  const [medicalNotice, setMedicalNotice] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'main');
      setTargetMuscle(item.targetMuscle || 'Toàn thân');
      setSets(item.sets || 3);
      setReps(item.reps || 0);
      setDurationSeconds(item.durationSeconds || 0);
      setRestSeconds(item.restSeconds || 60);
      setWeightKg(item.weightKg || 0);
      setFormCues(item.formCues || '');
      setMedicalNotice(item.medicalNotice || '');
    } else {
      setName('');
      setCategory('main');
      setTargetMuscle('Toàn thân');
      setSets(3);
      setReps(12);
      setDurationSeconds(0);
      setRestSeconds(60);
      setWeightKg(0);
      setFormCues('');
      setMedicalNotice('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!item;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: ExerciseItem = {
      id: item?.id || `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      category,
      targetMuscle: targetMuscle.trim() || 'Toàn thân',
      sets: Math.max(1, sets),
      reps: reps > 0 ? reps : undefined,
      durationSeconds: durationSeconds > 0 ? durationSeconds : undefined,
      restSeconds: Math.max(0, restSeconds),
      weightKg: weightKg > 0 ? weightKg : undefined,
      formCues: formCues.trim(),
      medicalNotice: medicalNotice.trim() || undefined,
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                {isEditing ? 'Chỉnh Sửa Động Tác' : 'Thêm Động Tác Mới'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {dayName} • {CATEGORY_NAMES[category]}
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
              Tên động tác / Bài tập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Incline Push-ups, Squat điểm tựa, Đi bộ Zone 2..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Giai đoạn buổi tập
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="warmup">Khởi động (Warm-up)</option>
                <option value="main">Bài tập chính (Main)</option>
                <option value="cooldown">Hạ nhiệt & Dãn cơ (Cool-down)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nhóm cơ tác động
              </label>
              <input
                type="text"
                placeholder="VD: Cơ đùi & mông, Ngực, Vai..."
                value={targetMuscle}
                onChange={(e) => setTargetMuscle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Sets, Reps, Rest, Weight */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Số hiệp (Sets)</span>
              <input
                type="number"
                min="1"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Số lần (Reps)</span>
              <input
                type="number"
                min="0"
                placeholder="VD: 12"
                value={reps || ''}
                onChange={(e) => setReps(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Nghỉ (Giây)</span>
              <input
                type="number"
                min="0"
                step="5"
                value={restSeconds}
                onChange={(e) => setRestSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">Mức tạ (Kg)</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={weightKg || ''}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Hướng dẫn kỹ thuật */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Hướng dẫn tư thế & Kỹ thuật hít thở:
            </label>
            <textarea
              rows={2}
              placeholder="VD: Gồng nhẹ cơ bụng, giữ lưng thẳng, hạ ngực từ từ, thở ra khi phát lực..."
              value={formCues}
              onChange={(e) => setFormCues(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Lưu ý y tế */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lưu ý an toàn y tế (Bảo vệ tim mạch, khớp):</span>
            </label>
            <input
              type="text"
              placeholder="VD: Không nín thở để tránh tăng áp lực máu, dừng lại nếu gối đau nhói..."
              value={medicalNotice}
              onChange={(e) => setMedicalNotice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xóa động tác "${item.name}"?`)) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa động tác</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Lưu Thay Đổi' : 'Thêm Vào Buổi Tập'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
