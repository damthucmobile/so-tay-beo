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
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ExpenseItem,
  ExpenseCategory,
  PaymentMethod,
  PAYMENT_METHODS,
  CategoryMeta,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  TransactionType,
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
  initialType?: TransactionType;
  categories?: CategoryMeta[];
  onOpenCreateCategory?: (type: TransactionType) => void;
}

const EXPENSE_QUICK_AMOUNTS = [
  { label: '30k', value: 30000 },
  { label: '50k', value: 50000 },
  { label: '100k', value: 100000 },
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
];

const INCOME_QUICK_AMOUNTS = [
  { label: '200k', value: 200000 },
  { label: '500k', value: 500000 },
  { label: '1tr', value: 1000000 },
  { label: '2tr', value: 2000000 },
  { label: '5tr', value: 5000000 },
  { label: '10tr', value: 10000000 },
  { label: '20tr', value: 20000000 },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  editingExpense,
  isSaving,
  initialType = 'expense',
  categories: propCategories,
  onOpenCreateCategory,
}) => {
  const storeAllCategories = useAllExpenseCategories();
  const categoriesList = propCategories || storeAllCategories || DEFAULT_EXPENSE_CATEGORIES;

  const [type, setType] = useState<TransactionType>(initialType);
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
      const expType = editingExpense.type || 'expense';
      setType(expType);
      setAmountStr(editingExpense.amount.toString());
      setCategory(editingExpense.category || (expType === 'income' ? 'salary' : 'other'));
      setDate(editingExpense.date || format(new Date(), 'yyyy-MM-dd'));
      setTime(editingExpense.time || format(new Date(), 'HH:mm'));
      setDescription(editingExpense.description || '');
      setPaymentMethod(editingExpense.paymentMethod || 'transfer');
      setNotes(editingExpense.notes || '');
    } else {
      setType(initialType);
      setAmountStr('');
      setCategory(initialType === 'income' ? 'salary' : 'food');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setDescription('');
      setPaymentMethod('transfer');
      setNotes('');
    }
    setError('');
  }, [editingExpense, isOpen, initialType]);

  if (!isOpen) return null;

  const filteredCategories = categoriesList.filter((c) => (c.type || 'expense') === type);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!editingExpense) {
      setCategory(newType === 'income' ? 'salary' : 'food');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amountStr.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!description.trim()) {
      setError(
        type === 'income'
          ? 'Vui lòng nhập nguồn thu nhập (ví dụ: Lương tháng, Dạy kèm, Thưởng...)'
          : 'Vui lòng nhập nội dung chi tiêu (ví dụ: Ăn trưa, Đổ xăng...)'
      );
      return;
    }

    try {
      if (editingExpense && onUpdate) {
        await onUpdate(editingExpense.id, {
          type,
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
          type,
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
      setError(err?.message || 'Có lỗi xảy ra khi lưu giao dịch');
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

  const quickAmounts = type === 'income' ? INCOME_QUICK_AMOUNTS : EXPENSE_QUICK_AMOUNTS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {editingExpense
                ? type === 'income' ? 'Chỉnh Sửa Khoản Thu' : 'Chỉnh Sửa Khoản Chi'
                : type === 'income' ? 'Ghi Nhận Khoản Thu Mới' : 'Ghi Nhận Khoản Chi Mới'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {type === 'income'
                ? 'Ghi nhận dòng tiền thu nhập, thù lao, thưởng vào ví'
                : 'Cập nhật thông tin chi tiêu sinh hoạt đời sống'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Type Switcher: Chi tiêu / Thu nhập (khi tạo mới) */}
        {!editingExpense && (
          <div className="mt-3 grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'expense'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
              <span>Khoản Chi (Tiền ra)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'income'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
              <span>Khoản Thu (Tiền vào)</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Số tiền */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
              {type === 'income' ? 'Số tiền thu (VND)' : 'Số tiền chi (VND)'} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0"
                className={`text-2xl font-bold tracking-tight h-12 pr-12 ${
                  type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                đ
              </span>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quickAmounts.map((q) => (
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

          {/* Danh mục chi tiêu / thu nhập */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
              {type === 'income' ? 'Danh mục thu nhập' : 'Danh mục chi tiêu'} <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = category === cat.id;

                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? type === 'income'
                          ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/10 shadow-xs'
                          : 'border-primary ring-1 ring-primary bg-primary/10 shadow-xs'
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
                  onClick={() => onOpenCreateCategory(type)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border border-dashed transition-all text-left group ${
                    type === 'income'
                      ? 'border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    type === 'income'
                      ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-primary/10 group-hover:bg-primary/20 text-primary'
                  }`}>
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold truncate">+ Thêm mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Mô tả / Nội dung chi hoặc thu */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
              {type === 'income' ? 'Nội dung khoản thu' : 'Nội dung chi tiêu'} <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'Ví dụ: Lương tháng 11, Thù lao dạy lớp Toán 12, Tiền thưởng dự án...'
                  : 'Ví dụ: Ăn trưa phở bò, Mua quà sinh nhật, Đổ xăng xe máy...'
              }
              className="h-10 text-sm"
            />
          </div>

          {/* Ngày & Giờ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
                {type === 'income' ? 'Ngày nhận' : 'Ngày chi'}
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
                <Clock className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
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
              <CreditCard className={`h-3.5 w-3.5 ${type === 'income' ? 'text-emerald-500' : 'text-primary'}`} />
              {type === 'income' ? 'Tài khoản / Kênh nhận tiền' : 'Phương thức thanh toán'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`px-3 py-2 text-xs rounded-xl border text-left transition-colors ${
                    paymentMethod === pm.id
                      ? type === 'income'
                        ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400'
                        : 'border-primary ring-1 ring-primary bg-primary/10 font-medium text-primary'
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
              placeholder="Chi tiết đối tác, hợp đồng, nguồn nhận..."
              className="h-9 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className={`gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600'
                  : ''
              }`}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingExpense
                ? 'Lưu thay đổi'
                : type === 'income'
                ? 'Ghi nhận thu nhập'
                : 'Ghi nhận chi tiêu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
