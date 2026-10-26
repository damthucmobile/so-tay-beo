'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  IncomeTransaction,
  TimeFilterMode,
} from '../types';
import {
  subscribeToIncomeTransactions,
  saveIncomeTransaction,
  deleteIncomeTransaction,
  markTransactionAsPaid,
  cleanDuplicateTransactions,
} from '../services/incomeService';

export function useIncomeManager(userId: string | undefined) {
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Ngày hiện tại
  const now = useMemo(() => new Date(), []);
  const currentMonthStr = useMemo(() => format(now, 'yyyy-MM'), [now]);
  const currentYearStr = useMemo(() => format(now, 'yyyy'), [now]);
  const currentMonthStartStr = useMemo(() => format(startOfMonth(now), 'yyyy-MM-dd'), [now]);
  const currentMonthEndStr = useMemo(() => format(endOfMonth(now), 'yyyy-MM-dd'), [now]);

  // Bộ lọc thời gian 3 chế độ: 'month' | 'year' | 'custom'
  const [filterMode, setFilterMode] = useState<TimeFilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [customStartDate, setCustomStartDate] = useState(currentMonthStartStr);
  const [customEndDate, setCustomEndDate] = useState(currentMonthEndStr);

  // Lắng nghe Realtime Firestore
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToIncomeTransactions(
      userId,
      (list) => {
        setTransactions(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Thêm / sửa giao dịch
  const addTransaction = useCallback(
    async (txData: Partial<IncomeTransaction>) => {
      if (!userId) return '';
      return await saveIncomeTransaction(txData, userId);
    },
    [userId]
  );

  // Xóa giao dịch
  const deleteTransaction = useCallback(async (id: string) => {
    await deleteIncomeTransaction(id);
  }, []);

  // Đánh dấu đã trả
  const markAsPaid = useCallback(async (id: string) => {
    await markTransactionAsPaid(id);
  }, []);

  // Làm sạch trùng
  const cleanDuplicates = useCallback(async () => {
    const count = await cleanDuplicateTransactions(transactions);
    return count;
  }, [transactions]);

  return {
    transactions,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    addTransaction,
    deleteTransaction,
    markAsPaid,
    cleanDuplicates,
  };
}
