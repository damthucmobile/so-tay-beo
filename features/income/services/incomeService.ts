import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '@/core/firebase';
import { IncomeTransaction } from '../types';

/**
 * Lắng nghe thay đổi Realtime các giao dịch thu nhập của người dùng
 */
export function subscribeToIncomeTransactions(
  userId: string,
  onUpdate: (transactions: IncomeTransaction[]) => void,
  onError?: (error: any) => void
) {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.INCOME_TRANSACTIONS),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: IncomeTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const rawDate = data.date || data.createdAt || data.updatedAt || new Date().toISOString();
        const date = typeof rawDate === 'string' ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

        list.push({
          id: docSnap.id,
          userId: data.userId || userId,
          clientName: data.clientName || '',
          serviceName: data.serviceName || '',
          amount: Number(data.amount) || 0,
          status: data.status || 'Chờ',
          appointmentId: data.appointmentId || undefined,
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          ...data,
          date,
        });
      });
      // Sắp xếp theo ngày giao dịch giảm dần an toàn
      list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to income transactions:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Tạo mới hoặc cập nhật giao dịch thu nhập
 */
export async function saveIncomeTransaction(
  data: Partial<IncomeTransaction>,
  userId: string
): Promise<string> {
  const db = getDb();
  const txRef = collection(db, COLLECTIONS.INCOME_TRANSACTIONS);
  const txId = data.id || doc(txRef).id;
  const now = new Date().toISOString();

  const entity: IncomeTransaction = {
    id: txId,
    userId,
    clientName: data.clientName?.trim() || '',
    serviceName: data.serviceName?.trim() || '',
    amount: Number(data.amount) || 0,
    date: data.date || now.slice(0, 10),
    status: data.status || 'Đã trả',
    appointmentId: data.appointmentId || undefined,
    notes: data.notes || '',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.INCOME_TRANSACTIONS, txId), entity, { merge: true });
  return txId;
}

/**
 * Xóa một giao dịch thu nhập
 */
export async function deleteIncomeTransaction(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.INCOME_TRANSACTIONS, id));
}

/**
 * Đánh dấu giao dịch đã thanh toán
 */
export async function markTransactionAsPaid(id: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.INCOME_TRANSACTIONS, id), {
    status: 'Đã trả',
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Làm sạch các giao dịch bị trùng lặp
 */
export async function cleanDuplicateTransactions(
  transactions: IncomeTransaction[]
): Promise<number> {
  const db = getDb();
  const seenMap = new Map<string, IncomeTransaction>();
  const toDeleteIds: string[] = [];

  for (const tx of transactions) {
    const clientName = (tx.clientName || '').toLowerCase().trim();
    const serviceName = (tx.serviceName || '').toLowerCase().trim();
    const dateStr = (tx.date || '').slice(0, 10);
    const amount = tx.amount || 0;
    const key = tx.appointmentId
      ? `appt_${tx.appointmentId}`
      : `tx_${clientName}_${serviceName}_${dateStr}_${amount}`;

    if (!seenMap.has(key)) {
      seenMap.set(key, tx);
    } else {
      const existing = seenMap.get(key)!;
      if (existing.status !== 'Đã trả' && tx.status === 'Đã trả') {
        toDeleteIds.push(existing.id);
        seenMap.set(key, tx);
      } else {
        toDeleteIds.push(tx.id);
      }
    }
  }

  if (toDeleteIds.length === 0) return 0;

  // Xóa theo batch
  const batch = writeBatch(db);
  toDeleteIds.forEach((id) => {
    batch.delete(doc(db, COLLECTIONS.INCOME_TRANSACTIONS, id));
  });

  await batch.commit();
  return toDeleteIds.length;
}
