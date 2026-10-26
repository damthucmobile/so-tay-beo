'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDocument, subscribeDocument } from './firestoreService';

export interface UseFirestoreDocOptions {
  /** Lắng nghe thay đổi realtime (mặc định: true) */
  realtime?: boolean;
  /** Bật/tắt hook (mặc định: true khi có docId) */
  enabled?: boolean;
}

export interface UseFirestoreDocResult<T> {
  data: (T & { id: string }) | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Hook lấy thông tin 1 Document trên Firestore với hỗ trợ Realtime tự động
 *
 * @example
 * ```tsx
 * const { data: profile, isLoading } = useFirestoreDoc<UserProfile>('users', userId);
 * ```
 */
export function useFirestoreDoc<T = any>(
  collectionName: string,
  docId: string | null | undefined,
  options: UseFirestoreDocOptions = {}
): UseFirestoreDocResult<T> {
  const { realtime = true, enabled = Boolean(docId) } = options;

  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(enabled && docId));
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!docId || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const doc = await getDocument<T>(collectionName, docId);
      setData(doc);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, docId, enabled]);

  useEffect(() => {
    if (!docId || !enabled) {
      setData(null);
      setIsLoading(false);
      return;
    }

    if (realtime) {
      setIsLoading(true);
      const unsubscribe = subscribeDocument<T>(
        collectionName,
        docId,
        (updatedData) => {
          setData(updatedData);
          setIsLoading(false);
        },
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      fetchData();
    }
  }, [collectionName, docId, enabled, realtime, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
