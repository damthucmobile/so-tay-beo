'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORY_COLORS, AVAILABLE_CATEGORY_ICONS } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (data: {
    label: string;
    iconName?: string;
    color?: string;
    description?: string;
  }) => Promise<string>;
}

const PRESET_SUGGESTIONS = [
  { label: 'Thú cưng', icon: 'Dog', color: '#f97316' },
  { label: 'Đầu tư & Cổ phiếu', icon: 'TrendingUp', color: '#10b981' },
  { label: 'Tiết kiệm', icon: 'PiggyBank', color: '#06b6d4' },
  { label: 'Làm đẹp & Spa', icon: 'Sparkles', color: '#ec4899' },
  { label: 'Bảo hiểm', icon: 'Shield', color: '#3b82f6' },
  { label: 'Quà tặng & Hiếu hỷ', icon: 'Gift', color: '#a855f7' },
  { label: 'Tập gym & Thể thao', icon: 'Dumbbell', color: '#ef4444' },
  { label: 'Du lịch & Nghỉ dưỡng', icon: 'Plane', color: '#eab308' },
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onSaveCategory,
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [iconName, setIconName] = useState('Tag');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Vui lòng nhập tên danh mục chi tiêu');
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
      });
      // Reset
      setLabel('');
      setColor('#3b82f6');
      setIconName('Tag');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-base font-bold text-foreground">Tạo Danh Mục Chi Tiêu Mới</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tùy biến nhóm chi tiêu phù hợp với thói quen sinh hoạt của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
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
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Xem trước hiển thị
            </div>
            <div className="text-sm font-bold text-foreground truncate">
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
            Gợi ý nhanh
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SUGGESTIONS.map((p) => (
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
              placeholder="Ví dụ: Thú cưng, Đầu tư, Làm đẹp, ..."
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
                        ? 'bg-primary text-primary-foreground shadow-sm scale-105'
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
            <Button type="submit" disabled={isSubmitting} className="gap-2">
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
