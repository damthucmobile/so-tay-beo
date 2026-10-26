// ==============================================================================
// CẤU HÌNH TÊN DATABASE & TÊN COLLECTIONS FIRESTORE - SỔ TAY BÉO
// ==============================================================================

/**
 * Tên Firestore Database mặc định
 * Có thể cấu hình tùy biến qua biến môi trường NEXT_PUBLIC_FIREBASE_DATABASE_ID
 */
export const DEFAULT_DATABASE_NAME =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_FIREBASE_DATABASE_ID) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID) ||
  '(default)';

/**
 * Danh mục tên Collection chuẩn hóa trong Firestore
 */
export const COLLECTIONS = {
  /** Ghi chú nhanh của người dùng (Quick Notes) */
  USER_NOTES: 'user_notes',

  /** Thông tin hồ sơ người dùng */
  USERS: 'users',

  /** Sổ tay phân loại ghi chú */
  NOTEBOOKS: 'notebooks',

  /** Danh mục nhãn / tag */
  TAGS: 'tags',

  /** Cấu hình & Tùy chọn giao diện/hệ thống */
  SETTINGS: 'settings',

  // ============================================================================
  // PHÂN HỆ QUẢN LÝ LỚP HỌC (CLASS MANAGEMENT MODULE)
  // ============================================================================
  /** Danh sách lớp học */
  CLASSES: 'classes',

  /** Học sinh trong lớp */
  CLASS_STUDENTS: 'class_students',

  /** Lịch học định kỳ mẫu trong tuần */
  SCHEDULE_PATTERNS: 'schedule_patterns',

  /** Các buổi học và nhật ký giảng dạy */
  CLASS_SESSIONS: 'class_sessions',

  // ============================================================================
  // PHÂN HỆ THU NHẬP & THÙ LAO (INCOME MODULE)
  // ============================================================================
  /** Quản lý Thu nhập & Giao dịch thù lao (khớp với collection 'transactions' của Desktop) */
  INCOME_TRANSACTIONS: 'transactions',

  // ============================================================================
  // PHÂN HỆ LỊCH TỰ DO & KHÁCH HÀNG (SCHEDULE MODULE)
  // ============================================================================
  /** Các lịch hẹn / buổi làm việc tự do */
  APPOINTMENTS: 'appointments',

  /** Danh bạ khách hàng / học viên 1-1 */
  CUSTOMERS: 'customers',

  // ============================================================================
  // PHÂN HỆ THEO DÕI HOẠT ĐỘNG & XEM GẦN ĐÂY (ACTIVITY & RECENT VIEWS)
  // ============================================================================
  /** Danh sách nội dung đã xem gần đây (subcollection: users/{uid}/recentViews) */
  RECENT_VIEWS: 'recentViews',

  /** Nhật ký hoạt động người dùng (subcollection: users/{uid}/activityLogs) */
  ACTIVITY_LOGS: 'activityLogs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
