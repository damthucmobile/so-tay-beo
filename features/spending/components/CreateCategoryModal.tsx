'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, AlertCircle, Loader2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_COLORS, AVAILABLE_CATEGORY_ICONS, TransactionType } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  onSaveCategory: (data: {
    label: string;
    iconName?: string;
    color?: string;
    description?: string;
    type?: TransactionType;
  }) => Promise<string>;
}

const EXPENSE_PRESETS = [
  { label: 'Thú cưng', icon: 'Dog', color: '#f97316' },
  { label: 'Đầu tư & Tiết kiệm', icon: 'TrendingUp', color: '#10b981' },
  { label: 'Làm đẹp & Spa', icon: 'Sparkles', color: '#ec4899' },
  { label: 'Bảo hiểm', icon: 'Shield', color: '#3b82f6' },
  { label: 'Quà tặng & Hiếu hỷ', icon: 'Gift', color: '#a855f7' },
  { label: 'Tập gym & Thể thao', icon: 'Dumbbell', color: '#ef4444' },
  { label: 'Du lịch & Nghỉ dưỡng', icon: 'Plane', color: '#eab308' },
];

const INCOME_PRESETS = [
  { label: 'Dạy kèm ngoài', icon: 'GraduationCap', color: '#10b981' },
  { label: 'Dự án Freelance', icon: 'Laptop', color: '#06b6d4' },
  { label: 'Tiền bản quyền', icon: 'Sparkles', color: '#8b5cf6' },
  { label: 'Cổ tức & Lãi ngân hàng', icon: 'TrendingUp', color: '#10b981' },
  { label: 'Cho thuê tài sản', icon: 'Building', color: '#f59e0b' },
  { label: 'Bán đồ cũ', icon: 'ShoppingBag', color: '#ec4899' },
  { label: 'Thù lao cố vấn', icon: 'Briefcase', color: '#3b82f6' },
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  onSaveCategory,
}) => {
  const [categoryType, setCategoryType] = useState<TransactionType>(initialType);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [iconName, setIconName] = useState('Tag');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCategoryType(initialType);
      setColor(initialType === 'income' ? '#10b981' : '#3b82f6');
      setIconName(initialType === 'income' ? 'Briefcase' : 'Tag');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError(`Vui lòng nhập tên danh mục ${categoryType === 'income' ? 'thu nhập' : 'chi tiêu'}`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSaveCategory({
        label: label.trim(),
        color,
        iconName,
        description: description.trim(),
        type: categoryType,
      });
      // Reset
      setLabel('');
      setColor(categoryType === 'income' ? '#10b981' : '#3b82f6');
      setIconName(categoryType === 'income' ? 'Briefcase' : 'Tag');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi tạo danh mục mới');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (p: { label: string; icon: string; color: string }) => {
    setLabel(p.label);
    setIconName(p.icon);
    setColor(p.color);
    setError('');
  };

  const presets = categoryType === 'income' ? INCOME_PRESETS : EXPENSE_PRESETS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold text-foreground">
              Tạo Danh Mục {categoryType === 'income' ? 'Thu Nhập' : 'Chi Tiêu'} Mới
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tùy biến nhóm dòng tiền phù hợp với kế hoạch tài chính của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Loai Danh Muc Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => {
              setCategoryType('expense');
              if (color === '#10b981') setColor('#3b82f6');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              categoryType === 'expense'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            Danh mục Chi tiêu
          </button>
          <button
            type="button"
            onClick={() => {
              setCategoryType('income');
              if (color === '#3b82f6') setColor('#10b981');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              categoryType === 'income'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            Danh mục Thu nhập
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Preview Card */}
        <div className="mt-4 p-3.5 rounded-2xl border border-border/70 bg-muted/20 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-all"
            style={{ backgroundColor: color }}
          >
            <CategoryIcon name={iconName} className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Xem trước
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                categoryType === 'income'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {categoryType === 'income' ? 'Khoản thu' : 'Khoản chi'}
              </span>
            </div>
            <div className="text-sm font-bold text-foreground truncate mt-0.5">
              {label || 'Tên danh mục của bạn'}
            </div>
            {description && (
              <div className="text-[11px] text-muted-foreground truncate">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Presets suggestions */}
        <div className="mt-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Gợi ý {categoryType === 'income' ? 'thu nhập' : 'chi tiêu'} nhanh
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 text-xs rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Tên danh mục */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Tên danh mục <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                categoryType === 'income'
                  ? 'Ví dụ: Dạy kèm ngoài, Tiền bản quyền, Dự án Freelance...'
                  : 'Ví dụ: Thú cưng, Đầu tư, Làm đẹp...'
              }
              className="h-10 text-sm"
              autoFocus
            />
          </div>

          {/* Chọn Icon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Biểu tượng đại diện
            </label>
            <div className="grid grid-cols-6 gap-2 p-2 rounded-xl border border-border/60 bg-muted/20 max-h-36 overflow-y-auto">
              {AVAILABLE_CATEGORY_ICONS.map((ic) => {
                const isSelected = iconName === ic.name;
                return (
                  <button
                    type="button"
                    key={ic.name}
                    onClick={() => setIconName(ic.name)}
                    title={ic.label}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? categoryType === 'income'
                          ? 'bg-emerald-600 text-white shadow-sm scale-105'
                          : 'bg-primary text-primary-foreground shadow-sm scale-105'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <CategoryIcon name={ic.name} className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn Màu sắc */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Màu sắc chủ đạo
            </label>
            <div className="flex flex-wrap gap-2 p-2 rounded-xl border border-border/60 bg-muted/20">
              {CATEGORY_COLORS.map((c) => {
                const isSelected = color === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
          </div>

          {/* Ghi chú / Mô tả */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Mô tả thêm (không bắt buộc)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết về các khoản thuộc danh mục này..."
              className="h-9 text-xs"
            />
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`gap-2 ${
                categoryType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
                  : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Tạo danh mục
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
