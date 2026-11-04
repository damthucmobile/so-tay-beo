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
  ArrowDownRight,
  ArrowUpRight,
  Layers,
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
    viewMode,
    transactionModalType,
    categoryModalType,
    isModalOpen,
    editingExpense,
    isBudgetModalOpen,
    isCategoryModalOpen,
    isSaving,
    setSelectedMonth,
    setSelectedCategory,
    setSearchQuery,
    setViewMode,
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
    [getFilteredExpenses, expenses, selectedMonth, selectedCategory, searchQuery, viewMode, customCategories]
  );

  // Filter categories displayed in the pill bar according to active viewMode
  const displayedCategories = useMemo(() => {
    if (viewMode === 'all') return allCategories;
    return allCategories.filter((c) => (c.type || 'expense') === viewMode);
  }, [allCategories, viewMode]);

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
    <div className="w-full space-y-6 animate-fadeIn pb-10">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Quản Lý Thu - Chi
              </h1>
              <p className="text-xs text-muted-foreground">
                Kiểm soát ngân sách, theo dõi dòng tiền và tối ưu tích lũy tài chính
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

          {/* Nút Ghi Thu Nhập */}
          <Button
            size="sm"
            onClick={() => openCreateModal('income')}
            className="text-xs h-9 gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>+ Ghi thu</span>
          </Button>

          {/* Nút Ghi Chi Tiêu */}
          <Button
            size="sm"
            onClick={() => openCreateModal('expense')}
            className="text-xs h-9 gap-1.5 shadow-sm"
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>+ Ghi chi</span>
          </Button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <SpendingOverviewCards
        stats={stats}
        onOpenBudgetModal={openBudgetModal}
        onOpenCreateExpense={() => openCreateModal('expense')}
        onOpenCreateIncome={() => openCreateModal('income')}
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
          {/* View Mode Toggle: [Tất cả | Chi tiêu | Thu nhập] */}
          <div className="flex items-center p-1 bg-muted/40 rounded-xl border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => {
                setViewMode('all');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-card text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tất cả</span>
            </button>
            <button
              onClick={() => {
                setViewMode('expense');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'expense'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
              <span>Khoản chi</span>
            </button>
            <button
              onClick={() => {
                setViewMode('income');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'income'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span>Khoản thu</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm nội dung, ghi chú giao dịch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="text-xs text-muted-foreground font-medium self-center">
            Hiển thị <span className="font-bold text-foreground">{filteredExpenses.length}</span>{' '}
            {viewMode === 'income' ? 'khoản thu' : viewMode === 'expense' ? 'khoản chi' : 'giao dịch'}
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
            Tất cả danh mục
          </button>
          {displayedCategories.map((cat) => {
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
            onClick={() => openCategoryModal(viewMode === 'income' ? 'income' : 'expense')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border border-dashed border-primary/50 text-primary hover:bg-primary/10 hover:border-primary flex items-center gap-1.5 shadow-xs shrink-0"
            title="Tự tạo danh mục mới"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm danh mục {viewMode === 'income' ? 'thu' : 'chi'}</span>
          </button>
        </div>
      </div>

      {/* Main Expense / Income List */}
      <ExpenseList
        expenses={filteredExpenses}
        categories={allCategories}
        onEditExpense={openEditModal}
        onDeleteExpense={deleteExpense}
        onOpenCreate={() => openCreateModal(viewMode === 'income' ? 'income' : 'expense')}
        onOpenCreateIncome={() => openCreateModal('income')}
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
        initialType={transactionModalType}
        onOpenCreateCategory={(type) => openCategoryModal(type || transactionModalType)}
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
        initialType={categoryModalType}
        onSaveCategory={addCustomCategory}
      />
    </div>
  );
};
