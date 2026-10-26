import { Timestamp } from 'firebase/firestore';

/**
 * Loại bỏ toàn bộ các trường `undefined` trong object trước khi gửi lên Firestore
 * (Vì Firestore SDK sẽ ném Exception nếu gặp giá trị undefined)
 */
export function cleanUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanUndefinedFields(item) : item)) as any;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Bỏ qua key có value undefined
    } else if (value !== null && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
      result[key] = cleanUndefinedFields(value);
    } else {
      result[key] = value;
    }
  }

  return result as Partial<T>;
}

/**
 * Chuyển đổi linh hoạt Timestamp / Date / Số mili-giây / Chuỗi ngày sang milliseconds
 */
export function parseTimestampToMs(val?: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === 'object' && val !== null) {
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.toDate === 'function') return val.toDate().getTime();
    if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  }
  return 0;
}

/**
 * Format Timestamp hoặc Date sang chuỗi hiển thị ngày giờ chuẩn Việt Nam (DD/MM/YYYY HH:mm)
 */
export function formatFirestoreTimestamp(val?: any, includeTime: boolean = true): string {
  const ms = parseTimestampToMs(val);
  if (!ms) return '';

  const date = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  if (!includeTime) {
    return `${day}/${month}/${year}`;
  }

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
