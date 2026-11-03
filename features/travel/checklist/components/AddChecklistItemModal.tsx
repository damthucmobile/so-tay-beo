// features/travel/checklist/components/AddChecklistItemModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  FileText,
  Shirt,
  Smartphone,
  Pill,
  Sparkles,
  Plus,
  Compass,
} from 'lucide-react';
import { ChecklistItem, ChecklistCategory } from '../../types';
import { useTravelStore } from '../../stores/useTravelStore';

interface AddChecklistItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ChecklistItem, 'id' | 'createdAt'>) => Promise<any>;
  defaultTripId?: string;
}

export const CHECKLIST_CATEGORY_CONFIG: Record<
  ChecklistCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  documents: { label: 'Giấy tờ & Tiền bạc', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  clothes: { label: 'Quần áo & Trang phục', icon: Shirt, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  electronics: { label: 'Thiết bị & Công nghệ', icon: Smartphone, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  medicine: { label: 'Y tế & Thuốc men', icon: Pill, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  toiletries: { label: 'Mỹ phẩm & Cá nhân', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  other: { label: 'Đồ dùng khác', icon: CheckSquare, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export const AddChecklistItemModal: React.FC<AddChecklistItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTripId,
}) => {
  const { trips } = useTravelStore();

  const [text, setText] = useState('');
  const [tripId, setTripId] = useState(defaultTripId || trips[0]?.id || 'general');
  const [category, setCategory] = useState<ChecklistCategory>('clothes');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Vui lòng nhập tên món đồ cần chuẩn bị');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        tripId,
        text: text.trim(),
        category,
        completed: false,
        quantity: Math.max(1, quantity),
        notes: notes.trim() || undefined,
      });
      setText('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Lỗi khi thêm đồ đạc:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Thêm Đồ Đạc Cần Mang
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lên danh sách chuẩn bị để không bỏ quên vật dụng quan trọng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên món đồ / Vật dụng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ví dụ: Áo khoác ấm, Kem chống nắng, Sạc dự phòng..."
              className="w-full text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chuyến đi</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              >
                <option value="general">Dùng chung cho mọi chuyến</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Số lượng</label>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phân loại danh mục</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CHECKLIST_CATEGORY_CONFIG).map(([k, cfg]) => {
                const Icon = cfg.icon;
                const isSelected = category === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCategory(k as ChecklistCategory)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Để trong vali lớn hay balo xách tay..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
            >
              + Thêm vào checklist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
