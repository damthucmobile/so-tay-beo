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
  openCreateModal: () => void;
  openEditModal: (expense: ExpenseItem) => void;
  closeModal: () => void;
  openBudgetModal: () => void;
  closeBudgetModal: () => void;
  openCategoryModal: () => void;
  closeCategoryModal: () => void;

  createExpense: (data: Omit<ExpenseItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  updateExpense: (id: string, data: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  saveBudget: (amount: number) => Promise<void>;

  addCustomCategory: (data: { label: string; iconName?: string; color?: string; description?: string }) => Promise<string>;
  removeCustomCategory: (id: string) => Promise<void>;

  getAllCategories: () => CategoryMeta[];
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
  isLoading: false,
  isSaving: false,
  isModalOpen: false,
  editingExpense: null,
  isBudgetModalOpen: false,
  isCategoryModalOpen: false,
  userId: null,

  getAllCategories: () => {
    return [...DEFAULT_EXPENSE_CATEGORIES, ...get().customCategories];
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

  openCreateModal: () => set({ isModalOpen: true, editingExpense: null }),
  openEditModal: (expense) => set({ isModalOpen: true, editingExpense: expense }),
  closeModal: () => set({ isModalOpen: false, editingExpense: null }),

  openBudgetModal: () => set({ isBudgetModalOpen: true }),
  closeBudgetModal: () => set({ isBudgetModalOpen: false }),

  openCategoryModal: () => set({ isCategoryModalOpen: true }),
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
    const { expenses, selectedMonth, selectedCategory, searchQuery, getAllCategories } = get();
    const allCategories = getAllCategories();

    return expenses.filter((e) => {
      // 1. Lọc theo tháng ('YYYY-MM')
      if (selectedMonth && !e.date.startsWith(selectedMonth)) return false;

      // 2. Lọc theo danh mục
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;

      // 3. Lọc theo từ khóa tìm kiếm
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
    const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
    const allCategories = getAllCategories();

    const totalSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const budget = monthlyBudget?.totalBudget || 0;
    const remainingBudget = budget > 0 ? budget - totalSpent : 0;
    const percentUsed = budget > 0 ? Math.min(Math.round((totalSpent / budget) * 100), 999) : 0;

    // Tính trung bình mỗi ngày
    const now = new Date();
    const currentMonthStr = format(now, 'yyyy-MM');
    let daysPassed = 30;
    if (selectedMonth === currentMonthStr) {
      daysPassed = Math.max(now.getDate(), 1);
    }
    const dailyAverage = Math.round(totalSpent / daysPassed);

    // Phân bổ theo danh mục (tính động dựa trên allCategories)
    const catMap: Record<string, number> = {};
    allCategories.forEach((c) => {
      catMap[c.id] = 0;
    });

    monthExpenses.forEach((e) => {
      const cat = e.category || 'other';
      catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
    });

    const categoryBreakdown = allCategories
      .map((c) => {
        const amount = catMap[c.id] || 0;
        const percent = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
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

    return {
      totalSpent,
      monthlyBudget: budget,
      remainingBudget,
      percentUsed,
      dailyAverage,
      topCategory,
      categoryBreakdown,
    };
  },
}));

/**
 * Hook memoized giúp React Component render ổn định danh sách tất cả category
 * mà không bị lặp vô hạn hay trigger re-render do tham chiếu mảng mới.
 */
export const useAllExpenseCategories = (): CategoryMeta[] => {
  const customCategories = useSpendingStore((s) => s.customCategories);
  return useMemo(
    () => [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories],
    [customCategories]
  );
};
