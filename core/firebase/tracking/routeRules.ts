import { TrackingRule } from './types';

/**
 * Danh sách các đường dẫn tĩnh bị loại bỏ, không bao giờ tracking
 */
export const IGNORED_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/settings',
  '/profile',
  '/search',
  '/_not-found',
  '/api',
];

/**
 * Danh mục quy tắc ánh xạ tự động từ Route sang Content Metadata
 * Bạn có thể mở rộng danh sách này bất kỳ lúc nào mà không cần chạm vào UI component.
 */
export const TRACKING_RULES: TrackingRule[] = [
  // 1. Tài liệu học tập / Giáo án: /document/:id
  {
    pattern: /^\/document\/([^/?#]+)/,
    contentType: 'document',
    extractParams: (matches) => ({
      contentId: matches[1],
      title: `Tài liệu #${matches[1]}`,
      subtitle: 'Tài liệu học tập',
    }),
  },

  // 2. Chi tiết lớp học theo URL: /class/:id hoặc /classes/:id
  {
    pattern: /^\/(?:class|classes)\/([^/?#]+)/,
    contentType: 'class',
    extractParams: (matches) => ({
      contentId: matches[1],
      title: `Lớp học #${matches[1]}`,
      subtitle: 'Quản lý lớp học',
    }),
  },

  // 3. Khóa học / bài giảng: /course/:courseId/lesson/:lessonId
  {
    pattern: /^\/course\/([^/?#]+)\/lesson\/([^/?#]+)/,
    contentType: 'lesson',
    extractParams: (matches) => ({
      contentId: matches[2],
      title: `Bài học #${matches[2]}`,
      subtitle: `Khóa học #${matches[1]}`,
      metadata: { courseId: matches[1] },
    }),
  },

  // 4. Khách hàng / Học sinh 1-1: /customer/:id hoặc /customers/:id
  {
    pattern: /^\/(?:customer|customers)\/([^/?#]+)/,
    contentType: 'customer',
    extractParams: (matches) => ({
      contentId: matches[1],
      title: `Hồ sơ khách hàng #${matches[1]}`,
      subtitle: 'Khách hàng & Học viên',
    }),
  },
];

/**
 * Hàm kiểm tra và trích xuất nội dung cần theo dõi từ URL hiện tại
 */
export function matchTrackingRule(
  pathname: string,
  searchParams?: URLSearchParams
): {
  contentType: string;
  contentId: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, any>;
} | null {
  if (!pathname) return null;

  // 1. Kiểm tra blacklist
  for (const ignored of IGNORED_PATHS) {
    if (pathname === ignored || pathname.startsWith(`${ignored}/`)) {
      return null;
    }
  }

  // 2. Kiểm tra các rules cấu hình
  for (const rule of TRACKING_RULES) {
    const match = pathname.match(rule.pattern);
    if (match) {
      const extracted = rule.extractParams(match, pathname, searchParams);
      if (extracted && extracted.contentId) {
        return {
          contentType: rule.contentType,
          contentId: extracted.contentId,
          title: extracted.title || `${rule.contentType} #${extracted.contentId}`,
          subtitle: extracted.subtitle,
          metadata: extracted.metadata,
        };
      }
    }
  }

  return null;
}
