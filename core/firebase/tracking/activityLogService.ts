import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getDb, COLLECTIONS } from '../db';
import { ActivityLogItem } from './types';
import {
  ACTIVITY_LOG_FLUSH_INTERVAL_MS,
  ACTIVITY_LOG_MAX_BATCH_SIZE,
} from './constants';

/**
 * Hàng đợi gom lô (Batching Queue) cho Activity Logs
 * Giảm số lượng request mạng và tối ưu chi phí Firestore tối đa.
 */
class ActivityLogBuffer {
  private queue: ActivityLogItem[] = [];
  private timer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
    }
  }

  /**
   * Đẩy một sự kiện hoạt động vào hàng đợi
   */
  public enqueue(item: ActivityLogItem): void {
    this.queue.push(item);

    // Nếu hàng đợi đạt giới hạn tối đa -> Xả ngay lập tức
    if (this.queue.length >= ACTIVITY_LOG_MAX_BATCH_SIZE) {
      this.flush();
    } else if (!this.timer) {
      // Thiết lập bộ đếm thời gian tự động xả sau N giây
      this.timer = setTimeout(() => {
        this.flush();
      }, ACTIVITY_LOG_FLUSH_INTERVAL_MS);
    }
  }

  /**
   * Ghi toàn bộ hàng đợi sự kiện vào Firestore bằng WriteBatch
   */
  public async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batchItems = [...this.queue];
    this.queue = [];

    try {
      const db = getDb();
      const batch = writeBatch(db);

      batchItems.forEach((item) => {
        const logCol = collection(
          db,
          COLLECTIONS.USERS,
          item.userId,
          COLLECTIONS.ACTIVITY_LOGS
        );
        const logDoc = doc(logCol);
        batch.set(logDoc, {
          userId: item.userId,
          event: item.event,
          targetId: item.targetId || null,
          targetType: item.targetType || null,
          route: item.route,
          sessionId: item.sessionId || null,
          metadata: item.metadata || {},
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error: any) {
      // Bỏ qua cảnh báo permission-denied để tránh spam console khi Firestore Rules chưa deploy
      if (error?.code !== 'permission-denied') {
        console.warn('Lỗi xả hàng đợi Activity Log:', error);
      }
    }
  }

  /**
   * Xả khẩn cấp đồng bộ khi trình duyệt đóng tab
   */
  private flushSync(): void {
    if (this.queue.length > 0) {
      // Gọi flush bất đồng bộ (trình duyệt hiện đại hỗ trợ qua keepalive hoặc commit nhanh)
      void this.flush();
    }
  }
}

export const activityLogBuffer = new ActivityLogBuffer();

/**
 * Hàm tiện ích để ghi nhận hành vi người dùng (Public API)
 */
export function logUserActivity(
  userId: string,
  event: string,
  options?: {
    targetId?: string;
    targetType?: string;
    route?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  }
): void {
  if (!userId || !event) return;

  activityLogBuffer.enqueue({
    userId,
    event,
    targetId: options?.targetId,
    targetType: options?.targetType,
    route: options?.route || (typeof window !== 'undefined' ? window.location.pathname : ''),
    sessionId: options?.sessionId,
    metadata: options?.metadata || {},
    createdAt: null,
  });
}
