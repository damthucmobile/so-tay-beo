'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  Filter,
  X,
  Tag,
} from 'lucide-react';
import { format, addMonths, subMonths, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSpendingStore, useAllExpenseCategories } from './stores/useSpendingStore';
import { SpendingOverviewCards } from './components/SpendingOverviewCards';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';
import { CreateCategoryModal } from './components/CreateCategoryModal';
import { useAuth } from '@/core/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SpendingFeatureProps {
  onNavigateTab?: (tab: any) => void;
}

export const SpendingFeature: React.FC<SpendingFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const allCategories = useAllExpenseCategories();

  const {
    initStore,
    selectedMonth,
    selectedCategory,
    searchQuery,
    isModalOpen,
    editingExpense,
    isBudgetModalOpen,
    isCategoryModalOpen,
    isSaving,
    setSelectedMonth,
    setSelectedCategory,
    setSearchQuery,
    openCreateModal,
    openEditModal,
    closeModal,
    openBudgetModal,
    closeBudgetModal,
    openCategoryModal,
    closeCategoryModal,
    addCustomCategory,
    removeCustomCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    saveBudget,
    getFilteredExpenses,
    getComputedStats,
    monthlyBudget,
    expenses,
    customCategories,
  } = useSpendingStore();

  useEffect(() => {
    const unsub = initStore(user?.uid);
    return () => {
      unsub();
    };
  }, [user?.uid, initStore]);

  const stats = useMemo(
    () => getComputedStats(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getComputedStats, expenses, monthlyBudget, selectedMonth, customCategories]
  );

  const filteredExpenses = useMemo(
    () => getFilteredExpenses(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFilteredExpenses, expenses, selectedMonth, selectedCategory, searchQuery, customCategories]
  );

  // Điều hướng tháng
  const handlePrevMonth = () => {
    const currDate = parse(selectedMonth, 'yyyy-MM', new Date());
    const prev = subMonths(currDate, 1);
    setSelectedMonth(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const currDate = parse(selectedMonth, 'yyyy-MM', new Date());
    const next = addMonths(currDate, 1);
    setSelectedMonth(format(next, 'yyyy-MM'));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  };

  const formattedMonthLabel = (() => {
    try {
      const d = parse(selectedMonth, 'yyyy-MM', new Date());
      return format(d, 'MMMM yyyy', { locale: vi });
    } catch {
      return selectedMonth;
    }
  })();

  const isCurrentMonth = selectedMonth === format(new Date(), 'yyyy-MM');

  return (
    <div className="min-h-screen bg-background/50 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Quản Lý Chi Tiêu
              </h1>
              <p className="text-xs text-muted-foreground">
                Kiểm soát ngân sách sinh hoạt, ăn uống và đời sống hàng ngày
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Month Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center rounded-xl border border-border/60 bg-card p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-foreground capitalize min-w-[110px] text-center">
              {formattedMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCurrentMonth}
              className="text-xs h-9"
            >
              Tháng này
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={openBudgetModal}
            className="text-xs h-9 gap-1.5"
          >
            <Target className="h-4 w-4 text-primary" />
            <span>Hạn mức</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm khoản chi</span>
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <SpendingOverviewCards
        stats={stats}
        onOpenBudgetModal={openBudgetModal}
        onOpenCreateExpense={openCreateModal}
      />

      {/* Category Breakdown Chart */}
      <CategoryBreakdown
        stats={stats}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm nội dung chi tiêu, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="text-xs text-muted-foreground font-medium self-center">
            Hiển thị <span className="font-bold text-foreground">{filteredExpenses.length}</span> khoản chi
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40'
            }`}
          >
            Tất cả
          </button>
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div key={cat.id} className="relative group shrink-0 flex items-center">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/40'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.label}</span>
                  {cat.isCustom && (
                    <span
                      role="button"
                      tabIndex={0}
                      title={`Xóa danh mục "${cat.label}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Bạn có chắc muốn xóa danh mục "${cat.label}" không?`)) {
                          removeCustomCategory(cat.id);
                          if (selectedCategory === cat.id) setSelectedCategory('all');
                        }
                      }}
                      className={`ml-0.5 p-0.5 rounded-full transition-colors ${
                        isSelected
                          ? 'hover:bg-primary-foreground/20 text-primary-foreground'
                          : 'hover:bg-destructive/20 text-muted-foreground hover:text-destructive'
                      }`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          {/* + Thêm danh mục pill */}
          <button
            onClick={openCategoryModal}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:border-primary flex items-center gap-1.5 shadow-xs shrink-0"
            title="Tự tạo danh mục chi tiêu mới"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </div>

      {/* Main Expense List */}
      <ExpenseList
        expenses={filteredExpenses}
        categories={allCategories}
        onEditExpense={openEditModal}
        onDeleteExpense={deleteExpense}
        onOpenCreate={openCreateModal}
      />

      {/* Modals */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={createExpense}
        onUpdate={updateExpense}
        editingExpense={editingExpense}
        isSaving={isSaving}
        categories={allCategories}
        onOpenCreateCategory={openCategoryModal}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={closeBudgetModal}
        currentBudget={monthlyBudget?.totalBudget || 0}
        month={selectedMonth}
        onSaveBudget={saveBudget}
      />

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        onSaveCategory={addCustomCategory}
      />
    </div>
  );
};
