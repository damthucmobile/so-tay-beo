/**
 * Service lưu trữ & đồng bộ dữ liệu Chi tiêu đời sống với Cloud Firestore & LocalStorage
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '@/core/firebase';
import { ExpenseItem, MonthlyBudget, CategoryMeta } from '../types';

const LOCAL_STORAGE_EXPENSES_KEY = 'so_tay_beo_expenses_cache_v1';
const LOCAL_STORAGE_BUDGET_KEY = 'so_tay_beo_budget_cache_v1';
const LOCAL_STORAGE_CUSTOM_CATEGORIES_KEY = 'so_tay_beo_custom_categories_cache_v1';

/**
 * Lấy cache khoản chi từ LocalStorage (giúp render siêu tốc tức thì)
 */
export function getLocalCachedExpenses(): ExpenseItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Lấy cache ngân sách tháng từ LocalStorage
 */
export function getLocalCachedBudget(month: string): MonthlyBudget | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_BUDGET_KEY}_${month}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Lấy cache danh mục tùy chỉnh từ LocalStorage
 */
export function getLocalCachedCustomCategories(): CategoryMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Lắng nghe Realtime danh sách khoản chi của người dùng từ Firestore
 */
export function subscribeToExpenses(
  userId: string,
  onUpdate: (expenses: ExpenseItem[]) => void,
  onError?: (error: any) => void
) {
  // Nếu chưa đăng nhập hoặc ID anonymous, dùng cache local
  if (!userId || userId === 'anonymous') {
    onUpdate(getLocalCachedExpenses());
    return () => {};
  }

  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.EXPENSES),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ExpenseItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sắp xếp ngày giảm dần (mới nhất lên đầu)
      list.sort((a, b) => b.date.localeCompare(a.date));

      // Cập nhật local cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(list));
        } catch {}
      }

      onUpdate(list);
    },
    (err) => {
      console.warn('[SpendingService] Lắng nghe realtime expenses:', err?.message || err);
      // Fallback hiển thị cache local nếu có lỗi mạng hoặc phân quyền
      onUpdate(getLocalCachedExpenses());
      if (onError) onError(err);
    }
  );
}

/**
 * Thêm hoặc Cập nhật một khoản chi tiêu
 */
export async function saveExpense(
  data: Partial<ExpenseItem>,
  userId: string
): Promise<string> {
  const db = getDb();
  const expRef = collection(db, COLLECTIONS.EXPENSES);
  const expId = data.id || doc(expRef).id;
  const now = new Date().toISOString();

  const entity: ExpenseItem = {
    id: expId,
    userId: userId || 'anonymous',
    amount: Number(data.amount) || 0,
    category: data.category || 'other',
    date: data.date || now.slice(0, 10),
    time: data.time || now.slice(11, 16),
    description: data.description?.trim() || 'Chi tiêu sinh hoạt',
    paymentMethod: data.paymentMethod || 'transfer',
    notes: data.notes?.trim() || '',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  // 1. Luôn cập nhật local cache tức thì
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCachedExpenses().filter((e) => e.id !== expId);
      const updatedList = [entity, ...existing].sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updatedList));
    } catch {}
  }

  // 2. Lưu lên Cloud Firestore nếu người dùng đã đăng nhập hợp lệ
  if (userId && userId !== 'anonymous') {
    // Làm sạch dữ liệu để tránh undefined trong Firestore
    const cleanEntity: Record<string, any> = {};
    for (const [key, value] of Object.entries(entity)) {
      if (value !== undefined) {
        cleanEntity[key] = value;
      }
    }

    try {
      await setDoc(doc(db, COLLECTIONS.EXPENSES, expId), cleanEntity, { merge: true });
    } catch (err: any) {
      console.warn('[SpendingService] Lỗi ghi Firestore, đã lưu cache local:', err?.message);
    }
  }

  return expId;
}

/**
 * Xóa một khoản chi tiêu
 */
export async function deleteExpense(id: string): Promise<void> {
  // 1. Cập nhật local cache
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCachedExpenses().filter((e) => e.id !== id);
      localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(existing));
    } catch {}
  }

  // 2. Xóa khỏi Firestore
  try {
    const db = getDb();
    await deleteDoc(doc(db, COLLECTIONS.EXPENSES, id));
  } catch (err: any) {
    console.warn('[SpendingService] Lỗi xóa trên Firestore:', err?.message);
  }
}

/**
 * Lắng nghe Realtime Ngân sách tháng của người dùng
 */
export function subscribeToMonthlyBudget(
  userId: string,
  month: string, // 'YYYY-MM'
  onUpdate: (budget: MonthlyBudget | null) => void
) {
  // Nếu chưa đăng nhập hoặc ID anonymous, dùng cache local
  if (!userId || userId === 'anonymous') {
    onUpdate(getLocalCachedBudget(month));
    return () => {};
  }

  const db = getDb();
  const budgetDocId = `${userId}_${month}`;
  const budgetRef = doc(db, COLLECTIONS.EXPENSE_BUDGETS, budgetDocId);

  return onSnapshot(
    budgetRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as MonthlyBudget;
        onUpdate({ id: docSnap.id, ...data });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('[SpendingService] Lắng nghe realtime budget:', err?.message || err);
      onUpdate(getLocalCachedBudget(month));
    }
  );
}

/**
 * Lưu hoặc Cập nhật Ngân sách tháng
 */
export async function saveMonthlyBudget(
  userId: string,
  month: string,
  totalBudget: number
): Promise<void> {
  const budgetDocId = `${userId}_${month}`;

  const budgetData: MonthlyBudget = {
    userId: userId || 'anonymous',
    month,
    totalBudget: Number(totalBudget) || 0,
    updatedAt: new Date().toISOString(),
  };

  // 1. Lưu local cache tức thì
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_BUDGET_KEY}_${month}`, JSON.stringify(budgetData));
    } catch {}
  }

  // 2. Lưu lên Firestore nếu người dùng đã đăng nhập hợp lệ
  if (userId && userId !== 'anonymous') {
    try {
      const db = getDb();
      await setDoc(doc(db, COLLECTIONS.EXPENSE_BUDGETS, budgetDocId), budgetData, { merge: true });
    } catch (err: any) {
      console.warn('[SpendingService] Lỗi ghi ngân sách lên Firestore:', err?.message);
    }
  }
}

/**
 * Lắng nghe danh mục tùy chỉnh của người dùng từ Firestore
 */
export function subscribeToCustomCategories(
  userId: string,
  onUpdate: (categories: CategoryMeta[]) => void
) {
  if (!userId || userId === 'anonymous') {
    onUpdate(getLocalCachedCustomCategories());
    return () => {};
  }

  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.EXPENSE_CATEGORIES),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CategoryMeta[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify(list));
        } catch {}
      }

      onUpdate(list);
    },
    (err) => {
      console.warn('[SpendingService] Lắng nghe realtime custom categories:', err?.message || err);
      onUpdate(getLocalCachedCustomCategories());
    }
  );
}

/**
 * Thêm hoặc Cập nhật danh mục tùy chỉnh
 */
export async function saveCustomCategory(
  data: { label: string; iconName?: string; color?: string; description?: string },
  userId: string
): Promise<CategoryMeta> {
  const db = getDb();
  const catRef = collection(db, COLLECTIONS.EXPENSE_CATEGORIES);
  const catId = `cat_${Date.now()}`;
  const now = new Date().toISOString();

  const entity: CategoryMeta = {
    id: catId,
    label: data.label.trim(),
    iconName: data.iconName || 'Tag',
    color: data.color || '#3b82f6',
    bgColor: `${data.color || '#3b82f6'}15`,
    description: data.description?.trim() || '',
    isCustom: true,
    userId: userId || 'anonymous',
    createdAt: now,
  };

  // 1. Lưu local cache tức thì
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCachedCustomCategories().filter((c) => c.id !== catId);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify([...existing, entity]));
    } catch {}
  }

  // 2. Lưu lên Firestore nếu đã đăng nhập
  if (userId && userId !== 'anonymous') {
    try {
      await setDoc(doc(db, COLLECTIONS.EXPENSE_CATEGORIES, catId), entity, { merge: true });
    } catch (err: any) {
      console.warn('[SpendingService] Lỗi lưu custom category lên Firestore:', err?.message);
    }
  }

  return entity;
}

/**
 * Xóa danh mục tùy chỉnh
 */
export async function deleteCustomCategory(id: string, userId?: string): Promise<void> {
  // 1. Xóa khỏi local cache
  if (typeof window !== 'undefined') {
    try {
      const existing = getLocalCachedCustomCategories().filter((c) => c.id !== id);
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_CATEGORIES_KEY, JSON.stringify(existing));
    } catch {}
  }

  // 2. Xóa khỏi Firestore
  try {
    const db = getDb();
    await deleteDoc(doc(db, COLLECTIONS.EXPENSE_CATEGORIES, id));
  } catch (err: any) {
    console.warn('[SpendingService] Lỗi xóa custom category trên Firestore:', err?.message);
  }
}
