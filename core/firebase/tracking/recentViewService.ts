import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '../db';
import { RecentViewItem } from './types';
import {
  RECENT_VIEW_THROTTLE_MS,
  DEFAULT_RECENT_VIEW_LIMIT,
  MAX_STORED_RECENT_VIEWS,
  RECENT_VIEWS_LOCAL_CACHE_KEY,
} from './constants';

// In-Memory cache kiểm soát tần suất ghi (Throttling)
// Key: `${userId}_${contentType}_${contentId}` -> Timestamp ms
const recentWriteThrottleMap = new Map<string, number>();

/**
 * Đọc cache nhanh từ localStorage (giúp UI hiển thị lập tức 0ms)
 */
export function getLocalCachedRecentViews(): RecentViewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_VIEWS_LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Cập nhật cache cục bộ
 */
function setLocalCachedRecentViews(items: RecentViewItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      RECENT_VIEWS_LOCAL_CACHE_KEY,
      JSON.stringify(items.slice(0, DEFAULT_RECENT_VIEW_LIMIT))
    );
  } catch (e) {
    // Ignore storage quota
  }
}

/**
 * Ghi nhận hoặc cập nhật một mục xem gần đây lên Firestore
 * - Sử dụng Document ID cố định: `${contentType}_${contentId}` để tự động Idempotent chống duplicate
 * - Tích hợp Throttle 5 phút: Nếu người dùng xem lại cùng 1 nội dung trong 5 phút sẽ không tốn write Firestore
 */
export async function recordRecentView(
  userId: string,
  params: {
    contentId: string;
    contentType: string;
    route: string;
    title: string;
    subtitle?: string;
    icon?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  if (!userId || !params.contentId || !params.contentType) return;

  const throttleKey = `${userId}_${params.contentType}_${params.contentId}`;
  const now = Date.now();
  const lastWriteTime = recentWriteThrottleMap.get(throttleKey);

  // Cập nhật ngay trong Local Cache để UI phản hồi lập tức (Optimistic UI)
  const cached = getLocalCachedRecentViews();
  const docId = `${params.contentType}_${params.contentId}`;
  const optimisticItem: RecentViewItem = {
    id: docId,
    userId,
    contentId: params.contentId,
    contentType: params.contentType,
    route: params.route,
    title: params.title,
    subtitle: params.subtitle,
    icon: params.icon,
    lastViewedAt: new Date().toISOString(),
    viewCount: 1,
    sessionId: params.sessionId,
    metadata: params.metadata,
  };

  const filteredCached = cached.filter((item) => item.id !== docId);
  setLocalCachedRecentViews([optimisticItem, ...filteredCached]);

  // Nếu đã ghi Firestore cách đây ít hơn RECENT_VIEW_THROTTLE_MS -> Bỏ qua write Firestore
  if (lastWriteTime && now - lastWriteTime < RECENT_VIEW_THROTTLE_MS) {
    return;
  }
  recentWriteThrottleMap.set(throttleKey, now);

  const db = getDb();
  const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.RECENT_VIEWS, docId);

  await setDoc(
    docRef,
    {
      userId,
      contentId: params.contentId,
      contentType: params.contentType,
      route: params.route,
      title: params.title,
      subtitle: params.subtitle || '',
      icon: params.icon || '',
      lastViewedAt: serverTimestamp(),
      viewCount: increment(1),
      sessionId: params.sessionId || '',
      metadata: params.metadata || {},
    },
    { merge: true }
  );
}

/**
 * Lấy danh sách Recent Views từ Firestore theo thứ tự xem mới nhất
 */
export async function fetchRecentViews(
  userId: string,
  maxItems: number = DEFAULT_RECENT_VIEW_LIMIT
): Promise<RecentViewItem[]> {
  if (!userId) return [];

  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.RECENT_VIEWS),
    orderBy('lastViewedAt', 'desc'),
    limit(maxItems)
  );

  const snapshot = await getDocs(q);
  const items: RecentViewItem[] = [];
  snapshot.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...(docSnap.data() as any) });
  });

  setLocalCachedRecentViews(items);
  return items;
}

/**
 * Lắng nghe Realtime danh sách Recent Views (giới hạn N bản ghi)
 */
export function subscribeToRecentViews(
  userId: string,
  onUpdate: (items: RecentViewItem[]) => void,
  maxItems: number = DEFAULT_RECENT_VIEW_LIMIT
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.RECENT_VIEWS),
    orderBy('lastViewedAt', 'desc'),
    limit(maxItems)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: RecentViewItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      setLocalCachedRecentViews(items);
      onUpdate(items);
    },
    (err) => {
      console.warn('Lỗi lắng nghe Recent Views:', err);
      // Fallback về cache
      onUpdate(getLocalCachedRecentViews());
    }
  );
}

/**
 * Xóa 1 mục khỏi danh sách xem gần đây
 */
export async function deleteRecentViewItem(userId: string, viewId: string): Promise<void> {
  if (!userId || !viewId) return;
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.RECENT_VIEWS, viewId));

  const cached = getLocalCachedRecentViews().filter((item) => item.id !== viewId);
  setLocalCachedRecentViews(cached);
}

/**
 * Dọn dẹp mềm các mục xem quá cũ vượt quá ngưỡng MAX_STORED_RECENT_VIEWS (ví dụ 50 mục)
 */
export async function purgeExcessRecentViews(
  userId: string,
  maxKeep: number = MAX_STORED_RECENT_VIEWS
): Promise<number> {
  if (!userId) return 0;
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.RECENT_VIEWS),
    orderBy('lastViewedAt', 'desc'),
    limit(100)
  );

  const snapshot = await getDocs(q);
  if (snapshot.docs.length <= maxKeep) return 0;

  const excessDocs = snapshot.docs.slice(maxKeep);
  const batch = writeBatch(db);
  excessDocs.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  return excessDocs.length;
}
