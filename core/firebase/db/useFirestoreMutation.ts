'use client';

import { useState, useCallback } from 'react';
import {
  addDocument,
  updateDocument,
  setDocument,
  deleteDocument,
  softDeleteDocument,
} from './firestoreService';

export interface UseFirestoreMutationResult<T> {
  add: (data: T) => Promise<T & { id: string }>;
  update: (id: string, partialData: Partial<T>) => Promise<void>;
  set: (id: string, data: Partial<T>, merge?: boolean) => Promise<void>;
  remove: (id: string) => Promise<void>;
  softRemove: (id: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

/**
 * React Hook thực hiện các thao tác Thêm / Sửa / Xóa trên một collection Firestore
 *
 * @example
 * ```tsx
 * const { add, update, remove, isLoading } = useFirestoreMutation<Product>('products');
 * await add({ name: 'Sản phẩm mới', price: 100000 });
 * ```
 */
export function useFirestoreMutation<T extends Record<string, any> = any>(
  collectionName: string
): UseFirestoreMutationResult<T> {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const add = useCallback(
    async (data: T): Promise<T & { id: string }> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await addDocument<T>(collectionName, data);
        return result;
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const update = useCallback(
    async (id: string, partialData: Partial<T>): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await updateDocument<T>(collectionName, id, partialData);
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const set = useCallback(
    async (id: string, data: Partial<T>, merge: boolean = true): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await setDocument<T>(collectionName, id, data, merge);
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await deleteDocument(collectionName, id);
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  const softRemove = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await softDeleteDocument(collectionName, id);
      } catch (err: any) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [collectionName]
  );

  return {
    add,
    update,
    set,
    remove,
    softRemove,
    isLoading,
    error,
    clearError,
  };
}
