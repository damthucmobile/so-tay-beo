import { Timestamp } from 'firebase/firestore';

/**
 * Cấu trúc một mục trong danh sách Xem gần đây (Recent View)
 * Lưu tại Firestore: users/{userId}/recentViews/{contentType}_{contentId}
 */
export interface RecentViewItem {
  id: string; // Document ID: ${contentType}_${contentId}
  userId: string;
  contentId: string;
  contentType: string;
  route: string;
  title: string;
  subtitle?: string;
  icon?: string;
  lastViewedAt: Timestamp | any;
  viewCount: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Cấu trúc một nhật ký hoạt động người dùng (Activity Log)
 * Lưu tại Firestore: users/{userId}/activityLogs/{autoId}
 */
export interface ActivityLogItem {
  id?: string;
  userId: string;
  event: string;
  targetId?: string;
  targetType?: string;
  route: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp | any;
}

/**
 * Quy tắc ánh xạ đường dẫn (Route Tracking Rule)
 */
export interface TrackingRule {
  pattern: RegExp;
  contentType: string;
  extractParams: (
    matches: RegExpMatchArray,
    pathname: string,
    searchParams?: URLSearchParams
  ) => {
    contentId: string;
    title?: string;
    subtitle?: string;
    metadata?: Record<string, any>;
  } | null;
}

/**
 * Context value cung cấp cho toàn bộ ứng dụng
 */
export interface ActivityTrackerContextValue {
  sessionId: string;
  recentViews: RecentViewItem[];
  isLoadingRecent: boolean;
  refreshRecentViews: () => Promise<void>;
  trackManualView: (params: {
    contentId: string;
    contentType: string;
    route?: string;
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  logEvent: (
    event: string,
    options?: {
      targetId?: string;
      targetType?: string;
      route?: string;
      metadata?: Record<string, any>;
    }
  ) => void;
}
