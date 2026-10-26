'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../auth';
import {
  RecentViewItem,
  ActivityTrackerContextValue,
} from './types';
import {
  SESSION_STORAGE_KEY,
  DEFAULT_RECENT_VIEW_LIMIT,
} from './constants';
import { matchTrackingRule } from './routeRules';
import {
  recordRecentView,
  subscribeToRecentViews,
  fetchRecentViews,
  getLocalCachedRecentViews,
} from './recentViewService';
import { logUserActivity, activityLogBuffer } from './activityLogService';

const ActivityTrackerContext = createContext<ActivityTrackerContextValue | null>(null);

/**
 * Hook truy xuất Activity Tracker và danh sách Xem gần đây ở bất kỳ đâu trong ứng dụng
 */
export function useActivityTracker(): ActivityTrackerContextValue {
  const ctx = useContext(ActivityTrackerContext);
  if (!ctx) {
    throw new Error('useActivityTracker phải được sử dụng bên trong <ActivityTrackerProvider>');
  }
  return ctx;
}

interface ActivityTrackerProviderProps {
  children: React.ReactNode;
  maxRecentViews?: number;
}

/**
 * Subcomponent theo dõi thay đổi Route & Query Params, được bọc trong Suspense để an toàn khi prerender SSR
 */
function RouteNavigationWatcher({
  userId,
  sessionId,
}: {
  userId?: string;
  sessionId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastProcessedRouteRef = useRef<string>('');

  useEffect(() => {
    if (!userId || !pathname) return;

    const fullUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    if (lastProcessedRouteRef.current === fullUrl) return;
    lastProcessedRouteRef.current = fullUrl;

    // Kiểm tra xem URL có khớp quy tắc tracking không
    const match = matchTrackingRule(pathname, searchParams ?? undefined);
    if (match) {
      // Tự động lưu Recent View (có throttle)
      recordRecentView(userId, {
        contentId: match.contentId,
        contentType: match.contentType,
        route: fullUrl,
        title: match.title,
        subtitle: match.subtitle,
        sessionId,
        metadata: match.metadata,
      }).catch((e) => console.warn('Lỗi auto-tracking recent view:', e));

      // Tự động ghi nhận Activity Log
      logUserActivity(userId, `VIEW_${match.contentType.toUpperCase()}`, {
        targetId: match.contentId,
        targetType: match.contentType,
        route: fullUrl,
        sessionId,
        metadata: match.metadata,
      });
    }
  }, [pathname, searchParams, userId, sessionId]);

  return null;
}

export const ActivityTrackerProvider: React.FC<ActivityTrackerProviderProps> = ({
  children,
  maxRecentViews = DEFAULT_RECENT_VIEW_LIMIT,
}) => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [recentViews, setRecentViews] = useState<RecentViewItem[]>(() =>
    getLocalCachedRecentViews()
  );
  const [isLoadingRecent, setIsLoadingRecent] = useState<boolean>(true);

  // 1. Khởi tạo phiên làm việc (Session ID) duy nhất cho tab hiện tại
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    setSessionId(sid);
  }, []);

  // 2. Lắng nghe Realtime danh sách Recent Views từ Firestore
  useEffect(() => {
    if (!user?.uid) {
      setRecentViews([]);
      setIsLoadingRecent(false);
      return;
    }

    setIsLoadingRecent(true);
    const unsubscribe = subscribeToRecentViews(
      user.uid,
      (items) => {
        setRecentViews(items);
        setIsLoadingRecent(false);
      },
      maxRecentViews
    );

    return () => unsubscribe();
  }, [user?.uid, maxRecentViews]);

  // 4. API cho phép kích hoạt theo dõi thủ công khi chuyển view trạng thái (State-based Navigation)
  const trackManualView = useCallback(
    async (params: {
      contentId: string;
      contentType: string;
      route?: string;
      title: string;
      subtitle?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user?.uid) return;

      const currentRoute =
        params.route || (typeof window !== 'undefined' ? window.location.pathname : '');

      const docId = `${params.contentType}_${params.contentId}`;

      // 1. Optimistic Update trên React State ngay lập tức (0ms)
      setRecentViews((prev) => {
        const filtered = prev.filter((item) => item.id !== docId);
        const existing = prev.find((item) => item.id === docId);
        const optimisticItem: RecentViewItem = {
          id: docId,
          userId: user.uid,
          contentId: params.contentId,
          contentType: params.contentType,
          route: currentRoute,
          title: params.title,
          subtitle: params.subtitle,
          lastViewedAt: new Date().toISOString(),
          viewCount: (existing?.viewCount || 0) + 1,
          sessionId,
          metadata: params.metadata,
        };
        return [optimisticItem, ...filtered].slice(0, maxRecentViews);
      });

      console.log('📌 [ActivityTracker] Ghi nhận xem:', params.title, `(${params.contentType})`);

      // 2. Ghi nhận Firestore & LocalStorage
      await recordRecentView(user.uid, {
        contentId: params.contentId,
        contentType: params.contentType,
        route: currentRoute,
        title: params.title,
        subtitle: params.subtitle,
        sessionId,
        metadata: params.metadata,
      });

      logUserActivity(user.uid, `VIEW_${params.contentType.toUpperCase()}`, {
        targetId: params.contentId,
        targetType: params.contentType,
        route: currentRoute,
        sessionId,
        metadata: params.metadata,
      });
    },
    [user?.uid, sessionId, maxRecentViews]
  );

  // 5. API ghi nhận Event hành vi tùy biến
  const logEvent = useCallback(
    (
      event: string,
      options?: {
        targetId?: string;
        targetType?: string;
        route?: string;
        metadata?: Record<string, any>;
      }
    ) => {
      if (!user?.uid) return;
      logUserActivity(user.uid, event, {
        ...options,
        sessionId,
      });
    },
    [user?.uid, sessionId]
  );

  // 6. Làm mới danh sách Recent Views
  const refreshRecentViews = useCallback(async () => {
    if (!user?.uid) return;
    const items = await fetchRecentViews(user.uid, maxRecentViews);
    setRecentViews(items);
  }, [user?.uid, maxRecentViews]);

  return (
    <ActivityTrackerContext.Provider
      value={{
        sessionId,
        recentViews,
        isLoadingRecent,
        refreshRecentViews,
        trackManualView,
        logEvent,
      }}
    >
      <Suspense fallback={null}>
        <RouteNavigationWatcher userId={user?.uid} sessionId={sessionId} />
      </Suspense>
      {children}
    </ActivityTrackerContext.Provider>
  );
};
