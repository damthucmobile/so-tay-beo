'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '@/core/firebase';
import {
  ClassEntity,
  ClassStudentEntity,
  SchedulePatternEntity,
  ClassSessionEntity,
  SessionStatus,
} from '../types';
import * as classService from '../services/classService';
import { format } from 'date-fns';

export function useClassManager(userId?: string | null) {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<ClassStudentEntity[]>([]);
  const [schedulePatterns, setSchedulePatterns] = useState<SchedulePatternEntity[]>([]);
  const [sessions, setSessions] = useState<ClassSessionEntity[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Lắng nghe Realtime từ Cloud Firestore khi có userId
  useEffect(() => {
    if (!userId) {
      setClasses([]);
      setStudents([]);
      setSchedulePatterns([]);
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const db = getDb();

    // 1. Classes
    const qClasses = query(collection(db, COLLECTIONS.CLASSES), where('userId', '==', userId));
    const unsubClasses = onSnapshot(
      qClasses,
      (snapshot) => {
        const list: ClassEntity[] = snapshot.docs.map((d) => d.data() as ClassEntity);
        setClasses(list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
        setIsLoading(false);
      },
      (err) => {
        console.error('Lỗi tải classes:', err);
        setIsLoading(false);
      }
    );

    // 2. Students
    const qStudents = query(collection(db, COLLECTIONS.CLASS_STUDENTS), where('userId', '==', userId));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const list: ClassStudentEntity[] = snapshot.docs.map((d) => d.data() as ClassStudentEntity);
      setStudents(list);
    });

    // 3. Patterns
    const qPatterns = query(collection(db, COLLECTIONS.SCHEDULE_PATTERNS), where('userId', '==', userId));
    const unsubPatterns = onSnapshot(qPatterns, (snapshot) => {
      const list: SchedulePatternEntity[] = snapshot.docs.map((d) => d.data() as SchedulePatternEntity);
      setSchedulePatterns(list);
    });

    // 4. Sessions
    const qSessions = query(collection(db, COLLECTIONS.CLASS_SESSIONS), where('userId', '==', userId));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      const list: ClassSessionEntity[] = snapshot.docs.map((d) => d.data() as ClassSessionEntity);
      setSessions(list);
    });

    return () => {
      unsubClasses();
      unsubStudents();
      unsubPatterns();
      unsubSessions();
    };
  }, [userId]);

  // Maps gom nhóm theo classId để truy xuất O(1)
  const studentsByClass = useMemo(() => {
    const map: Record<string, ClassStudentEntity[]> = {};
    students.forEach((s) => {
      if (!map[s.classId]) map[s.classId] = [];
      map[s.classId].push(s);
    });
    return map;
  }, [students]);

  const patternsByClass = useMemo(() => {
    const map: Record<string, SchedulePatternEntity[]> = {};
    schedulePatterns.forEach((p) => {
      if (!map[p.classId]) map[p.classId] = [];
      map[p.classId].push(p);
    });
    return map;
  }, [schedulePatterns]);

  const sessionsByClass = useMemo(() => {
    const map: Record<string, ClassSessionEntity[]> = {};
    sessions.forEach((s) => {
      if (!map[s.classId]) map[s.classId] = [];
      map[s.classId].push(s);
    });
    return map;
  }, [sessions]);

  // Các actions gọi classService
  const handleSaveClass = async (classData: Partial<ClassEntity>) => {
    if (!userId) return '';
    return await classService.saveClass(classData, userId);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!userId) return;
    await classService.deleteClass(classId, userId);
    if (selectedClassId === classId) {
      setSelectedClassId(null);
    }
  };

  const handleSaveStudent = async (studentData: Partial<ClassStudentEntity>) => {
    if (!userId) return '';
    return await classService.saveStudent(studentData, userId);
  };

  const handleMarkStudentDropped = async (studentId: string, droppedDate: string) => {
    if (!userId) return;
    await classService.markStudentDropped(studentId, droppedDate, userId);
  };

  const handleReactivateStudent = async (studentId: string) => {
    if (!userId) return;
    await classService.reactivateStudent(studentId, userId);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!userId) return;
    await classService.deleteStudent(studentId, userId);
  };

  const handleSaveSchedulePatterns = async (
    classId: string,
    patterns: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ) => {
    if (!userId) return;
    await classService.saveSchedulePatterns(classId, patterns, userId);
  };

  const handleGenerateMonthlySessions = async (classId: string, monthStr: string) => {
    if (!userId) return 0;
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) throw new Error('Không tìm thấy lớp học');
    const classPatterns = patternsByClass[classId] || [];
    const classStudents = studentsByClass[classId] || [];

    return await classService.generateMonthlySessions(
      classId,
      monthStr,
      classPatterns,
      classStudents,
      targetClass,
      userId
    );
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: SessionStatus) => {
    if (!userId) return;
    await classService.updateSessionStatus(sessionId, status, userId);
  };

  const handleBulkUpdateSessionStatus = async (sessionIds: string[], status: SessionStatus) => {
    if (!userId) return;
    await classService.bulkUpdateSessionStatus(sessionIds, status, userId);
  };

  const handleBulkDeleteSessions = async (sessionIds: string[]) => {
    if (!userId) return;
    await classService.bulkDeleteSessions(sessionIds, userId);
  };

  const handleSaveSingleSession = async (sessionData: Partial<ClassSessionEntity>) => {
    if (!userId) return;
    await classService.saveSingleSession(sessionData, userId);
  };

  const handleRecalculateSessions = async (classId: string) => {
    if (!userId) return;
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;
    const classStudents = studentsByClass[classId] || [];
    const classSessions = sessionsByClass[classId] || [];
    await classService.recalculateAllSessions(targetClass, classStudents, classSessions, userId);
  };

  const handleSeedDemo = async () => {
    if (!userId) return;
    await classService.seedSampleClassData(userId);
  };

  return {
    classes,
    students,
    schedulePatterns,
    sessions,
    studentsByClass,
    patternsByClass,
    sessionsByClass,
    selectedMonth,
    setSelectedMonth,
    selectedClassId,
    setSelectedClassId,
    isLoading,
    saveClass: handleSaveClass,
    deleteClass: handleDeleteClass,
    saveStudent: handleSaveStudent,
    markStudentDropped: handleMarkStudentDropped,
    reactivateStudent: handleReactivateStudent,
    deleteStudent: handleDeleteStudent,
    saveSchedulePatterns: handleSaveSchedulePatterns,
    generateMonthlySessions: handleGenerateMonthlySessions,
    updateSessionStatus: handleUpdateSessionStatus,
    bulkUpdateSessionStatus: handleBulkUpdateSessionStatus,
    bulkDeleteSessions: handleBulkDeleteSessions,
    saveSingleSession: handleSaveSingleSession,
    recalculateSessions: handleRecalculateSessions,
    seedDemo: handleSeedDemo,
  };
}
