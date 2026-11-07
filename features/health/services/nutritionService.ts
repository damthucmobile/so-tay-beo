// features/health/services/nutritionService.ts
'use client';

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb, COLLECTIONS, cleanUndefinedFields } from '@/core/firebase';
import {
  MealPlan,
  NutritionProfile,
  DailyWaterLog,
  NutritionGoal,
  DietaryPreference,
} from '../types';

const NUTRITION_PROFILE_CACHE_KEY = 'so_tay_beo_nutrition_profile_cache';
const MEAL_PLANS_CACHE_KEY = 'so_tay_beo_meal_plans_cache';
const WATER_LOGS_CACHE_KEY = 'so_tay_beo_water_logs_cache';

export const NutritionService = {
  // Lấy dữ liệu đệm từ LocalStorage
  getLocalCache(): {
    profile: NutritionProfile | null;
    mealPlans: MealPlan[];
    waterLogs: Record<string, DailyWaterLog>;
  } {
    if (typeof window === 'undefined') {
      return { profile: null, mealPlans: [], waterLogs: {} };
    }
    try {
      const p = localStorage.getItem(NUTRITION_PROFILE_CACHE_KEY);
      const m = localStorage.getItem(MEAL_PLANS_CACHE_KEY);
      const w = localStorage.getItem(WATER_LOGS_CACHE_KEY);
      return {
        profile: p ? JSON.parse(p) : null,
        mealPlans: m ? JSON.parse(m) : [],
        waterLogs: w ? JSON.parse(w) : {},
      };
    } catch {
      return { profile: null, mealPlans: [], waterLogs: {} };
    }
  },

  saveLocalProfile(profile: NutritionProfile | null) {
    if (typeof window === 'undefined') return;
    try {
      if (profile) {
        localStorage.setItem(NUTRITION_PROFILE_CACHE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(NUTRITION_PROFILE_CACHE_KEY);
      }
    } catch {}
  },

  saveLocalMealPlans(plans: MealPlan[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MEAL_PLANS_CACHE_KEY, JSON.stringify(plans));
    } catch {}
  },

  saveLocalWaterLogs(logs: Record<string, DailyWaterLog>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(WATER_LOGS_CACHE_KEY, JSON.stringify(logs));
    } catch {}
  },

  // 1. Hồ sơ Dinh Dưỡng Cá Nhân (Nutrition Profile)
  subscribeNutritionProfile(
    userId: string,
    onUpdate: (profile: NutritionProfile | null) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const profileRef = doc(db, COLLECTIONS.NUTRITION_PROFILES, userId);

    return onSnapshot(
      profileRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const profile = docSnap.data() as NutritionProfile;
          NutritionService.saveLocalProfile(profile);
          onUpdate(profile);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.error('[NutritionService] Lỗi lắng nghe profile:', err);
        onError?.(err);
      }
    );
  },

  async saveNutritionProfile(profile: NutritionProfile): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const payload = cleanUndefinedFields({
      ...profile,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(doc(db, COLLECTIONS.NUTRITION_PROFILES, profile.userId), payload);
    NutritionService.saveLocalProfile(profile);
  },

  // 2. Kế hoạch Thực đơn (Meal Plans)
  subscribeMealPlans(
    userId: string,
    onUpdate: (plans: MealPlan[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const q = query(
      collection(db, COLLECTIONS.MEAL_PLANS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const plans: MealPlan[] = [];
        snapshot.forEach((docSnap) => {
          plans.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort newest first
        plans.sort(
          (a, b) =>
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        NutritionService.saveLocalMealPlans(plans);
        onUpdate(plans);
      },
      (err) => {
        console.error('[NutritionService] Lỗi lắng nghe meal plans:', err);
        onError?.(err);
      }
    );
  },

  async saveMealPlan(
    userId: string,
    planData: Omit<MealPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    customId?: string
  ): Promise<string> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const planId = customId || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullPlan: MealPlan = {
      ...planData,
      id: planId,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(doc(db, COLLECTIONS.MEAL_PLANS, planId), cleanUndefinedFields(fullPlan));
    return planId;
  },

  async updateMealPlan(planId: string, updates: Partial<MealPlan>): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const payload = cleanUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await setDoc(doc(db, COLLECTIONS.MEAL_PLANS, planId), payload, { merge: true });

    // Update local cache
    const plans = NutritionService.getLocalCache().mealPlans;
    const idx = plans.findIndex((p) => p.id === planId);
    if (idx !== -1) {
      plans[idx] = { ...plans[idx], ...updates, updatedAt: new Date().toISOString() };
      NutritionService.saveLocalMealPlans(plans);
    }
  },

  async deleteMealPlan(planId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');
    await deleteDoc(doc(db, COLLECTIONS.MEAL_PLANS, planId));

    const plans = NutritionService.getLocalCache().mealPlans.filter((p) => p.id !== planId);
    NutritionService.saveLocalMealPlans(plans);
  },

  // 3. Nhật ký Nước uống hàng ngày (Daily Water Log)
  subscribeDailyWaterLog(
    userId: string,
    dateStr: string, // YYYY-MM-DD
    onUpdate: (log: DailyWaterLog | null) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const logId = `${userId}_${dateStr}`;
    const logRef = doc(db, COLLECTIONS.DAILY_NUTRITION_LOGS, logId);

    return onSnapshot(
      logRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const log = docSnap.data() as DailyWaterLog;
          onUpdate(log);
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.error('[NutritionService] Lỗi lắng nghe water log:', err);
        onError?.(err);
      }
    );
  },

  async addWaterIntake(
    userId: string,
    dateStr: string,
    amountDeltaMl: number,
    targetMl = 2000
  ): Promise<DailyWaterLog> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const logId = `${userId}_${dateStr}`;
    const nowIso = new Date().toISOString();

    // Check existing from local or default
    const existingLogs = NutritionService.getLocalCache().waterLogs;
    const currentAmount = existingLogs[dateStr]?.amountMl || 0;
    const newAmount = Math.max(0, currentAmount + amountDeltaMl);

    const logData: DailyWaterLog = {
      id: logId,
      userId,
      date: dateStr,
      amountMl: newAmount,
      targetMl,
      updatedAt: nowIso,
    };

    await setDoc(doc(db, COLLECTIONS.DAILY_NUTRITION_LOGS, logId), cleanUndefinedFields(logData));

    existingLogs[dateStr] = logData;
    NutritionService.saveLocalWaterLogs(existingLogs);

    return logData;
  },
};
