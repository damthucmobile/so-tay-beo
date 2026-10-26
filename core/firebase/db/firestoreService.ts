import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  serverTimestamp,
  writeBatch,
  runTransaction,
  getCountFromServer,
  onSnapshot,
  QueryConstraint,
  Transaction,
  DocumentSnapshot,
} from 'firebase/firestore';
import { getDb } from './config';
import { BaseEntity, QueryOptions, QueryFilter, BatchOperation, PaginatedResult } from './types';
import { cleanUndefinedFields } from './utils';

/**
 * Xây dựng danh sách QueryConstraint từ QueryOptions
 */
function buildQueryConstraints(options?: QueryOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (!options) return constraints;

  // 1. Áp dụng bộ lọc WHERE
  if (options.filters && options.filters.length > 0) {
    for (const f of options.filters) {
      if (f.value !== undefined) {
        constraints.push(where(f.field, f.operator, f.value));
      }
    }
  }

  // 2. Áp dụng sắp xếp ORDER BY
  if (options.orderBy && options.orderBy.length > 0) {
    for (const ob of options.orderBy) {
      constraints.push(firestoreOrderBy(ob.field, ob.direction || 'asc'));
    }
  }

  // 3. Phân trang CURSOR
  if (options.startAfter) {
    constraints.push(firestoreStartAfter(options.startAfter));
  }

  // 4. Giới hạn LIMIT
  if (typeof options.limit === 'number' && options.limit > 0) {
    constraints.push(firestoreLimit(options.limit));
  }

  return constraints;
}

/**
 * 1. Thêm mới một Document (ID tự sinh)
 * Tự động gán `createdAt` và `updatedAt` theo thời gian server
 */
export async function addDocument<T extends Record<string, any>>(
  collectionName: string,
  data: T
): Promise<T & { id: string }> {
  const db = getDb();
  const cleaned = cleanUndefinedFields(data);
  const payload = {
    ...cleaned,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, payload);

  return {
    ...data,
    id: docRef.id,
  };
}

/**
 * 2. Lưu hoặc ghi đè Document theo ID tùy chọn
 * Có thể bật cờ `merge: true` để hợp nhất với dữ liệu cũ
 */
export async function setDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  merge: boolean = true
): Promise<void> {
  const db = getDb();
  const cleaned = cleanUndefinedFields(data);
  const payload = {
    ...cleaned,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, payload, { merge });
}

/**
 * 3. Lấy thông tin 1 Document theo ID
 */
export async function getDocument<T = any>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  const db = getDb();
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return null;
  }

  return {
    ...(snap.data() as T),
    id: snap.id,
  };
}

/**
 * 4. Kiểm tra Document có tồn tại hay không
 */
export async function documentExists(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const db = getDb();
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);
  return snap.exists();
}

/**
 * 5. Lấy danh sách Document theo điều kiện Query
 */
export async function getDocuments<T = any>(
  collectionName: string,
  options?: QueryOptions
): Promise<(T & { id: string })[]> {
  const db = getDb();
  const colRef = collection(db, collectionName);
  const constraints = buildQueryConstraints(options);
  const q = query(colRef, ...constraints);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...(d.data() as T),
    id: d.id,
  }));
}

/**
 * 6. Lấy danh sách Document có phân trang (Pagination Cursor)
 */
export async function getDocumentsPaginated<T = any>(
  collectionName: string,
  options?: QueryOptions
): Promise<PaginatedResult<T & { id: string }>> {
  const limitCount = options?.limit || 20;
  const db = getDb();
  const colRef = collection(db, collectionName);
  const constraints = buildQueryConstraints({
    ...options,
    limit: limitCount + 1, // Lấy dư 1 bản ghi để biết còn trang sau không
  });

  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > limitCount;
  const effectiveDocs = hasMore ? snapshot.docs.slice(0, limitCount) : snapshot.docs;

  const data = effectiveDocs.map((d) => ({
    ...(d.data() as T),
    id: d.id,
  }));

  const lastDoc = effectiveDocs.length > 0 ? effectiveDocs[effectiveDocs.length - 1] : null;

  return {
    data,
    lastDoc,
    hasMore,
  };
}

/**
 * 7. Lấy danh sách Document lọc nhanh theo 1 trường (Ví dụ: `userId == 'xyz'`)
 */
export async function getDocumentsByField<T = any>(
  collectionName: string,
  field: string,
  value: any
): Promise<(T & { id: string })[]> {
  return getDocuments<T>(collectionName, {
    filters: [{ field, operator: '==', value }],
  });
}

/**
 * 8. Cập nhật một phần Document
 * Tự động cập nhật trường `updatedAt`
 */
export async function updateDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  partialData: Partial<T>
): Promise<void> {
  const db = getDb();
  const cleaned = cleanUndefinedFields(partialData);
  const payload = {
    ...cleaned,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, payload);
}

/**
 * 9. Xóa hoàn toàn một Document (Hard Delete)
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

/**
 * 10. Xóa mềm Document (Soft Delete)
 * Đánh dấu `isDeleted: true` và `deletedAt: serverTimestamp()`
 */
export async function softDeleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 11. Đếm tổng số document trong collection hoặc theo bộ lọc
 * (Dùng getCountFromServer - siêu nhanh và tiết kiệm chi phí đọc Firestore)
 */
export async function countDocuments(
  collectionName: string,
  filters?: QueryFilter[]
): Promise<number> {
  const db = getDb();
  const colRef = collection(db, collectionName);
  const constraints: QueryConstraint[] = [];

  if (filters && filters.length > 0) {
    for (const f of filters) {
      if (f.value !== undefined) {
        constraints.push(where(f.field, f.operator, f.value));
      }
    }
  }

  const q = query(colRef, ...constraints);
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

/**
 * 12. Thực thi Batch Write nhiều thao tác cùng lúc (Set / Update / Delete)
 * Tối đa 500 thao tác / 1 lần gọi
 */
export async function batchWrite(operations: BatchOperation[]): Promise<void> {
  const db = getDb();
  const CHUNK_SIZE = 500;

  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const op of chunk) {
      const docRef = doc(db, op.collection, op.id);
      if (op.type === 'set') {
        const cleaned = cleanUndefinedFields(op.data || {});
        batch.set(docRef, { ...cleaned, updatedAt: serverTimestamp() }, { merge: op.merge ?? true });
      } else if (op.type === 'update') {
        const cleaned = cleanUndefinedFields(op.data || {});
        batch.update(docRef, { ...cleaned, updatedAt: serverTimestamp() });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }

    await batch.commit();
  }
}

/**
 * 13. Xóa hàng loạt danh sách Document theo ID
 */
export async function batchDelete(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  const ops: BatchOperation[] = docIds.map((id) => ({
    type: 'delete',
    collection: collectionName,
    id,
  }));
  await batchWrite(ops);
}

/**
 * 14. Chạy Transaction đảm bảo tính toàn vẹn (ACID)
 */
export async function runDbTransaction<T>(
  updateFunction: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const db = getDb();
  return runTransaction(db, updateFunction);
}

/**
 * 15. Lắng nghe Realtime thay đổi của 1 Document (onSnapshot)
 * Trả về hàm `unsubscribe()` để dừng lắng nghe khi component unmount
 */
export function subscribeDocument<T = any>(
  collectionName: string,
  docId: string,
  callback: (data: (T & { id: string }) | null) => void,
  onError?: (error: Error) => void
): () => void {
  const db = getDb();
  const docRef = doc(db, collectionName, docId);

  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({
          ...(snap.data() as T),
          id: snap.id,
        });
      }
    },
    (err) => {
      console.error(`[Firestore Realtime] Lỗi lắng nghe doc ${collectionName}/${docId}:`, err);
      onError?.(err);
    }
  );

  return unsubscribe;
}

/**
 * 16. Lắng nghe Realtime thay đổi của một Collection hoặc Query
 * Trả về hàm `unsubscribe()` để dừng lắng nghe khi component unmount
 */
export function subscribeCollection<T = any>(
  collectionName: string,
  callback: (items: (T & { id: string })[]) => void,
  options?: QueryOptions,
  onError?: (error: Error) => void
): () => void {
  const db = getDb();
  const colRef = collection(db, collectionName);
  const constraints = buildQueryConstraints(options);
  const q = query(colRef, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...(d.data() as T),
        id: d.id,
      }));
      callback(items);
    },
    (err) => {
      console.error(`[Firestore Realtime] Lỗi lắng nghe collection ${collectionName}:`, err);
      onError?.(err);
    }
  );

  return unsubscribe;
}
