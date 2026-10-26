import {
  WhereFilterOp,
  OrderByDirection,
  DocumentSnapshot,
  Timestamp,
  FieldValue,
} from 'firebase/firestore';

/**
 * Thực thể cơ bản với các trường hệ thống
 */
export interface BaseEntity {
  id: string;
  createdAt?: Timestamp | Date | number | string | FieldValue;
  updatedAt?: Timestamp | Date | number | string | FieldValue;
  isDeleted?: boolean;
  deletedAt?: Timestamp | Date | number | string | null;
  [key: string]: any;
}

/**
 * Điều kiện lọc đơn lẻ
 */
export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * Tùy chọn sắp xếp
 */
export interface QueryOrderBy {
  field: string;
  direction?: OrderByDirection;
}

/**
 * Tùy chọn truy vấn Firestore tổng quát
 */
export interface QueryOptions {
  /** Danh sách bộ lọc WHERE */
  filters?: QueryFilter[];
  /** Sắp xếp theo trường */
  orderBy?: QueryOrderBy[];
  /** Giới hạn số lượng bản ghi trả về */
  limit?: number;
  /** Bắt đầu sau document snapshot này (phân trang cursor) */
  startAfter?: DocumentSnapshot;
}

/**
 * Thao tác Batch Write
 */
export type BatchOperation<T = any> =
  | { type: 'set'; collection: string; id: string; data: Partial<T>; merge?: boolean }
  | { type: 'update'; collection: string; id: string; data: Partial<T> }
  | { type: 'delete'; collection: string; id: string };

/**
 * Kết quả phân trang
 */
export interface PaginatedResult<T> {
  data: T[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  total?: number;
}
