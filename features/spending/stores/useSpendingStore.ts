import { useMemo } from 'react';
import { create } from 'zustand';
import { format } from 'date-fns';
import {
  ExpenseItem,
  ExpenseCategory,
  MonthlyBudget,
  SpendingStats,
  CategoryMeta,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_FINANCE_CATEGORIES,
  TransactionType,
  FinanceViewMode,
} from '../types';
import {
  subscribeToExpenses,
  subscribeToMonthlyBudget,
  subscribeToCustomCategories,
  saveExpense,
  deleteExpense,
  saveMonthlyBudget,
  saveCustomCategory,
  deleteCustomCategory,
  getLocalCachedExpenses,
  getLocalCachedBudget,
  getLocalCachedCustomCategories,
} from '../services/spendingService';
import { auth } from '@/core/firebase';

const getEffectiveUid = (uid?: string | null) => {
  return uid || auth?.currentUser?.uid || 'anonymous';
};

interface SpendingState {
  expenses: ExpenseItem[];
  customCategories: CategoryMeta[];
  monthlyBudget: MonthlyBudget | null;
  selectedMonth: string; // 'YYYY-MM'
  selectedCategory: ExpenseCategory | 'all';
  searchQuery: string;
  viewMode: FinanceViewMode; // 'all' | 'expense' | 'income'
  transactionModalType: TransactionType; // 'expense' | 'income'
  categoryModalType: TransactionType; // 'expense' | 'income'
  isLoading: boolean;
  isSaving: boolean;
  isModalOpen: boolean;
  editingExpense: ExpenseItem | null;
  isBudgetModalOpen: boolean;
  isCategoryModalOpen: boolean;
  userId: string | null;

  // Actions
  initStore: (userId?: string | null) => () => void;
  setSelectedMonth: (month: string) => void;
  setSelectedCategory: (cat: ExpenseCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: FinanceViewMode) => void;
  openCreateModal: (type?: TransactionType) => void;
  openEditModal: (expense: ExpenseItem) => void;
  closeModal: () => void;
  openBudgetModal: () => void;
  closeBudgetModal: () => void;
  openCategoryModal: (type?: TransactionType) => void;
  closeCategoryModal: () => void;

  createExpense: (data: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  updateExpense: (id: string, data: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  saveBudget: (amount: number) => Promise<void>;

  addCustomCategory: (data: {
    label: string;
    iconName?: string;
    color?: string;
    description?: string;
    type?: TransactionType;
  }) => Promise<string>;
  removeCustomCategory: (id: string) => Promise<void>;

  getAllCategories: (filterType?: TransactionType | 'all') => CategoryMeta[];
  getFilteredExpenses: () => ExpenseItem[];
  getComputedStats: () => SpendingStats;
}

export const useSpendingStore = create<SpendingState>((set, get) => ({
  expenses: [],
  customCategories: [],
  monthlyBudget: null,
  selectedMonth: format(new Date(), 'yyyy-MM'),
  selectedCategory: 'all',
  searchQuery: '',
  viewMode: 'all',
  transactionModalType: 'expense',
  categoryModalType: 'expense',
  isLoading: false,
  isSaving: false,
  isModalOpen: false,
  editingExpense: null,
  isBudgetModalOpen: false,
  isCategoryModalOpen: false,
  userId: null,

  getAllCategories: (filterType?: TransactionType | 'all') => {
    const all = [...DEFAULT_FINANCE_CATEGORIES, ...get().customCategories];
    if (filterType && filterType !== 'all') {
      return all.filter((c) => (c.type || 'expense') === filterType);
    }
    return all;
  },

  initStore: (userId?: string | null) => {
    const effectiveUid = userId || auth?.currentUser?.uid || null;
    const currentMonth = get().selectedMonth;
    // Khởi tạo tức thì từ local cache
    const cachedExpenses = getLocalCachedExpenses();
    const cachedBudget = getLocalCachedBudget(currentMonth);
    const cachedCategories = getLocalCachedCustomCategories();

    set({
      expenses: cachedExpenses,
      monthlyBudget: cachedBudget,
      customCategories: cachedCategories,
      userId: effectiveUid,
    });

    if (!effectiveUid || effectiveUid === 'anonymous') return () => {};

    set({ isLoading: cachedExpenses.length === 0 });

    // 1. Subscribe to Expenses
    const unsubExpenses = subscribeToExpenses(
      effectiveUid,
      (list) => {
        set({ expenses: list, isLoading: false });
      },
      () => set({ isLoading: false })
    );

    // 2. Subscribe to Budget for current month
    const unsubBudget = subscribeToMonthlyBudget(
      effectiveUid,
      currentMonth,
      (budget) => {
        set({ monthlyBudget: budget });
      }
    );

    // 3. Subscribe to Custom Categories
    const unsubCategories = subscribeToCustomCategories(
      effectiveUid,
      (cats) => {
        set({ customCategories: cats });
      }
    );

    return () => {
      unsubExpenses();
      unsubBudget();
      unsubCategories();
    };
  },

  setSelectedMonth: (month: string) => {
    set({ selectedMonth: month });
    const uid = get().userId;
    if (uid && uid !== 'anonymous') {
      subscribeToMonthlyBudget(uid, month, (budget) => {
        set({ monthlyBudget: budget });
      });
    }
  },

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode, selectedCategory: 'all' }),

  openCreateModal: (type: TransactionType = 'expense') =>
    set({
      isModalOpen: true,
      editingExpense: null,
      transactionModalType: type,
    }),
  openEditModal: (expense) =>
    set({
      isModalOpen: true,
      editingExpense: expense,
      transactionModalType: expense.type || 'expense',
    }),
  closeModal: () => set({ isModalOpen: false, editingExpense: null }),

  openBudgetModal: () => set({ isBudgetModalOpen: true }),
  closeBudgetModal: () => set({ isBudgetModalOpen: false }),

  openCategoryModal: (type: TransactionType = 'expense') =>
    set({ isCategoryModalOpen: true, categoryModalType: type }),
  closeCategoryModal: () => set({ isCategoryModalOpen: false }),

  createExpense: async (data) => {
    const uid = getEffectiveUid(get().userId);
    set({ isSaving: true });
    try {
      const id = await saveExpense(data, uid);
      // Optimistic update
      const now = new Date().toISOString();
      const newEntity: ExpenseItem = {
        ...data,
        id,
        userId: uid,
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        expenses: [newEntity, ...state.expenses.filter((e) => e.id !== id)],
        isSaving: false,
        isModalOpen: false,
      }));
      return id;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  updateExpense: async (id, updateData) => {
    const uid = getEffectiveUid(get().userId);
    set({ isSaving: true });
    try {
      await saveExpense({ ...updateData, id }, uid);
      set((state) => ({
        expenses: state.expenses.map((e) =>
          e.id === id ? { ...e, ...updateData, updatedAt: new Date().toISOString() } : e
        ),
        isSaving: false,
        isModalOpen: false,
        editingExpense: null,
      }));
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  deleteExpense: async (id) => {
    try {
      await deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (err) {
      console.error('Error deleting expense:', err);
      throw err;
    }
  },

  saveBudget: async (amount: number) => {
    const uid = getEffectiveUid(get().userId);
    const month = get().selectedMonth;
    try {
      await saveMonthlyBudget(uid, month, amount);
      set({
        monthlyBudget: {
          userId: uid,
          month,
          totalBudget: amount,
          updatedAt: new Date().toISOString(),
        },
        isBudgetModalOpen: false,
      });
    } catch (err) {
      console.error('Error saving budget:', err);
      throw err;
    }
  },

  addCustomCategory: async (data) => {
    const uid = getEffectiveUid(get().userId);
    try {
      const newCat = await saveCustomCategory(data, uid);
      set((state) => ({
        customCategories: [...state.customCategories.filter((c) => c.id !== newCat.id), newCat],
        isCategoryModalOpen: false,
      }));
      return newCat.id;
    } catch (err) {
      console.error('Error creating custom category:', err);
      throw err;
    }
  },

  removeCustomCategory: async (id: string) => {
    const uid = getEffectiveUid(get().userId);
    try {
      await deleteCustomCategory(id, uid);
      set((state) => ({
        customCategories: state.customCategories.filter((c) => c.id !== id),
        selectedCategory: state.selectedCategory === id ? 'all' : state.selectedCategory,
      }));
    } catch (err) {
      console.error('Error deleting custom category:', err);
      throw err;
    }
  },

  getFilteredExpenses: () => {
    const { expenses, selectedMonth, selectedCategory, searchQuery, viewMode, getAllCategories } = get();
    const allCategories = getAllCategories();

    return expenses.filter((e) => {
      // 1. Lọc theo tháng ('YYYY-MM')
      if (selectedMonth && !e.date.startsWith(selectedMonth)) return false;

      // 2. Lọc theo viewMode ('all' | 'expense' | 'income')
      const itemType = e.type || 'expense';
      if (viewMode !== 'all' && itemType !== viewMode) return false;

      // 3. Lọc theo danh mục
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchNotes = (e.notes || '').toLowerCase().includes(q);
        const catLabel = allCategories.find((c) => c.id === e.category)?.label.toLowerCase() || '';
        const matchCat = catLabel.includes(q);
        return matchDesc || matchNotes || matchCat;
      }

      return true;
    });
  },

  getComputedStats: (): SpendingStats => {
    const { expenses, selectedMonth, monthlyBudget, getAllCategories } = get();
    const monthItems = expenses.filter((e) => e.date.startsWith(selectedMonth));
    const allCategories = getAllCategories();

    let totalExpense = 0;
    let totalIncome = 0;

    const expenseMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};

    monthItems.forEach((item) => {
      const amt = Number(item.amount) || 0;
      const isInc = item.type === 'income';
      if (isInc) {
        totalIncome += amt;
        const cat = item.category || 'other_income';
        incomeMap[cat] = (incomeMap[cat] || 0) + amt;
      } else {
        totalExpense += amt;
        const cat = item.category || 'other';
        expenseMap[cat] = (expenseMap[cat] || 0) + amt;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.max(0, Math.round((netBalance / totalIncome) * 100)) : 0;

    const budget = monthlyBudget?.totalBudget || 0;
    const remainingBudget = budget > 0 ? budget - totalExpense : 0;
    const percentUsed = budget > 0 ? Math.min(Math.round((totalExpense / budget) * 100), 999) : 0;

    // Tính trung bình chi tiêu mỗi ngày
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    let daysPassed = 30;
    if (selectedMonth === currentMonthStr) {
      daysPassed = Math.max(now.getDate(), 1);
    }
    const dailyAverage = Math.round(totalExpense / daysPassed);

    // Phân bổ chi tiêu
    const expenseCategories = allCategories.filter((c) => (c.type || 'expense') === 'expense');
    const categoryBreakdown = expenseCategories
      .map((c) => {
        const amount = expenseMap[c.id] || 0;
        const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
        return {
          category: c.id,
          label: c.label,
          amount,
          percent,
          color: c.color,
          iconName: c.iconName,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    // Phân bổ thu nhập
    const incomeCategories = allCategories.filter((c) => c.type === 'income');
    const incomeBreakdown = incomeCategories
      .map((c) => {
        const amount = incomeMap[c.id] || 0;
        const percent = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0;
        return {
          category: c.id,
          label: c.label,
          amount,
          percent,
          color: c.color,
          iconName: c.iconName,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const topIncomeCategory = incomeBreakdown.length > 0 ? incomeBreakdown[0] : null;

    return {
      totalSpent: totalExpense,
      totalExpense,
      totalIncome,
      netBalance,
      savingsRate,
      monthlyBudget: budget,
      remainingBudget,
      percentUsed,
      dailyAverage,
      topCategory,
      topIncomeCategory,
      categoryBreakdown,
      incomeBreakdown,
    };
  },
}));

/**
 * Hook memoized giúp React Component render ổn định danh sách category
 * có thể lọc theo loại: 'all', 'expense', hoặc 'income'.
 */
export const useAllExpenseCategories = (filterType?: TransactionType | 'all'): CategoryMeta[] => {
  const customCategories = useSpendingStore((s) => s.customCategories);
  return useMemo(() => {
    const all = [...DEFAULT_FINANCE_CATEGORIES, ...customCategories];
    if (filterType && filterType !== 'all') {
      return all.filter((c) => (c.type || 'expense') === filterType);
    }
    return all;
  }, [customCategories, filterType]);
};
