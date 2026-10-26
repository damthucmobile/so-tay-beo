'use client';

import React from 'react';
import { useAuth } from '@/core/firebase';
import { useClassManager } from './hooks/useClassManager';
import { ClassListPage } from './components/ClassListPage';
import { ClassDetailPage } from './components/ClassDetailPage';

export const ClassFeature: React.FC = () => {
  const { user } = useAuth();
  const {
    classes,
    studentsByClass,
    sessionsByClass,
    patternsByClass,
    selectedMonth,
    setSelectedMonth,
    selectedClassId,
    setSelectedClassId,
    isLoading,
    saveClass,
    deleteClass,
    saveStudent,
    markStudentDropped,
    reactivateStudent,
    deleteStudent,
    saveSchedulePatterns,
    generateMonthlySessions,
    updateSessionStatus,
    bulkUpdateSessionStatus,
    bulkDeleteSessions,
    saveSingleSession,
    recalculateSessions,
    seedDemo,
  } = useClassManager(user?.uid);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Đang đồng bộ dữ liệu lớp học thời gian thực...</p>
      </div>
    );
  }

  // Nếu đang chọn một lớp cụ thể -> Mở ClassDetailPage
  if (selectedClassId) {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (selectedClass) {
      return (
        <ClassDetailPage
          classItem={selectedClass}
          students={studentsByClass[selectedClassId] || []}
          sessions={sessionsByClass[selectedClassId] || []}
          patterns={patternsByClass[selectedClassId] || []}
          selectedMonth={selectedMonth}
          onBack={() => setSelectedClassId(null)}
          onSaveStudent={saveStudent}
          onMarkStudentDropped={markStudentDropped}
          onReactivateStudent={reactivateStudent}
          onDeleteStudent={deleteStudent}
          onSaveSchedulePatterns={saveSchedulePatterns}
          onGenerateMonthlySessions={generateMonthlySessions}
          onUpdateSessionStatus={updateSessionStatus}
          onBulkUpdateSessionStatus={bulkUpdateSessionStatus}
          onBulkDeleteSessions={bulkDeleteSessions}
          onSaveSingleSession={saveSingleSession}
          onRecalculateSessions={recalculateSessions}
        />
      );
    }
  }

  // Ngược lại -> Hiển thị ClassListPage
  return (
    <ClassListPage
      classes={classes}
      studentsByClass={studentsByClass}
      sessionsByClass={sessionsByClass}
      patternsByClass={patternsByClass}
      selectedMonth={selectedMonth}
      onSelectMonth={setSelectedMonth}
      onSelectClass={(cId) => setSelectedClassId(cId)}
      onSaveClass={saveClass}
      onDeleteClass={deleteClass}
      onSeedDemo={seedDemo}
      isLoading={isLoading}
    />
  );
};
