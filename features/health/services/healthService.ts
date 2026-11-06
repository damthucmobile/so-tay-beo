// features/health/services/healthService.ts
'use client';

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { getDb, COLLECTIONS, cleanUndefinedFields } from '@/core/firebase';
import { HealthRecordDocument, HealthMetricValue, HealthCheckupSession } from '../types';

const RECORDS_STORAGE_KEY = 'so_tay_beo_health_records_cache';
const METRICS_STORAGE_KEY = 'so_tay_beo_health_metrics_cache';

export function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  return cleanUndefinedFields(obj) as T;
}

export function parseDateToTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();
  // Check if DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }
  const parsed = new Date(trimmed).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export const HealthService = {
  // Lấy dữ liệu đệm từ LocalStorage
  getLocalCache(): {
    records: HealthRecordDocument[];
    metrics: HealthMetricValue[];
  } {
    if (typeof window === 'undefined') return { records: [], metrics: [] };
    try {
      const rec = localStorage.getItem(RECORDS_STORAGE_KEY);
      const met = localStorage.getItem(METRICS_STORAGE_KEY);
      return {
        records: rec ? JSON.parse(rec) : [],
        metrics: met ? JSON.parse(met) : [],
      };
    } catch {
      return { records: [], metrics: [] };
    }
  },

  // Cập nhật bộ nhớ đệm
  saveLocalCache(records?: HealthRecordDocument[], metrics?: HealthMetricValue[]) {
    if (typeof window === 'undefined') return;
    try {
      if (records) localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
      if (metrics) localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
    } catch {}
  },

  // Lắng nghe realtime danh sách hồ sơ khám bệnh
  subscribeHealthRecords(
    userId: string,
    onUpdate: (records: HealthRecordDocument[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const q = query(
      collection(db, COLLECTIONS.HEALTH_RECORDS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const records: HealthRecordDocument[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        records.sort(
          (a, b) =>
            parseDateToTimestamp(b.recordDate) - parseDateToTimestamp(a.recordDate) ||
            parseDateToTimestamp(b.createdAt) - parseDateToTimestamp(a.createdAt)
        );
        HealthService.saveLocalCache(records, undefined);
        onUpdate(records);
      },
      (err) => {
        console.error('[HealthService] Lỗi lắng nghe records:', err);
        onError?.(err);
      }
    );
  },

  // Lắng nghe realtime danh sách chỉ số sinh học
  subscribeHealthMetrics(
    userId: string,
    onUpdate: (metrics: HealthMetricValue[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const q = query(
      collection(db, COLLECTIONS.HEALTH_METRICS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const metrics: HealthMetricValue[] = [];
        snapshot.forEach((docSnap) => {
          metrics.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        metrics.sort(
          (a, b) =>
            parseDateToTimestamp(b.measuredAt) - parseDateToTimestamp(a.measuredAt) ||
            (b.id || '').localeCompare(a.id || '')
        );
        HealthService.saveLocalCache(undefined, metrics);
        onUpdate(metrics);
      },
      (err) => {
        console.error('[HealthService] Lỗi lắng nghe metrics:', err);
        onError?.(err);
      }
    );
  },

  // Lưu hồ sơ khám bệnh và tự động cập nhật các chỉ số đơn lẻ
  async saveHealthRecord(
    userId: string,
    record: Omit<HealthRecordDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    customId?: string
  ): Promise<string> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const recordId = customId || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullRecord: HealthRecordDocument = {
      ...record,
      id: recordId,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. Lưu hồ sơ chính
    await setDoc(doc(db, COLLECTIONS.HEALTH_RECORDS, recordId), cleanUndefined(fullRecord));

    // 2. Lưu các chỉ số chi tiết vào health_metrics
    if (record.metrics && record.metrics.length > 0) {
      for (const m of record.metrics) {
        const metricId = m.id || `met_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const metricDoc: HealthMetricValue & { userId: string } = {
          ...m,
          id: metricId,
          userId,
          sourceDocId: recordId,
          checkupSessionId: record.checkupSessionId || m.checkupSessionId || undefined,
          hospitalName: record.hospitalName || m.hospitalName,
          doctorName: record.doctorName || m.doctorName,
          measuredAt: m.measuredAt || record.recordDate || nowIso.split('T')[0],
        };
        await setDoc(doc(db, COLLECTIONS.HEALTH_METRICS, metricId), cleanUndefined(metricDoc));
      }
    }

    return recordId;
  },

  // Thêm một chỉ số sinh tồn đo nhanh (cân nặng, huyết áp, nhịp tim...)
  async addSingleMetric(
    userId: string,
    metric: Omit<HealthMetricValue, 'id'>
  ): Promise<string> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const metricId = `vital_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMetric = {
      ...metric,
      id: metricId,
      userId,
      checkupSessionId: metric.checkupSessionId || undefined,
    };
    await setDoc(doc(db, COLLECTIONS.HEALTH_METRICS, metricId), cleanUndefined(fullMetric));
    return metricId;
  },

  // Xóa hồ sơ khám bệnh
  async deleteHealthRecord(recordId: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    await deleteDoc(doc(db, COLLECTIONS.HEALTH_RECORDS, recordId));
  },

  // Xóa một chỉ số đơn lẻ
  async deleteHealthMetric(metricId: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    await deleteDoc(doc(db, COLLECTIONS.HEALTH_METRICS, metricId));
  },

  // Cập nhật thông tin của một chỉ số
  async updateHealthMetric(
    metricId: string,
    updates: Partial<HealthMetricValue>
  ): Promise<void> {
    const db = getDb();
    if (!db) return;
    const ref = doc(db, COLLECTIONS.HEALTH_METRICS, metricId);
    await setDoc(ref, cleanUndefined(updates), { merge: true });
  },

  // Cập nhật thông tin của hồ sơ khám bệnh
  async updateHealthRecord(
    recordId: string,
    updates: Partial<HealthRecordDocument>
  ): Promise<void> {
    const db = getDb();
    if (!db) return;
    const ref = doc(db, COLLECTIONS.HEALTH_RECORDS, recordId);
    await setDoc(ref, cleanUndefined({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
  },

  // Lắng nghe realtime danh sách các đợt khám sức khỏe
  subscribeCheckupSessions(
    userId: string,
    onUpdate: (sessions: HealthCheckupSession[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    if (!userId) return () => {};
    const db = getDb();
    if (!db) return () => {};

    const q = query(
      collection(db, COLLECTIONS.HEALTH_CHECKUPS),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: HealthCheckupSession[] = [];
        snapshot.forEach((docSnap) => {
          sessions.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        sessions.sort(
          (a, b) =>
            parseDateToTimestamp(b.checkupDate) - parseDateToTimestamp(a.checkupDate) ||
            parseDateToTimestamp(b.createdAt) - parseDateToTimestamp(a.createdAt)
        );
        onUpdate(sessions);
      },
      (err) => {
        console.error('[HealthService] Lỗi lắng nghe checkups:', err);
        onError?.(err);
      }
    );
  },

  // Lưu đợt khám sức khỏe
  async saveCheckupSession(
    userId: string,
    session: Omit<HealthCheckupSession, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    customId?: string
  ): Promise<string> {
    const db = getDb();
    if (!db) throw new Error('Cơ sở dữ liệu Firestore chưa được khởi tạo.');

    const sessionId = customId || `checkup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullSession: HealthCheckupSession = {
      ...session,
      id: sessionId,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(doc(db, COLLECTIONS.HEALTH_CHECKUPS, sessionId), cleanUndefined(fullSession));
    return sessionId;
  },

  // Cập nhật thông tin đợt khám sức khỏe
  async updateCheckupSession(
    sessionId: string,
    updates: Partial<HealthCheckupSession>
  ): Promise<void> {
    const db = getDb();
    if (!db) return;
    const ref = doc(db, COLLECTIONS.HEALTH_CHECKUPS, sessionId);
    await setDoc(ref, cleanUndefined({ ...updates, updatedAt: new Date().toISOString() }), { merge: true });
  },

  // Xóa đợt khám sức khỏe
  async deleteCheckupSession(sessionId: string): Promise<void> {
    const db = getDb();
    if (!db) return;
    await deleteDoc(doc(db, COLLECTIONS.HEALTH_CHECKUPS, sessionId));
  },
};

