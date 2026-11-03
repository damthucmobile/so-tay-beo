// features/travel/stores/useBudgetStore.ts
'use client';

import { create } from 'zustand';
import { TravelExpense, ExpenseCategory, SplitSettlement } from '../types';
import {
  setDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
} from '@/core/firebase/db/firestoreService';
import { COLLECTIONS } from '@/core/firebase/db/constants';
import { auth } from '@/core/firebase/auth/config';

interface BudgetStore {
  expenses: TravelExpense[];
  isLoading: boolean;
  selectedTripId: string; // 'all' or tripId
  categoryFilter: ExpenseCategory | 'all';
  searchQuery: string;

  setSelectedTripId: (tripId: string) => void;
  setCategoryFilter: (category: ExpenseCategory | 'all') => void;
  setSearchQuery: (query: string) => void;

  fetchExpenses: (userId?: string) => Promise<void>;
  addExpense: (
    data: Omit<TravelExpense, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ) => Promise<TravelExpense>;
  updateExpense: (id: string, data: Partial<TravelExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  calculateSettlements: (tripId?: string) => SplitSettlement[];
}

const LOCAL_STORAGE_KEY = 'app_cached_travel_expenses';

const INITIAL_DEMO_EXPENSES: TravelExpense[] = [
  {
    id: 'exp-1',
    tripId: 'demo-sapa',
    tripTitle: 'Khám Phá Sapa 3N2Đ',
    title: 'Vé cáp treo Fansipan Sun World khứ hồi',
    amount: 1700000,
    category: 'sightseeing',
    paidBy: 'Tôi',
    date: '2026-11-01',
    notes: '2 vé cáp treo + tàu hỏa leo núi Mường Hoa',
    splitWith: ['Tôi', 'Bạn đồng hành'],
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'exp-2',
    tripId: 'demo-sapa',
    tripTitle: 'Khám Phá Sapa 3N2Đ',
    title: 'Khách sạn Silk Path Grand Sapa Resort (2 đêm)',
    amount: 3200000,
    category: 'hotel',
    paidBy: 'Tôi',
    date: '2026-10-31',
    notes: 'Phòng Classic view thung lũng kèm buffet sáng',
    splitWith: ['Tôi', 'Bạn đồng hành'],
    createdAt: '2026-10-31T14:00:00Z',
    updatedAt: '2026-10-31T14:00:00Z',
  },
  {
    id: 'exp-3',
    tripId: 'demo-sapa',
    tripTitle: 'Khám Phá Sapa 3N2Đ',
    title: 'Ăn tối lẩu cá hồi & cá tầm Sapa',
    amount: 780000,
    category: 'food',
    paidBy: 'Bạn đồng hành',
    date: '2026-11-01',
    notes: 'Nhà hàng Ô Quý Hồ',
    splitWith: ['Tôi', 'Bạn đồng hành'],
    createdAt: '2026-11-01T20:00:00Z',
    updatedAt: '2026-11-01T20:00:00Z',
  },
  {
    id: 'exp-4',
    tripId: 'demo-danang',
    tripTitle: 'Hè Rực Rỡ Đà Nẵng - Hội An',
    title: 'Vé máy bay khứ hồi Hà Nội - Đà Nẵng',
    amount: 4500000,
    category: 'transport',
    paidBy: 'Tôi',
    date: '2026-11-02',
    notes: 'Vietnam Airlines đã gồm 23kg hành lý ký gửi',
    splitWith: ['Tôi', 'Gia đình'],
    createdAt: '2026-11-02T08:00:00Z',
    updatedAt: '2026-11-02T08:00:00Z',
  },
  {
    id: 'exp-5',
    tripId: 'demo-danang',
    tripTitle: 'Hè Rực Rỡ Đà Nẵng - Hội An',
    title: 'Hải sản tươi sống Bé Mặn Mỹ Khê',
    amount: 1450000,
    category: 'food',
    paidBy: 'Tôi',
    date: '2026-11-02',
    notes: 'Tôm hùm baby, cua gạch hấp, sò điệp nướng mỡ hành',
    splitWith: ['Tôi', 'Gia đình'],
    createdAt: '2026-11-02T19:30:00Z',
    updatedAt: '2026-11-02T19:30:00Z',
  },
];

function getEffectiveUserId(explicitUserId?: string): string | null {
  if (explicitUserId) return explicitUserId;
  if (auth?.currentUser?.uid) return auth.currentUser.uid;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('app_auth_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.uid) return parsed.uid;
      }
    } catch {}
  }
  return null;
}

function getInitialExpenses(): TravelExpense[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return INITIAL_DEMO_EXPENSES;
}

function persistToLocalStorage(expenses: TravelExpense[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    } catch {}
  }
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  expenses: getInitialExpenses(),
  isLoading: false,
  selectedTripId: 'all',
  categoryFilter: 'all',
  searchQuery: '',

  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchExpenses: async (userId?: string) => {
    const effectiveUid = getEffectiveUserId(userId);
    if (!effectiveUid) return;

    set({ isLoading: true });
    try {
      const data = await getDocuments<TravelExpense & { userId?: string }>(
        COLLECTIONS.TRAVEL_EXPENSES,
        {
          filters: [{ field: 'userId', operator: '==', value: effectiveUid }],
        }
      );

      if (data && data.length > 0) {
        set({ expenses: data, isLoading: false });
        persistToLocalStorage(data);
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.info(
        'Sử dụng dữ liệu chi tiêu từ bộ nhớ thiết bị:',
        err?.message || err
      );
      set({ isLoading: false });
    }
  },

  addExpense: async (data, userId) => {
    const effectiveUid = getEffectiveUserId(userId);
    const newId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newExpense: TravelExpense = {
      ...data,
      id: newId,
      userId: effectiveUid || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newExpense, ...get().expenses];
    set({ expenses: updated });
    persistToLocalStorage(updated);

    if (effectiveUid) {
      try {
        await setDocument(COLLECTIONS.TRAVEL_EXPENSES, newId, newExpense);
      } catch (err) {
        console.info('Chi tiêu đã được lưu cục bộ trên máy:', err);
      }
    }

    return newExpense;
  },

  updateExpense: async (id, data) => {
    const now = new Date().toISOString();
    const updated = get().expenses.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: now } : e
    );

    set({ expenses: updated });
    persistToLocalStorage(updated);

    try {
      await updateDocument(COLLECTIONS.TRAVEL_EXPENSES, id, { ...data, updatedAt: now });
    } catch (err) {
      console.info('Đã cập nhật chi tiêu cục bộ:', err);
    }
  },

  deleteExpense: async (id) => {
    const updated = get().expenses.filter((e) => e.id !== id);
    set({ expenses: updated });
    persistToLocalStorage(updated);

    try {
      await deleteDocument(COLLECTIONS.TRAVEL_EXPENSES, id);
    } catch (err) {
      console.info('Đã xóa chi tiêu cục bộ:', err);
    }
  },

  // Thuật toán chia tiền nhóm bạn (Bill Splitter)
  calculateSettlements: (tripId?: string) => {
    const allExpenses = get().expenses;
    const targetExpenses = tripId && tripId !== 'all'
      ? allExpenses.filter((e) => e.tripId === tripId)
      : allExpenses;

    // 1. Tính toán số tiền mỗi người đã trả và số tiền mỗi người phải chịu
    const netBalance: Record<string, number> = {};

    targetExpenses.forEach((exp) => {
      const payer = exp.paidBy.trim() || 'Tôi';
      const participants =
        exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : [payer];
      const share = exp.amount / participants.length;

      // Payer được cộng toàn bộ số tiền đã chi
      netBalance[payer] = (netBalance[payer] || 0) + exp.amount;

      // Mỗi người tham gia bị trừ phần của mình
      participants.forEach((p) => {
        netBalance[p] = (netBalance[p] || 0) - share;
      });
    });

    // 2. Tách thành danh sách chủ nợ (creditors) và con nợ (debtors)
    const debtors: { person: string; amount: number }[] = [];
    const creditors: { person: string; amount: number }[] = [];

    Object.entries(netBalance).forEach(([person, balance]) => {
      const rounded = Math.round(balance);
      if (rounded < -100) {
        debtors.push({ person, amount: -rounded });
      } else if (rounded > 100) {
        creditors.push({ person, amount: rounded });
      }
    });

    // 3. Khớp chuyển tiền tối ưu (Greedy settle)
    const settlements: SplitSettlement[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settledAmount = Math.min(debtor.amount, creditor.amount);

      if (settledAmount > 0) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: settledAmount,
        });
      }

      debtor.amount -= settledAmount;
      creditor.amount -= settledAmount;

      if (debtor.amount <= 100) i++;
      if (creditor.amount <= 100) j++;
    }

    return settlements;
  },
}));
