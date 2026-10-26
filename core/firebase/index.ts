// ==============================================================================
// ENTRYPOINT TỔNG HỢP TOÀN BỘ MODULE FIREBASE (AUTH + FIRESTORE DB)
// ==============================================================================

// Module Xác thực (Authentication)
export * from './auth';

// Module Cơ sở dữ liệu Firestore (Database)
export * from './db';

// Phân hệ Theo dõi Hoạt động & Xem gần đây (Activity Tracker & Recent Views)
export * from './tracking';

// Giải quyết trùng lặp tên biến 'db' được xuất từ cả 2 phân hệ
export { db } from './db';
