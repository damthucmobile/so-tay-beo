'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  Wallet,
  Clock,
  CreditCard,
} from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ExpenseItem, PAYMENT_METHODS, CategoryMeta, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { useAllExpenseCategories } from '../stores/useSpendingStore';
import { CategoryIcon } from './CategoryIcon';
import { Button } from '@/components/ui/button';

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onOpenCreate: () => void;
  categories?: CategoryMeta[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEditExpense,
  onDeleteExpense,
  onOpenCreate,
  categories: propCategories,
}) => {
  const storeCategories = useAllExpenseCategories();
  const allCategories = propCategories || storeCategories || DEFAULT_EXPENSE_CATEGORIES;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
        <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto mb-4">
          <Wallet className="h-7 w-7" />
        </div>
        <h3 className="font-semibold text-base text-foreground mb-1">
          Chưa có khoản chi tiêu nào
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
          Ghi nhận các khoản chi tiêu hàng ngày để theo dõi ngân sách hoặc bạn có thể bảo Trợ lý AI ghi hộ bất kỳ lúc nào!
        </p>
        <Button onClick={onOpenCreate} className="gap-2">
          + Ghi nhận chi tiêu
        </Button>
      </div>
    );
  }

  // Nhóm theo ngày (giảm dần)
  const grouped = expenses.reduce((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ExpenseItem[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDateHeader = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return `Hôm nay, ${format(d, 'dd/MM/yyyy')}`;
      if (isYesterday(d)) return `Hôm qua, ${format(d, 'dd/MM/yyyy')}`;
      return format(d, 'EEEE, dd/MM/yyyy', { locale: vi });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dayItems = grouped[dateStr];
        const dayTotal = dayItems.reduce((s, it) => s + (Number(it.amount) || 0), 0);

        return (
          <div key={dateStr} className="space-y-2">
            {/* Day Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground capitalize">
                {formatDateHeader(dateStr)}
              </span>
              <span className="text-xs font-bold text-foreground">
                Tổng ngày: {formatVND(dayTotal)}
              </span>
            </div>

            {/* Day Items List */}
            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40 shadow-sm">
              {dayItems.map((expense) => {
                const catMeta = allCategories.find((c) => c.id === expense.category);
                const pmLabel = PAYMENT_METHODS.find((p) => p.id === expense.paymentMethod)?.label;

                return (
                  <div
                    key={expense.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Left: Icon & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: catMeta?.color || '#71717a' }}
                      >
                        <CategoryIcon name={catMeta?.iconName} className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {expense.description}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${catMeta?.color || '#71717a'}18`,
                              color: catMeta?.color || '#71717a',
                            }}
                          >
                            {catMeta?.label || 'Khác'}
                          </span>

                          {expense.time && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="h-3 w-3" />
                              {expense.time}
                            </span>
                          )}

                          {pmLabel && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <CreditCard className="h-3 w-3" />
                              {pmLabel}
                            </span>
                          )}

                          {expense.notes && (
                            <span className="hidden md:inline text-[11px] text-muted-foreground/80 italic truncate max-w-xs">
                              • {expense.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400">
                          -{formatVND(expense.amount)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditExpense(expense)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xoá khoản chi "${expense.description}"?`)) {
                              onDeleteExpense(expense.id);
                            }
                          }}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
