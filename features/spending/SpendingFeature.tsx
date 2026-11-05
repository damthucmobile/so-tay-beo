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
  ChevronDown,
  ChevronUp,
  BarChart3,
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

  const [isOverviewExpanded, setIsOverviewExpanded] = React.useState<boolean>(true);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<boolean>(false);
  const actionMenuRef = React.useRef<HTMLDivElement>(null);

  // Close action menu on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsActionMenuOpen(false);
    };

    if (isActionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActionMenuOpen]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  return (
    <div className="w-full space-y-3.5 sm:space-y-4 animate-fadeIn pb-10">
      {/* Top Toolbar: Month Picker & Action Controls (Popup Menu) */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Month Selector & Quick "Tháng này" */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/60 bg-card p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-foreground capitalize min-w-[110px] text-center">
              {formattedMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              onClick={handleCurrentMonth}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-border/70 hover:bg-muted text-foreground transition-all cursor-pointer shadow-2xs"
            >
              Tháng này
            </button>
          )}
        </div>

        {/* Right Controls: Action Popup Menu duy nhất */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Action Popup Menu Button */}
          <div className="relative" ref={actionMenuRef}>
            <button
              type="button"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer select-none active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Thao tác</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  isActionMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Popup Dropdown Menu - Cố định hiển thị NỔI TRÊN các view khác */}
            {isActionMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[80] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 mb-1">
                  Thao tác nhanh
                </div>

                {/* 1. Ghi chi tiêu */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    openCreateModal('expense');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer text-left group"
                >
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold leading-tight">+ Ghi chi tiêu</span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                      Mua sắm, sinh hoạt, hóa đơn...
                    </span>
                  </div>
                </button>

                {/* 2. Ghi thu nhập */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    openCreateModal('income');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer text-left group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold leading-tight">+ Ghi thu nhập</span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                      Lương, thù lao, thưởng...
                    </span>
                  </div>
                </button>

                <div className="h-px bg-border/40 my-1" />

                {/* 3. Cài đặt Hạn mức */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    openBudgetModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer text-left group"
                >
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold leading-tight">Cài đặt hạn mức</span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                      Định mức ngân sách chi tiêu tháng
                    </span>
                  </div>
                </button>

                <div className="h-px bg-border/40 my-1" />

                {/* 4. Thu hẹp / Mở rộng Thống kê Tổng quan */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    setIsOverviewExpanded(!isOverviewExpanded);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer text-left group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold leading-tight">
                      {isOverviewExpanded ? 'Thu hẹp tổng quan' : 'Mở rộng tổng quan'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                      {isOverviewExpanded ? 'Ẩn 4 thẻ KPI & biểu đồ phân bổ' : 'Hiện 4 thẻ KPI & biểu đồ phân bổ'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Section: Có thể Thu hẹp hoặc Mở rộng */}
      {isOverviewExpanded ? (
        <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-200">
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
        </div>
      ) : (
        /* Thanh tóm tắt gọn gàng khi thu hẹp */
        <div
          onClick={() => setIsOverviewExpanded(true)}
          className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/40 transition-all cursor-pointer shadow-2xs group"
          title="Bấm để mở rộng chi tiết tổng quan và phân bổ"
        >
          {/* Vùng chỉ số */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">Thu:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                +{formatVND(stats.totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">Chi:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                -{formatVND(stats.totalExpense)}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-[11px] sm:text-xs text-muted-foreground">Số dư:</span>
              <span
                className={`font-bold text-xs sm:text-sm ${
                  stats.netBalance >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {stats.netBalance >= 0 ? '+' : ''}
                {formatVND(stats.netBalance)}
              </span>
            </div>
            {stats.monthlyBudget > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-muted-foreground shrink-0 text-xs">
                <Target className="w-3 h-3 text-primary shrink-0" />
                <span>Hạn mức:</span>
                <span className="font-medium text-foreground">
                  {formatVND(stats.monthlyBudget)} ({stats.percentUsed}%)
                </span>
              </div>
            )}
          </div>

          {/* Nút Mở rộng cố định bên phải */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline shrink-0 pl-2 border-l border-border/50">
            <span className="hidden sm:inline">Chi tiết</span>
            <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Filter and Search Bar: Gọn gàng, cân đối, hài hòa */}
      <div className="space-y-2">
        {/* Row 1: View Mode Tabs cân xứng full-width (3 cột đều nhau) */}
        <div className="grid grid-cols-3 p-1 bg-muted/50 dark:bg-slate-800/80 rounded-xl border border-border/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setViewMode('all');
              setSelectedCategory('all');
            }}
            className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
              viewMode === 'all'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Tất cả</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('expense');
              setSelectedCategory('all');
            }}
            className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
              viewMode === 'expense'
                ? 'bg-card text-rose-600 dark:text-rose-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span className="truncate">Khoản chi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('income');
              setSelectedCategory('all');
            }}
            className={`py-1.5 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
              viewMode === 'income'
                ? 'bg-card text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="truncate">Khoản thu</span>
          </button>
        </div>

        {/* Row 2: Search Input full-width tích hợp badge đếm số lượng */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Tìm kiếm nội dung, ghi chú giao dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 pr-24 h-9 text-xs rounded-xl bg-card border-border/70 focus-visible:ring-1"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md whitespace-nowrap select-none">
              {filteredExpenses.length} {viewMode === 'income' ? 'thu' : viewMode === 'expense' ? 'chi' : 'giao dịch'}
            </span>
          </div>
        </div>

        {/* Row 3: Category Pills cuộn ngang mượt mà */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5">
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
