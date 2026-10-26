import {
  getFirestore,
  Firestore,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';
import { db as authDb, app as authApp, initFirebase } from '../auth/config';

let firestoreInstance: Firestore | null = authDb;

/**
 * Lấy instance Firestore hiện tại hoặc khởi tạo nếu chưa có (hỗ trợ databaseId tùy chọn)
 */
export function getDb(databaseId?: string): Firestore {
  if (databaseId && databaseId !== '(default)') {
    const targetApp = authApp || initFirebase().app;
    return getFirestore(targetApp, databaseId);
  }

  if (firestoreInstance) {
    return firestoreInstance;
  }

  if (authDb) {
    firestoreInstance = authDb;
    return firestoreInstance;
  }

  // Khởi tạo nếu chưa được khởi tạo
  const { db } = initFirebase();
  firestoreInstance = db;
  return firestoreInstance;
}

export {
  firestoreInstance as db,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
};
