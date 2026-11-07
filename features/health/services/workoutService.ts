// features/health/services/workoutService.ts
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
  WorkoutPlan,
  WorkoutProfile,
  DailyWorkoutLog,
  WorkoutGoal,
  FitnessLevel,
} from '../types';

const WORKOUT_PROFILE_CACHE_KEY = 'so_tay_beo_workout_profile_cache';
const WORKOUT_PLANS_CACHE_KEY = 'so_tay_beo_workout_plans_cache';
const WORKOUT_LOGS_CACHE_KEY = 'so_tay_beo_workout_logs_cache';

export const WorkoutService = {
  // Lấy dữ liệu đệm từ LocalStorage
  getLocalCache(): {
    profile: WorkoutProfile | null;
    plans: WorkoutPlan[];
    logs: Record<string, DailyWorkoutLog>;
  } {
    if (typeof window === 'undefined') {
      return { profile: null, plans: [], logs: {} };
    }
    try {
      const p = localStorage.getItem(WORKOUT_PROFILE_CACHE_KEY);
      const m = localStorage.getItem(WORKOUT_PLANS_CACHE_KEY);
      const l = localStorage.getItem(WORKOUT_LOGS_CACHE_KEY);
      return {
        profile: p ? JSON.parse(p) : null,
        plans: m ? JSON.parse(m) : [],
        logs: l ? JSON.parse(l) : {},
      };
    } catch {
      return { profile: null, plans: [], logs: {} };
    }
  },

  saveLocalProfile(profile: WorkoutProfile | null) {
    if (typeof window === 'undefined') return;
    try {
      if (profile) {
        localStorage.setItem(WORKOUT_PROFILE_CACHE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(WORKOUT_PROFILE_CACHE_KEY);
      }
    } catch {}
  },

  saveLocalPlans(plans: WorkoutPlan[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(WORKOUT_PLANS_CACHE_KEY, JSON.stringify(plans));
    } catch {}
  },

  saveLocalLogs(logs: Record<string, DailyWorkoutLog>) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(WORKOUT_LOGS_CACHE_KEY, JSON.stringify(logs));
    } catch {}
  },

  // Lắng nghe hồ sơ thể lực thời gian thực
  subscribeWorkoutProfile(
    userId: string,
    onData: (profile: WorkoutProfile | null) => void
  ): Unsubscribe {
    const db = getDb();
    if (!db || !userId) return () => {};

    const profileDocRef = doc(db, COLLECTIONS.WORKOUT_PROFILES, userId);
    return onSnapshot(
      profileDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as WorkoutProfile;
          this.saveLocalProfile(data);
          onData(data);
        } else {
          onData(null);
        }
      },
      (error) => {
        console.warn('Lỗi lắng nghe WorkoutProfile:', error);
      }
    );
  },

  // Lưu hoặc cập nhật hồ sơ thể lực
  async saveWorkoutProfile(
    userId: string,
    profileData: Partial<WorkoutProfile>
  ): Promise<WorkoutProfile> {
    const db = getDb();
    if (!db || !userId) throw new Error('Database hoặc userId không khả dụng');

    const profileDocRef = doc(db, COLLECTIONS.WORKOUT_PROFILES, userId);
    const updated: WorkoutProfile = {
      userId,
      fitnessLevel: profileData.fitnessLevel || 'beginner',
      primaryGoal: profileData.primaryGoal || 'general_fitness',
      equipment: profileData.equipment || ['bodyweight'],
      preferredDaysPerWeek: profileData.preferredDaysPerWeek || 4,
      sessionDurationMinutes: profileData.sessionDurationMinutes || 45,
      physicalLimitations: profileData.physicalLimitations || [],
      updatedAt: new Date().toISOString(),
    };

    const cleaned = cleanUndefinedFields(updated);
    await setDoc(profileDocRef, cleaned, { merge: true });
    this.saveLocalProfile(updated);
    return updated;
  },

  // Lắng nghe danh sách kế hoạch lịch tập
  subscribeWorkoutPlans(
    userId: string,
    onData: (plans: WorkoutPlan[]) => void
  ): Unsubscribe {
    const db = getDb();
    if (!db || !userId) return () => {};

    const q = query(
      collection(db, COLLECTIONS.WORKOUT_PLANS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const plans: WorkoutPlan[] = [];
        snapshot.forEach((docSnap) => {
          plans.push(docSnap.data() as WorkoutPlan);
        });
        // Sắp xếp kế hoạch mới nhất lên đầu
        plans.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        this.saveLocalPlans(plans);
        onData(plans);
      },
      (error) => {
        console.warn('Lỗi lắng nghe WorkoutPlans:', error);
      }
    );
  },

  // Lưu kế hoạch lịch tập mới
  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Database không khả dụng');

    const cleaned = cleanUndefinedFields(plan);
    const planDocRef = doc(db, COLLECTIONS.WORKOUT_PLANS, plan.id);
    await setDoc(planDocRef, cleaned);

    const cache = this.getLocalCache();
    const updated = [plan, ...cache.plans.filter((p) => p.id !== plan.id)];
    this.saveLocalPlans(updated);
  },

  // Cập nhật kế hoạch lịch tập
  async updateWorkoutPlan(
    planId: string,
    updates: Partial<WorkoutPlan>
  ): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Database không khả dụng');

    const planDocRef = doc(db, COLLECTIONS.WORKOUT_PLANS, planId);
    const payload = cleanUndefinedFields({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(planDocRef, payload, { merge: true });

    const cache = this.getLocalCache();
    const updated = cache.plans.map((p) =>
      p.id === planId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    this.saveLocalPlans(updated);
  },

  // Xóa kế hoạch lịch tập
  async deleteWorkoutPlan(planId: string): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Database không khả dụng');

    const planDocRef = doc(db, COLLECTIONS.WORKOUT_PLANS, planId);
    await deleteDoc(planDocRef);

    const cache = this.getLocalCache();
    const updated = cache.plans.filter((p) => p.id !== planId);
    this.saveLocalPlans(updated);
  },

  // Lắng nghe nhật ký tập hôm nay
  subscribeDailyWorkoutLog(
    userId: string,
    date: string,
    onData: (log: DailyWorkoutLog | null) => void
  ): Unsubscribe {
    const db = getDb();
    if (!db || !userId) return () => {};

    const logId = `wlog_${userId}_${date}`;
    const logDocRef = doc(db, COLLECTIONS.DAILY_WORKOUT_LOGS, logId);

    return onSnapshot(
      logDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DailyWorkoutLog;
          const cache = this.getLocalCache();
          cache.logs[date] = data;
          this.saveLocalLogs(cache.logs);
          onData(data);
        } else {
          onData(null);
        }
      },
      (error) => {
        console.warn('Lỗi lắng nghe DailyWorkoutLog:', error);
      }
    );
  },

  // Lưu nhật ký buổi tập
  async saveDailyWorkoutLog(log: DailyWorkoutLog): Promise<void> {
    const db = getDb();
    if (!db) throw new Error('Database không khả dụng');

    const logDocRef = doc(db, COLLECTIONS.DAILY_WORKOUT_LOGS, log.id);
    const cleaned = cleanUndefinedFields({
      ...log,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(logDocRef, cleaned, { merge: true });

    const cache = this.getLocalCache();
    cache.logs[log.date] = log;
    this.saveLocalLogs(cache.logs);
  },
};
