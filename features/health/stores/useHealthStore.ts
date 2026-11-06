// features/health/stores/useHealthStore.ts
'use client';

import { create } from 'zustand';
import { HealthRecordDocument, HealthMetricValue, HealthCategory, HealthCheckupSession } from '../types';
import { HealthService } from '../services/healthService';

export type HealthSubTab = 'overview' | 'biometrics' | 'workouts' | 'nutrition';

interface HealthStoreState {
  records: HealthRecordDocument[];
  metrics: HealthMetricValue[];
  checkupSessions: HealthCheckupSession[];
  activeSubTab: HealthSubTab;
  selectedCategory: HealthCategory | 'all';
  selectedCheckupId: string | 'all';
  searchQuery: string;
  selectedRecordId: string | null;
  isLoading: boolean;
  isAiParsing: boolean;

  // Actions
  initStore: (userId?: string | null) => () => void;
  setActiveSubTab: (tab: HealthSubTab) => void;
  setSelectedCategory: (category: HealthCategory | 'all') => void;
  setSelectedCheckupId: (id: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSelectedRecordId: (id: string | null) => void;
  setIsAiParsing: (status: boolean) => void;

  saveRecord: (
    userId: string,
    record: Omit<HealthRecordDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => Promise<string>;
  addMetric: (
    userId: string,
    metric: Omit<HealthMetricValue, 'id'>
  ) => Promise<string>;
  saveCheckup: (
    userId: string,
    session: Omit<HealthCheckupSession, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => Promise<string>;
  updateCheckup: (
    sessionId: string,
    updates: Partial<HealthCheckupSession>
  ) => Promise<void>;
  deleteRecord: (recordId: string) => Promise<void>;
  deleteMetric: (metricId: string) => Promise<void>;
  deleteCheckup: (sessionId: string) => Promise<void>;
}

export const useHealthStore = create<HealthStoreState>((set, get) => {
  const initialCache = HealthService.getLocalCache();

  return {
    records: initialCache.records,
    metrics: initialCache.metrics,
    checkupSessions: [],
    activeSubTab: 'overview',
    selectedCategory: 'all',
    selectedCheckupId: 'all',
    searchQuery: '',
    selectedRecordId: null,
    isLoading: false,
    isAiParsing: false,

    initStore: (userId?: string | null) => {
      if (!userId) return () => {};

      set({ isLoading: true });

      const unsubRecords = HealthService.subscribeHealthRecords(
        userId,
        (records) => {
          set({ records, isLoading: false });
        },
        (err) => {
          console.error('[HealthStore] Lỗi tải records:', err);
          set({ isLoading: false });
        }
      );

      const unsubMetrics = HealthService.subscribeHealthMetrics(
        userId,
        (metrics) => {
          set({ metrics });
        },
        (err) => {
          console.error('[HealthStore] Lỗi tải metrics:', err);
        }
      );

      const unsubCheckups = HealthService.subscribeCheckupSessions(
        userId,
        (checkupSessions) => {
          set({ checkupSessions });
        },
        (err) => {
          console.error('[HealthStore] Lỗi tải checkupSessions:', err);
        }
      );

      return () => {
        unsubRecords();
        unsubMetrics();
        unsubCheckups();
      };
    },

    setActiveSubTab: (tab) => set({ activeSubTab: tab }),
    setSelectedCategory: (cat) => set({ selectedCategory: cat }),
    setSelectedCheckupId: (id) => set({ selectedCheckupId: id }),
    setSearchQuery: (q) => set({ searchQuery: q }),
    setSelectedRecordId: (id) => set({ selectedRecordId: id }),
    setIsAiParsing: (status) => set({ isAiParsing: status }),

    saveRecord: async (userId, record) => {
      const recordId = await HealthService.saveHealthRecord(userId, record);
      return recordId;
    },

    addMetric: async (userId, metric) => {
      const metricId = await HealthService.addSingleMetric(userId, metric);
      return metricId;
    },

    saveCheckup: async (userId, session) => {
      const sessionId = await HealthService.saveCheckupSession(userId, session);
      return sessionId;
    },

    updateCheckup: async (sessionId, updates) => {
      await HealthService.updateCheckupSession(sessionId, updates);
      set((state) => ({
        checkupSessions: state.checkupSessions.map((s) =>
          s.id === sessionId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        ),
      }));
    },

    deleteRecord: async (recordId) => {
      await HealthService.deleteHealthRecord(recordId);
      set((state) => ({
        records: state.records.filter((r) => r.id !== recordId),
        metrics: state.metrics.filter((m) => m.sourceDocId !== recordId),
      }));
    },

    deleteMetric: async (metricId) => {
      await HealthService.deleteHealthMetric(metricId);
      set((state) => ({
        metrics: state.metrics.filter((m) => m.id !== metricId),
      }));
    },

    deleteCheckup: async (sessionId) => {
      await HealthService.deleteCheckupSession(sessionId);
      set((state) => ({
        checkupSessions: state.checkupSessions.filter((s) => s.id !== sessionId),
      }));
    },
  };
});
