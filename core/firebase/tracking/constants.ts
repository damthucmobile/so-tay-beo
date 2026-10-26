// ==============================================================================
// CẤU HÌNH HỆ THỐNG ACTIVITY TRACKER & RECENT VIEW
// ==============================================================================

/**
 * Thời gian bỏ qua lượt ghi trùng lặp (Throttling Window)
 * Trong vòng 5 phút (300,000ms), nếu user xem lại cùng 1 nội dung thì chỉ cập nhật local,
 * không gửi thêm write request lên Firestore để tiết kiệm chi phí tối đa.
 */
export const RECENT_VIEW_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Số lượng mục Recent View tối đa hiển thị trên giao diện
 */
export const DEFAULT_RECENT_VIEW_LIMIT = 20;

/**
 * Ngưỡng dọn dẹp mềm (Purge threshold): nếu vượt quá 50 thì dọn bớt
 */
export const MAX_STORED_RECENT_VIEWS = 50;

/**
 * Khoảng thời gian tự động xả hàng đợi Activity Log lên Firestore (Batch Flush)
 */
export const ACTIVITY_LOG_FLUSH_INTERVAL_MS = 10000; // 10 giây

/**
 * Số lượng sự kiện tối đa để lập tức flush hàng đợi không cần đợi timer
 */
export const ACTIVITY_LOG_MAX_BATCH_SIZE = 25;

/**
 * Key lưu Session ID trong sessionStorage
 */
export const SESSION_STORAGE_KEY = 'workscheduler_session_id';

/**
 * Key lưu cache danh sách Recent Views trong localStorage
 */
export const RECENT_VIEWS_LOCAL_CACHE_KEY = 'workscheduler_recent_views_cache';
