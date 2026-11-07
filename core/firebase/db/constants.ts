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
  // PHÂN HỆ THỜI KHÓA BIỂU NHÀ TRƯỜNG (TEACHING SCHEDULE MODULE)
  // ============================================================================
  /** Thời khóa biểu nhà trường & phân công giảng dạy (School Timetables) */
  SCHOOL_TIMETABLES: 'school_timetables',

  // ============================================================================
  // PHÂN HỆ THÔNG BÁO & NHẮC NHỞ (NOTIFICATIONS & PUSH NOTIFICATIONS)
  // ============================================================================
  /** Cấu hình cài đặt nhắc nhở người dùng (Reminder Settings) */
  REMINDER_SETTINGS: 'reminder_settings',

  /** Danh sách token / đăng ký nhận Web Push Notification của thiết bị (Push Subscriptions) */
  PUSH_SUBSCRIPTIONS: 'push_subscriptions',

  // ============================================================================
  // PHÂN HỆ DU LỊCH & NGHỈ DƯỠNG (TRAVEL MODULE)
  // ============================================================================
  /** Danh sách chuyến đi, kế hoạch & album chia sẻ gia đình */
  TRAVEL_TRIPS: 'travel_trips',

  /** Nhật ký trải nghiệm & bài viết hành trình du lịch */
  TRAVEL_JOURNALS: 'travel_journals',

  /** Ngân sách & Hóa đơn chi tiêu du lịch */
  TRAVEL_EXPENSES: 'travel_expenses',

  /** Checklist hành lý & đồ đạc chuẩn bị */
  TRAVEL_CHECKLISTS: 'travel_checklists',

  /** Két giấy tờ du lịch, vé máy bay & voucher */
  TRAVEL_DOCUMENTS: 'travel_documents',

  // ============================================================================
  // PHÂN HỆ QUẢN LÝ CHI TIÊU ĐỜI SỐNG (SPENDING & EXPENSES MODULE)
  // ============================================================================
  /** Các khoản chi tiêu sinh hoạt, cá nhân & gia đình */
  EXPENSES: 'expenses',

  /** Hạn mức ngân sách chi tiêu theo tháng */
  EXPENSE_BUDGETS: 'expense_budgets',

  /** Danh mục chi tiêu tùy chỉnh của người dùng */
  EXPENSE_CATEGORIES: 'expense_categories',

  // ============================================================================
  // PHÂN HỆ TRỢ LÝ AI (AI ASSISTANT MODULE)
  // ============================================================================
  /** Danh sách phiên chat và lịch sử hội thoại AI đa thiết bị */
  AI_CHAT_SESSIONS: 'ai_chat_sessions',

  // ============================================================================
  // PHÂN HỆ THEO DÕI HOẠT ĐỘNG & XEM GẦN ĐÂY (ACTIVITY & RECENT VIEWS)
  // ============================================================================
  /** Danh sách nội dung đã xem gần đây (subcollection: users/{uid}/recentViews) */
  RECENT_VIEWS: 'recentViews',

  /** Nhật ký hoạt động người dùng (subcollection: users/{uid}/activityLogs) */
  ACTIVITY_LOGS: 'activityLogs',

  // ============================================================================
  // PHÂN HỆ SỨC KHỎE & THỂ CHẤT (HEALTH & BIOMETRICS MODULE)
  // ============================================================================
  /** Các chỉ số sinh học, cân nặng, huyết áp, đường huyết */
  HEALTH_METRICS: 'health_metrics',

  /** Hồ sơ khám chữa bệnh, kết quả xét nghiệm tổng hợp */
  HEALTH_RECORDS: 'health_records',

  /** Các đợt khám sức khỏe định kỳ & tổng thể */
  HEALTH_CHECKUPS: 'health_checkups',

  // ============================================================================
  // PHÂN HỆ DINH DƯỠNG & THỰC ĐƠN (NUTRITION & MEAL PLANNER MODULE)
  // ============================================================================
  /** Hồ sơ dinh dưỡng cá nhân & mục tiêu calo/macro */
  NUTRITION_PROFILES: 'nutrition_profiles',

  /** Kế hoạch thực đơn cá nhân hóa theo tuần/ngày */
  MEAL_PLANS: 'meal_plans',

  /** Nhật ký nước uống và ăn uống hàng ngày */
  DAILY_NUTRITION_LOGS: 'daily_nutrition_logs',

  // ============================================================================
  // PHÂN HỆ LỊCH TẬP THỂ CHẤT & WORKOUT (WORKOUT & FITNESS MODULE)
  // ============================================================================
  /** Hồ sơ thể lực, thói quen & mục tiêu tập luyện */
  WORKOUT_PROFILES: 'workout_profiles',

  /** Kế hoạch lịch tập tuần cá nhân hóa */
  WORKOUT_PLANS: 'workout_plans',

  /** Nhật ký hoàn thành buổi tập hàng ngày */
  DAILY_WORKOUT_LOGS: 'daily_workout_logs',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
