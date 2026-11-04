// features/travel/budget/BudgetFeature.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Trash2,
  Edit3,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useTravelStore } from '../stores/useTravelStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { ExpenseFormModal, CATEGORY_CONFIG } from './components/ExpenseFormModal';
import { BillSplitterModal } from './components/BillSplitterModal';
import { TravelExpense, ExpenseCategory } from '../types';

interface BudgetFeatureProps {
  onNavigateTab?: (tab: any) => void;
}

export const BudgetFeature: React.FC<BudgetFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { trips, fetchTrips } = useTravelStore();
  const {
    expenses,
    isLoading,
    selectedTripId,
    categoryFilter,
    searchQuery,
    setSelectedTripId,
    setCategoryFilter,
    setSearchQuery,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useBudgetStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSplitterOpen, setIsSplitterOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchTrips(user.uid);
      fetchExpenses(user.uid);
    }
  }, [user?.uid, fetchTrips, fetchExpenses]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchesTrip = selectedTripId === 'all' || item.tripId === selectedTripId;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.paidBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTrip && matchesCategory && matchesSearch;
    });
  }, [expenses, selectedTripId, categoryFilter, searchQuery]);

  // Calculations for KPI
  const targetTrips = selectedTripId === 'all'
    ? trips
    : trips.filter((t) => t.id === selectedTripId);

  const totalBudget = targetTrips.reduce((acc, t) => acc + (t.budget || 0), 0);
  const totalSpent = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Breakdown by category
  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      transport: 0,
      hotel: 0,
      food: 0,
      sightseeing: 0,
      shopping: 0,
      other: 0,
    };
    filteredExpenses.forEach((e) => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.amount;
      } else {
        totals.other += e.amount;
      }
    });
    return totals;
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/15">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-amber-100 border border-white/20">
                <Wallet className="w-3.5 h-3.5 text-amber-200" />
                <span>Quản Lý Ngân Sách & Chi Tiêu</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 backdrop-blur-md text-[11px] font-medium text-amber-200 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Tự động chia tiền nhóm</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Sổ Quỹ & Tài Chính Chuyến Đi
            </h1>
            <p className="text-xs sm:text-sm text-amber-50/90 max-w-2xl leading-relaxed">
              Kiểm soát hạn mức dự toán, theo dõi hóa đơn thực tế theo thời gian thực và hạch toán
              công nợ nhóm bạn minh bạch, sòng phẳng.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsSplitterOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Chia Tiền Nhóm</span>
            </button>

            <button
              onClick={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
              className="bg-white text-amber-900 hover:bg-amber-50 shadow-lg font-bold text-xs sm:text-sm h-11 px-5 rounded-2xl shrink-0 cursor-pointer active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-900" />
              <span>Ghi Nhận Khoản Chi</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Hạn mức dự kiến</span>
          <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {totalBudget > 0 ? `${totalBudget.toLocaleString('vi-VN')} ₫` : 'Chưa đặt'}
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">Theo các chuyến đi đã tạo</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Thực tế đã chi</span>
          <h4 className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {totalSpent.toLocaleString('vi-VN')} ₫
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">{filteredExpenses.length} khoản chi</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
            {remaining >= 0 ? 'Còn lại trong quỹ' : 'Vượt ngân sách'}
          </span>
          <h4
            className={`text-lg sm:text-xl font-black mt-1 ${
              remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {Math.abs(remaining).toLocaleString('vi-VN')} ₫
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {remaining >= 0 ? 'Ngân sách an toàn' : 'Cần cắt giảm chi phí'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tiến độ chi</span>
            <span className="text-xs font-black text-amber-600">{spentPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercent > 90 ? 'bg-rose-500' : spentPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            {totalBudget > 0 ? `Đã dùng ${spentPercent}% ngân sách` : 'Chưa có ngân sách trần'}
          </span>
        </div>
      </div>

      {/* Category Breakdown Progress Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <PieChart className="w-4 h-4 text-amber-500" />
          <span>Phân bổ chi tiêu theo danh mục</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const catAmount = categoryTotals[key as ExpenseCategory] || 0;
            const catPercent = totalSpent > 0 ? Math.round((catAmount / totalSpent) * 100) : 0;

            return (
              <div
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : (key as ExpenseCategory))}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer ${
                  categoryFilter === key
                    ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">{catPercent}%</span>
                </div>
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{cfg.label}</h5>
                <p className="text-xs font-black text-slate-900 dark:text-white mt-1">
                  {catAmount.toLocaleString('vi-VN')} ₫
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên món ăn, tiền phòng, người chi..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Trip Filter */}
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tất cả chuyến đi</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
            className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(CATEGORY_CONFIG).map(([k, cfg]) => (
              <option key={k} value={k}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-white">
            {searchQuery || selectedTripId !== 'all' || categoryFilter !== 'all'
              ? 'Không tìm thấy khoản chi phù hợp'
              : 'Chưa có khoản chi tiêu nào được ghi nhận'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Bấm nút &quot;Ghi Nhận Khoản Chi&quot; để lưu lại các hóa đơn ăn uống, khách sạn, vé máy bay của chuyến đi.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition cursor-pointer shadow-md shadow-amber-500/20"
          >
            + Ghi nhận khoản chi đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExpenses.map((expense) => {
            const cat = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
            const CatIcon = cat.icon;

            return (
              <div
                key={expense.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 transition shadow-sm gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shrink-0`}>
                    <CatIcon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {expense.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      {expense.tripTitle && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {expense.tripTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                      <span>Người chi: <strong className="text-slate-700 dark:text-slate-300">{expense.paidBy}</strong></span>
                      <span>•</span>
                      <span>Ngày: {expense.date}</span>
                      {expense.splitWith && expense.splitWith.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Users className="w-3 h-3" />
                            <span>Chia {expense.splitWith.length} người ({expense.splitWith.join(', ')})</span>
                          </span>
                        </>
                      )}
                    </div>

                    {expense.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        💡 {expense.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                      {expense.amount.toLocaleString('vi-VN')} ₫
                    </span>
                    {expense.splitWith && expense.splitWith.length > 1 && (
                      <span className="block text-[10px] text-slate-400">
                        (~{Math.round(expense.amount / expense.splitWith.length).toLocaleString('vi-VN')} ₫ / người)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpense(expense);
                        setIsAddModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Sửa khoản chi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa khoản chi "${expense.title}"?`)) {
                          deleteExpense(expense.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Xóa khoản chi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expense Modal (Add / Edit) */}
      <ExpenseFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
        onSubmit={async (data) => {
          if (editingExpense) {
            await updateExpense(editingExpense.id, data);
          } else {
            await addExpense(data, user?.uid);
          }
        }}
      />

      {/* Bill Splitter Modal */}
      <BillSplitterModal
        isOpen={isSplitterOpen}
        onClose={() => setIsSplitterOpen(false)}
      />
    </div>
  );
};
