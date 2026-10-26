import { ClassEntity, ClassStudentEntity, ClassSessionEntity } from '../../class/types';
import {
  IncomeTransaction,
  TimeFilterMode,
  ConsolidatedIncomeItem,
  ClassIncomeSummary,
  IncomeConsolidationResult,
} from '../types';
import { getActiveStudentsOnDate, calculateSessionSalary } from '../../class/utils/salaryCalculator';

export function isDateInPeriod(
  dateStr: string, // 'YYYY-MM-DD' or ISO string
  filterMode: TimeFilterMode,
  selectedMonth: string, // 'YYYY-MM'
  selectedYear: string,  // 'YYYY'
  customStartDate: string, // 'YYYY-MM-DD'
  customEndDate: string   // 'YYYY-MM-DD'
): boolean {
  if (!dateStr) return false;
  const cleanDate = dateStr.slice(0, 10);

  if (filterMode === 'month') {
    return cleanDate.startsWith(selectedMonth);
  } else if (filterMode === 'year') {
    return cleanDate.startsWith(selectedYear);
  } else if (filterMode === 'custom') {
    return cleanDate >= customStartDate && cleanDate <= customEndDate;
  }
  return false;
}

export function consolidateAllIncome(
  classes: ClassEntity[],
  sessionsMap: Record<string, ClassSessionEntity[]>,
  studentsMap: Record<string, ClassStudentEntity[]>,
  transactions: IncomeTransaction[],
  filterMode: TimeFilterMode,
  selectedMonth: string,
  selectedYear: string,
  customStartDate: string,
  customEndDate: string
): IncomeConsolidationResult {
  const consolidatedItems: ConsolidatedIncomeItem[] = [];
  const classSummaries: ClassIncomeSummary[] = [];

  let classIncomeTotal = 0;
  let freelanceIncomeTotal = 0;
  let pendingIncomeTotal = 0;

  // 1. Xử lý Thù lao từ Lớp học Online (Class Sessions)
  classes.forEach((cls) => {
    const sessions = sessionsMap[cls.id] || [];
    const students = studentsMap[cls.id] || [];
    let classCompletedCount = 0;
    let classSalaryTotal = 0;

    sessions.forEach((sess) => {
      if (
        isDateInPeriod(
          sess.sessionDate,
          filterMode,
          selectedMonth,
          selectedYear,
          customStartDate,
          customEndDate
        )
      ) {
        if (sess.status === 'COMPLETED') {
          classCompletedCount += 1;
          const activeSts = getActiveStudentsOnDate(students, sess.sessionDate);
          const headcount = activeSts.length;
          const sessionSalary = calculateSessionSalary(cls.baseFeePerSession, cls.ratePerStudent, headcount);

          classSalaryTotal += sessionSalary;

          consolidatedItems.push({
            id: `class_sess_${sess.id}`,
            source: 'CLASS',
            sourceLabel: 'Lớp học Online',
            title: cls.className,
            subtitle: cls.centerName || 'Lớp độc lập / Gia sư',
            date: sess.sessionDate,
            amount: sessionSalary,
            status: 'Đã hoàn thành',
            details: `Sỹ số ${headcount} HS (${cls.baseFeePerSession.toLocaleString('vi-VN')} đ cố định + ${cls.ratePerStudent.toLocaleString('vi-VN')} đ/HS)`,
            rawItem: sess,
          });
        }
      }
    });

    classIncomeTotal += classSalaryTotal;
    classSummaries.push({
      classId: cls.id,
      className: cls.className,
      centerName: cls.centerName || 'Lớp độc lập / Gia sư',
      color: cls.color,
      completedSessionsCount: classCompletedCount,
      totalSalaryInPeriod: classSalaryTotal,
      baseFeePerSession: cls.baseFeePerSession,
      ratePerStudent: cls.ratePerStudent,
    });
  });

  // 2. Xử lý Thu nhập từ Lịch tự do & Khách hàng 1-1 (Freelance Transactions)
  const periodTransactions = transactions.filter((tx) =>
    isDateInPeriod(
      tx.date,
      filterMode,
      selectedMonth,
      selectedYear,
      customStartDate,
      customEndDate
    )
  );

  periodTransactions.forEach((tx) => {
    if (tx.status === 'Đã trả') {
      freelanceIncomeTotal += tx.amount || 0;
    } else {
      pendingIncomeTotal += tx.amount || 0;
    }

    consolidatedItems.push({
      id: `freelance_tx_${tx.id}`,
      source: 'FREELANCE',
      sourceLabel: 'Lịch tự do 1-1',
      title: tx.clientName || 'Giao dịch',
      subtitle: tx.serviceName || '',
      date: (tx.date || '').slice(0, 10),
      amount: tx.amount || 0,
      status: tx.status || 'Chờ',
      details: tx.serviceName || 'Dịch vụ cá nhân / Dạy kèm 1-1',
      rawItem: tx,
    });
  });

  // Sắp xếp items theo ngày mới nhất trước
  consolidatedItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalEarned = classIncomeTotal + freelanceIncomeTotal;

  return {
    totalEarned,
    classIncomeTotal,
    freelanceIncomeTotal,
    pendingIncomeTotal,
    consolidatedItems,
    classSummaries,
    freelanceTransactions: periodTransactions,
  };
}
