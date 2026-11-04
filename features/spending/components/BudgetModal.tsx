'use client';

import React, { useState, useEffect } from 'react';
import { X, Target, DollarSign, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: number;
  month: string; // 'YYYY-MM'
  onSaveBudget: (amount: number) => Promise<void>;
}

const BUDGET_SUGGESTIONS = [
  { label: '5 Triệu', value: 5000000 },
  { label: '8 Triệu', value: 8000000 },
  { label: '10 Triệu', value: 10000000 },
  { label: '15 Triệu', value: 15000000 },
  { label: '20 Triệu', value: 20000000 },
  { label: '30 Triệu', value: 30000000 },
];

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  month,
  onSaveBudget,
}) => {
  const [budgetStr, setBudgetStr] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentBudget > 0) {
      setBudgetStr(currentBudget.toLocaleString('vi-VN'));
    } else {
      setBudgetStr('');
    }
    setError('');
  }, [currentBudget, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(budgetStr.replace(/\D/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount < 0) {
      setError('Vui lòng nhập hạn mức ngân sách hợp lệ');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveBudget(cleanAmount);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu ngân sách');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setBudgetStr('');
      return;
    }
    const num = parseInt(raw, 10);
    setBudgetStr(num.toLocaleString('vi-VN'));
  };

  const formattedMonth = (() => {
    const [y, m] = month.split('-');
    return `Tháng ${m}/${y}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Hạn Mức Chi Tiêu</h2>
              <p className="text-xs text-muted-foreground">{formattedMonth}</p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Ngân sách mục tiêu (VND)
            </label>
            <div className="relative">
              <Input
                type="text"
                value={budgetStr}
                onChange={handleAmountChange}
                placeholder="0"
                className="text-2xl font-bold tracking-tight h-12 pr-12 text-primary"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                đ
              </span>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {BUDGET_SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setBudgetStr(s.value.toLocaleString('vi-VN'))}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/60 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Đặt ngân sách giúp Trợ lý AI và biểu đồ cảnh báo khi bạn chi tiêu chạm ngưỡng 85% hoặc vượt mức cho phép trong tháng.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận hạn mức'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
