'use client';

import React from 'react';
import { useAuth } from '@/core/firebase';
import { useClassManager } from '../class/hooks/useClassManager';
import { useIncomeManager } from './hooks/useIncomeManager';
import { IncomePage } from './components/IncomePage';

export const IncomeFeature: React.FC = () => {
  const { user } = useAuth();

  // Dữ liệu Lớp học, Buổi học, Học sinh
  const {
    classes,
    sessionsByClass,
    studentsByClass,
    isLoading: isClassesLoading,
  } = useClassManager(user?.uid);

  // Dữ liệu Giao dịch Thu nhập
  const {
    transactions,
    isLoading: isIncomeLoading,
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
  } = useIncomeManager(user?.uid);

  return (
    <IncomePage
      classes={classes}
      sessionsByClass={sessionsByClass}
      studentsByClass={studentsByClass}
      transactions={transactions}
      isLoading={isClassesLoading || isIncomeLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filterMode={filterMode}
      onFilterModeChange={setFilterMode}
      selectedMonth={selectedMonth}
      onSelectMonth={setSelectedMonth}
      selectedYear={selectedYear}
      onSelectYear={setSelectedYear}
      customStartDate={customStartDate}
      onCustomStartDateChange={setCustomStartDate}
      customEndDate={customEndDate}
      onCustomEndDateChange={setCustomEndDate}
      onAddTransaction={addTransaction}
      onDeleteTransaction={deleteTransaction}
      onMarkAsPaid={markAsPaid}
      onCleanDuplicates={cleanDuplicates}
    />
  );
};
