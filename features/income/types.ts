import { ClassEntity, ClassStudentEntity, ClassSessionEntity } from '../class/types';

export type TimeFilterMode = 'month' | 'year' | 'custom';
export type IncomeTransactionStatus = 'Đã trả' | 'Chờ' | 'Đã hoàn thành';

/**
 * Giao dịch thu nhập (từ khách hàng cá nhân / gia sư 1-1 / dịch vụ ngoài)
 */
export interface IncomeTransaction {
  id: string;
  userId: string;
  clientName: string;
  serviceName: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  status: 'Đã trả' | 'Chờ';
  appointmentId?: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Mục thu nhập hợp nhất (Consolidated Item)
 */
export interface ConsolidatedIncomeItem {
  id: string;
  source: 'CLASS' | 'FREELANCE';
  sourceLabel: string;
  title: string;
  subtitle: string;
  date: string; // 'YYYY-MM-DD'
  amount: number;
  status: IncomeTransactionStatus;
  details: string;
  rawItem?: ClassSessionEntity | IncomeTransaction;
}

/**
 * Thống kê tổng hợp thù lao theo từng lớp học
 */
export interface ClassIncomeSummary {
  classId: string;
  className: string;
  centerName: string;
  color?: string;
  completedSessionsCount: number;
  totalSalaryInPeriod: number;
  baseFeePerSession: number;
  ratePerStudent: number;
}

/**
 * Kết quả phân tích & hợp nhất dòng tiền
 */
export interface IncomeConsolidationResult {
  totalEarned: number;
  classIncomeTotal: number;
  freelanceIncomeTotal: number;
  pendingIncomeTotal: number;
  consolidatedItems: ConsolidatedIncomeItem[];
  classSummaries: ClassIncomeSummary[];
  freelanceTransactions: IncomeTransaction[];
}
