import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { getDb, COLLECTIONS, cleanUndefinedFields } from '@/core/firebase';
import { SchoolTimetable } from '../types';

/**
 * Lắng nghe thay đổi Realtime các thời khóa biểu của người dùng từ Firestore
 */
export function subscribeToSchoolTimetables(
  userId: string,
  onUpdate: (timetables: SchoolTimetable[]) => void,
  onError?: (error: any) => void
) {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.SCHOOL_TIMETABLES),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: SchoolTimetable[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sắp xếp thời khóa biểu mới nhất lên đầu theo updatedAt hoặc importedAt
      list.sort((a, b) =>
        (b.updatedAt || b.importedAt || '').localeCompare(a.updatedAt || a.importedAt || '')
      );
      onUpdate(list);
    },
    (err) => {
      console.error('Lỗi khi lắng nghe thời khóa biểu từ Firebase:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lưu hoặc cập nhật thời khóa biểu lên Firestore
 */
export async function saveSchoolTimetable(
  data: Partial<SchoolTimetable>,
  userId: string
): Promise<string> {
  const db = getDb();
  const timetableRef = collection(db, COLLECTIONS.SCHOOL_TIMETABLES);
  const timetableId = data.id || doc(timetableRef).id;
  const now = new Date().toISOString();

  const entity: SchoolTimetable = {
    id: timetableId,
    userId,
    subOrg: data.subOrg || '',
    schoolName: data.schoolName?.trim() || 'Trường THCS / THPT',
    title: data.title?.trim() || 'THỜI KHÓA BIỂU TOÀN TRƯỜNG',
    description: data.description || '',
    fileName: data.fileName || '',
    classes: data.classes || [],
    teachers: data.teachers || [],
    subjects: data.subjects || [],
    entries: (data.entries || []).map((e) => ({
      id: e.id,
      dayOfWeek: e.dayOfWeek,
      session: e.session,
      period: e.period,
      className: e.className,
      subject: e.subject || '',
      teacher: e.teacher || '',
      room: e.room || '',
      note: e.note || '',
    })),
    totalEntries: data.totalEntries || data.entries?.length || 0,
    importedAt: data.importedAt || now,
    createdAt: data.createdAt || now,
    updatedAt: now,
    isActive: data.isActive !== undefined ? data.isActive : true,
  };

  const cleaned = cleanUndefinedFields(entity);
  await setDoc(doc(db, COLLECTIONS.SCHOOL_TIMETABLES, timetableId), cleaned, { merge: true });
  return timetableId;
}

/**
 * Xóa một thời khóa biểu trên Firestore
 */
export async function deleteSchoolTimetable(
  id: string,
  userId: string
): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.SCHOOL_TIMETABLES, id));
}

/**
 * Lấy danh sách thời khóa biểu của người dùng (dạng Promise một lần)
 */
export async function fetchSchoolTimetables(userId: string): Promise<SchoolTimetable[]> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.SCHOOL_TIMETABLES),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const list: SchoolTimetable[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });

  list.sort((a, b) =>
    (b.updatedAt || b.importedAt || '').localeCompare(a.updatedAt || a.importedAt || '')
  );
  return list;
}
