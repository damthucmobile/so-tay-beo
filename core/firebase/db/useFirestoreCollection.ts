'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDocuments, subscribeCollection } from './firestoreService';
import { QueryOptions } from './types';

export interface UseFirestoreCollectionOptions extends QueryOptions {
  /** Lắng nghe thay đổi realtime (mặc định: true) */
  realtime?: boolean;
  /** Bật/tắt hook (mặc định: true) */
  enabled?: boolean;
}

export interface UseFirestoreCollectionResult<T> {
  data: (T & { id: string })[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React Hook lấy danh sách Document từ Firestore theo bộ lọc với hỗ trợ Realtime tự động
 *
 * @example
 * ```tsx
 * const { data: tasks, isLoading } = useFirestoreCollection<Task>('tasks', {
 *   filters: [{ field: 'userId', operator: '==', value: user?.uid }],
 *   orderBy: [{ field: 'createdAt', direction: 'desc' }],
 * });
 * ```
 */
export function useFirestoreCollection<T = any>(
  collectionName: string,
  options: UseFirestoreCollectionOptions = {}
): UseFirestoreCollectionResult<T> {
  const { realtime = true, enabled = true, filters, orderBy, limit, startAfter } = options;

  const [data, setData] = useState<(T & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  // Tạo serialized queryOptions để tránh useEffect kích hoạt vô tận do object reference
  const serializedOptions = useMemo(
    () => ({ filters, orderBy, limit, startAfter }),
    [JSON.stringify(filters), JSON.stringify(orderBy), limit, startAfter]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await getDocuments<T>(collectionName, serializedOptions);
      setData(items);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, enabled, serializedOptions]);

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      return;
    }

    if (realtime) {
      setIsLoading(true);
      const unsubscribe = subscribeCollection<T>(
        collectionName,
        (items) => {
          setData(items);
          setIsLoading(false);
        },
        serializedOptions,
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      fetchData();
    }
  }, [collectionName, enabled, realtime, serializedOptions, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
