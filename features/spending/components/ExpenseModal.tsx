'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  DollarSign,
  Tag,
  FileText,
  CreditCard,
  Plus,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ExpenseItem,
  ExpenseCategory,
  PaymentMethod,
  PAYMENT_METHODS,
  CategoryMeta,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../types';
import { useAllExpenseCategories } from '../stores/useSpendingStore';
import { CategoryIcon } from './CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<any>;
  onUpdate?: (id: string, data: Partial<ExpenseItem>) => Promise<any>;
  editingExpense: ExpenseItem | null;
  isSaving: boolean;
  categories?: CategoryMeta[];
  onOpenCreateCategory?: () => void;
}

const QUICK_AMOUNTS = [
  { label: '30k', value: 30000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingExpense,
  isSaving,
  categories: propCategories,
  onOpenCreateCategory,
}) => {
  const storeAllCategories = useAllExpenseCategories();
  const categoriesList = propCategories || storeAllCategories || DEFAULT_EXPENSE_CATEGORIES;

  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (editingExpense) {
      setAmountStr(editingExpense.amount.toString());
      setCategory(editingExpense.category || 'other');
      setDate(editingExpense.date || format(new Date(), 'yyyy-MM-dd'));
      setTime(editingExpense.time || format(new Date(), 'HH:mm'));
      setDescription(editingExpense.description || '');
      setPaymentMethod(editingExpense.paymentMethod || 'transfer');
      setNotes(editingExpense.notes || '');
    } else {
      setAmountStr('');
      setCategory('food');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setDescription('');
      setPaymentMethod('transfer');
      setNotes('');
    }
    setError('');
  }, [editingExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Vui lòng nhập số tiền chi tiêu hợp lệ');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng nhập nội dung chi tiêu (ví dụ: Ăn trưa, Đổ xăng, ...)');
      return;
    }

    try {
      if (editingExpense && onUpdate) {
        await onUpdate(editingExpense.id, {
          amount: cleanAmount,
          category,
          date,
          time,
          description: description.trim(),
          paymentMethod,
          notes: notes.trim(),
        });
      } else {
        await onSubmit({
          amount: cleanAmount,
          category,
          date,
          time,
          description: description.trim(),
          paymentMethod,
          notes: notes.trim(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu khoản chi');
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmountStr(val.toLocaleString('vi-VN'));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAmountStr('');
      return;
    }
    const num = parseInt(raw, 10);
    setAmountStr(num.toLocaleString('vi-VN'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {editingExpense ? 'Chỉnh Sửa Khoản Chi' : 'Ghi Nhận Khoản Chi Mới'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cập nhật thông tin chi tiêu sinh hoạt đời sống
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
          <div className="mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Số tiền */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Số tiền chi (VND) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="text-2xl font-bold tracking-tight h-12 pr-12 text-primary"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                đ
              </span>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  type="button"
                  key={q.value}
                  onClick={() => handleQuickAmount(q.value)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  +{q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh mục chi tiêu */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Danh mục chi tiêu <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {categoriesList.map((cat) => {
                const isSelected = category === cat.id;

                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary bg-primary/10 shadow-xs'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate text-foreground">
                      {cat.label}
                    </span>
                  </button>
                );
              })}

              {onOpenCreateCategory && (
                <button
                  type="button"
                  onClick={onOpenCreateCategory}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary transition-all text-left group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 text-primary shrink-0 transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold truncate">+ Thêm mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Mô tả / Nội dung chi */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Nội dung chi tiêu <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Ăn trưa phở bò, Mua quà sinh nhật, Đổ xăng xe máy..."
              className="h-10 text-sm"
            />
          </div>

          {/* Ngày & Giờ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Ngày chi
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Thời gian
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`px-3 py-2 text-xs rounded-xl border text-left transition-colors ${
                    paymentMethod === pm.id
                      ? 'border-primary ring-1 ring-primary bg-primary/10 font-medium text-primary'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              Ghi chú thêm (không bắt buộc)
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chi tiết cửa hàng, chia tiền cùng ai..."
              className="h-9 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingExpense ? 'Lưu thay đổi' : 'Ghi nhận chi tiêu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
