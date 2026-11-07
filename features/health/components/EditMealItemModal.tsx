// features/health/components/EditMealItemModal.tsx
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
  Wheat,
  Fish,
  Droplet,
} from 'lucide-react';
import { MealItem } from '../types';

interface EditMealItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  dayName: string;
  item: MealItem | null;
  onSave: (savedItem: MealItem) => void;
  onDelete?: (itemId: string) => void;
}

const MEAL_TYPE_NAMES: Record<string, string> = {
  breakfast: 'Bữa Sáng',
  lunch: 'Bữa Trưa',
  dinner: 'Bữa Tối',
  snacks: 'Bữa Phụ / Trái Cây',
};

export const EditMealItemModal: React.FC<EditMealItemModalProps> = ({
  isOpen,
  onClose,
  mealType,
  dayName,
  item,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('1 phần');
  const [calories, setCalories] = useState<number>(300);
  const [carbs, setCarbs] = useState<number>(30);
  const [protein, setProtein] = useState<number>(25);
  const [fat, setFat] = useState<number>(8);
  const [healthBenefit, setHealthBenefit] = useState('');
  const [recipeTips, setRecipeTips] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setPortion(item.portion || '1 phần');
      setCalories(item.calories || 0);
      setCarbs(item.carbs || 0);
      setProtein(item.protein || 0);
      setFat(item.fat || 0);
      setHealthBenefit(item.healthBenefit || '');
      setRecipeTips(item.recipeTips || '');
    } else {
      setName('');
      setPortion('1 phần (150g)');
      setCalories(350);
      setCarbs(40);
      setProtein(25);
      setFat(8);
      setHealthBenefit('');
      setRecipeTips('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!item;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved: MealItem = {
      id: item?.id || `meal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      portion: portion.trim() || '1 phần',
      calories: Math.max(0, calories),
      carbs: Math.max(0, carbs),
      protein: Math.max(0, protein),
      fat: Math.max(0, fat),
      healthBenefit: healthBenefit.trim(),
      recipeTips: recipeTips.trim() || undefined,
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {isEditing ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {MEAL_TYPE_NAMES[mealType] || 'Bữa ăn'} • {dayName}
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
              Tên món ăn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cá quả hấp thì là, Canh mồng tơi nấu cua..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Khẩu phần / Định lượng
              </label>
              <input
                type="text"
                placeholder="VD: 1 bát con, 1 đĩa 150g..."
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Năng lượng (Calo)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={calories}
                  onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                  kcal
                </span>
              </div>
            </div>
          </div>

          {/* Macro breakdown */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Thành phần dinh dưỡng (gam)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Wheat className="w-3 h-3 text-amber-500" /> Tinh bột (Carb)
                </span>
                <input
                  type="number"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Fish className="w-3 h-3 text-rose-500" /> Chất đạm (Pro)
                </span>
                <input
                  type="number"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-sky-500" /> Chất béo (Fat)
                </span>
                <input
                  type="number"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Lợi ích y khoa */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tác dụng đối với chỉ số sức khỏe (Lý do y tế):</span>
            </label>
            <input
              type="text"
              placeholder="VD: Giàu đạm tinh khiết ít purin, hỗ trợ hạ mỡ máu & bảo vệ gan..."
              value={healthBenefit}
              onChange={(e) => setHealthBenefit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Mẹo chế biến */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Gợi ý chế biến & Lưu ý gia vị:
            </label>
            <input
              type="text"
              placeholder="VD: Hấp chín tới, nêm nhạt ít muối, dùng dầu oliu..."
              value={recipeTips}
              onChange={(e) => setRecipeTips(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Bạn có chắc muốn xóa món ăn này khỏi bữa?')) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa món</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Cập Nhật Món' : 'Thêm Vào Bữa Ăn'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
