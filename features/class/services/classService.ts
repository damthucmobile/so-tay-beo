import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '@/core/firebase';
import {
  ClassEntity,
  ClassStudentEntity,
  SchedulePatternEntity,
  ClassSessionEntity,
  SessionStatus,
} from '../types';
import {
  getActiveStudentsOnDate,
  calculateSessionSalary,
} from '../utils/salaryCalculator';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';

/**
 * 1. LỚP HỌC (CLASSES)
 */
export async function saveClass(
  classData: Partial<ClassEntity>,
  userId: string
): Promise<string> {
  const db = getDb();
  const classesRef = collection(db, COLLECTIONS.CLASSES);
  const classId = classData.id || doc(classesRef).id;
  const now = new Date().toISOString();

  const entity: ClassEntity = {
    id: classId,
    userId,
    className: classData.className?.trim() || 'Lớp học mới',
    centerName: classData.centerName?.trim() || '',
    baseFeePerSession: Number(classData.baseFeePerSession) || 0,
    ratePerStudent: Number(classData.ratePerStudent) || 0,
    color: classData.color || '#3b82f6',
    description: classData.description || '',
    createdAt: classData.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.CLASSES, classId), entity, { merge: true });
  return classId;
}

export async function deleteClass(classId: string, userId: string): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  // Xóa document lớp
  batch.delete(doc(db, COLLECTIONS.CLASSES, classId));

  // Xóa các học sinh thuộc lớp
  const studentsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.CLASS_STUDENTS),
      where('userId', '==', userId),
      where('classId', '==', classId)
    )
  );
  studentsSnap.forEach((d) => batch.delete(d.ref));

  // Xóa lịch mẫu của lớp
  const patternsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.SCHEDULE_PATTERNS),
      where('userId', '==', userId),
      where('classId', '==', classId)
    )
  );
  patternsSnap.forEach((d) => batch.delete(d.ref));

  // Xóa các buổi học của lớp
  const sessionsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.CLASS_SESSIONS),
      where('userId', '==', userId),
      where('classId', '==', classId)
    )
  );
  sessionsSnap.forEach((d) => batch.delete(d.ref));

  await batch.commit();
}

/**
 * 2. HỌC SINH (STUDENTS)
 */
export async function saveStudent(
  studentData: Partial<ClassStudentEntity>,
  userId: string
): Promise<string> {
  const db = getDb();
  const studentsRef = collection(db, COLLECTIONS.CLASS_STUDENTS);
  const studentId = studentData.id || doc(studentsRef).id;
  const now = new Date().toISOString();

  const entity: ClassStudentEntity = {
    id: studentId,
    userId,
    classId: studentData.classId || '',
    fullName: studentData.fullName?.trim() || 'Học sinh mới',
    phoneNumber: studentData.phoneNumber?.trim() || '',
    parentName: studentData.parentName?.trim() || '',
    status: studentData.status || 'ACTIVE',
    joinedDate: studentData.joinedDate || format(new Date(), 'yyyy-MM-dd'),
    droppedDate: studentData.droppedDate || null,
    notes: studentData.notes || '',
    createdAt: studentData.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.CLASS_STUDENTS, studentId), entity, { merge: true });
  return studentId;
}

export async function markStudentDropped(
  studentId: string,
  droppedDate: string,
  userId: string
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.CLASS_STUDENTS, studentId), {
    status: 'DROPPED',
    droppedDate,
    updatedAt: new Date().toISOString(),
  });
}

export async function reactivateStudent(studentId: string, userId: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.CLASS_STUDENTS, studentId), {
    status: 'ACTIVE',
    droppedDate: null,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteStudent(studentId: string, userId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.CLASS_STUDENTS, studentId));
}

/**
 * 3. LỊCH MẪU ĐỊNH KỲ (SCHEDULE PATTERNS)
 */
export async function saveSchedulePatterns(
  classId: string,
  patterns: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  userId: string
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  // Xóa các pattern cũ của lớp này
  const oldPatternsSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.SCHEDULE_PATTERNS),
      where('userId', '==', userId),
      where('classId', '==', classId)
    )
  );
  oldPatternsSnap.forEach((d) => batch.delete(d.ref));

  // Ghi các pattern mới
  const now = new Date().toISOString();
  patterns.forEach((p) => {
    const patternRef = doc(collection(db, COLLECTIONS.SCHEDULE_PATTERNS));
    const entity: SchedulePatternEntity = {
      id: patternRef.id,
      userId,
      classId,
      dayOfWeek: p.dayOfWeek,
      startTime: p.startTime,
      endTime: p.endTime,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(patternRef, entity);
  });

  await batch.commit();
}

/**
 * 4. BUỔI HỌC & NHẬT KÝ DẠY (CLASS SESSIONS)
 */
export async function generateMonthlySessions(
  classId: string,
  monthStr: string, // 'YYYY-MM'
  patterns: SchedulePatternEntity[],
  students: ClassStudentEntity[],
  classItem: ClassEntity,
  userId: string
): Promise<number> {
  if (!patterns || patterns.length === 0) {
    throw new Error('Chưa thiết lập lịch định kỳ tuần cho lớp học này.');
  }

  const db = getDb();
  const monthDate = parseISO(`${monthStr}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const daysInMonth = eachDayOfInterval({ start, end });

  // Lấy các buổi học đã có trong tháng để tránh trùng lặp
  const existingSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.CLASS_SESSIONS),
      where('userId', '==', userId),
      where('classId', '==', classId)
    )
  );

  const existingDates = new Set(
    existingSnap.docs
      .map((d) => d.data() as ClassSessionEntity)
      .filter((s) => s.sessionDate.startsWith(monthStr))
      .map((s) => s.sessionDate)
  );

  const batch = writeBatch(db);
  let createdCount = 0;
  const now = new Date().toISOString();

  for (const day of daysInMonth) {
    const dayOfWeek = getDay(day); // 0 = CN, 1 = T2,...
    const dateStr = format(day, 'yyyy-MM-dd');

    const matchedPatterns = patterns.filter((p) => p.dayOfWeek === dayOfWeek);

    for (const pat of matchedPatterns) {
      if (!existingDates.has(dateStr)) {
        const headcount = getActiveStudentsOnDate(students, dateStr).length;
        const salary = calculateSessionSalary(
          classItem.baseFeePerSession,
          classItem.ratePerStudent,
          headcount
        );

        const sessionRef = doc(collection(db, COLLECTIONS.CLASS_SESSIONS));
        const sessionEntity: ClassSessionEntity = {
          id: sessionRef.id,
          userId,
          classId,
          sessionDate: dateStr,
          startTime: pat.startTime,
          endTime: pat.endTime,
          status: 'SCHEDULED',
          calculatedHeadcount: headcount,
          calculatedSalary: salary,
          lessonTopic: '',
          homework: '',
          notes: '',
          createdAt: now,
          updatedAt: now,
        };

        batch.set(sessionRef, sessionEntity);
        createdCount++;
        existingDates.add(dateStr);
      }
    }
  }

  if (createdCount > 0) {
    await batch.commit();
  }

  return createdCount;
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  userId: string
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTIONS.CLASS_SESSIONS, sessionId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function bulkUpdateSessionStatus(
  sessionIds: string[],
  status: SessionStatus,
  userId: string
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  sessionIds.forEach((sId) => {
    batch.update(doc(db, COLLECTIONS.CLASS_SESSIONS, sId), {
      status,
      updatedAt: now,
    });
  });

  await batch.commit();
}

export async function bulkDeleteSessions(
  sessionIds: string[],
  userId: string
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);

  sessionIds.forEach((sId) => {
    batch.delete(doc(db, COLLECTIONS.CLASS_SESSIONS, sId));
  });

  await batch.commit();
}

export async function saveSingleSession(
  sessionData: Partial<ClassSessionEntity>,
  userId: string
): Promise<void> {
  const db = getDb();
  const sessionRef = doc(db, COLLECTIONS.CLASS_SESSIONS, sessionData.id!);
  await updateDoc(sessionRef, {
    ...sessionData,
    updatedAt: new Date().toISOString(),
  });
}

export async function recalculateAllSessions(
  classItem: ClassEntity,
  students: ClassStudentEntity[],
  sessions: ClassSessionEntity[],
  userId: string
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  sessions.forEach((s) => {
    const headcount = getActiveStudentsOnDate(students, s.sessionDate).length;
    const salary = calculateSessionSalary(
      classItem.baseFeePerSession,
      classItem.ratePerStudent,
      headcount
    );

    batch.update(doc(db, COLLECTIONS.CLASS_SESSIONS, s.id), {
      calculatedHeadcount: headcount,
      calculatedSalary: salary,
      updatedAt: now,
    });
  });

  await batch.commit();
}

/**
 * 5. SEED DATA MẪU SINH ĐỘNG (DEMO PRESETS)
 */
export async function seedSampleClassData(userId: string): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  // Lớp 1: Toán 10 - Nâng Cao A1
  const class1Id = doc(collection(db, COLLECTIONS.CLASSES)).id;
  const class1: ClassEntity = {
    id: class1Id,
    userId,
    className: 'Toán 10 - Nâng Cao A1',
    centerName: 'Trung tâm Gia sư Khang Thịnh',
    baseFeePerSession: 200000,
    ratePerStudent: 30000,
    color: '#3b82f6',
    description: 'Luyện đề hình học không gian & đại số nâng cao',
    createdAt: now,
    updatedAt: now,
  };
  batch.set(doc(db, COLLECTIONS.CLASSES, class1Id), class1);

  // Lớp 2: Luyện Thi THPT QG - Chuyên Đề Hàm Số
  const class2Id = doc(collection(db, COLLECTIONS.CLASSES)).id;
  const class2: ClassEntity = {
    id: class2Id,
    userId,
    className: 'Luyện Thi THPT QG - Hàm Số',
    centerName: 'Lớp Học Online MathPro',
    baseFeePerSession: 250000,
    ratePerStudent: 35000,
    color: '#8b5cf6',
    description: 'Chuyên đề vận dụng cao 9+ môn Toán',
    createdAt: now,
    updatedAt: now,
  };
  batch.set(doc(db, COLLECTIONS.CLASSES, class2Id), class2);

  // Học sinh lớp 1
  const studentsClass1 = [
    { name: 'Nguyễn Hoàng Nam', phone: '0912345678', joined: `${currentMonthStr}-01` },
    { name: 'Trần Thị Mai Anh', phone: '0987654321', joined: `${currentMonthStr}-01` },
    { name: 'Lê Quốc Bảo', phone: '0905123987', joined: `${currentMonthStr}-05` },
    { name: 'Phạm Minh Quân', phone: '0978112233', joined: `${currentMonthStr}-10` },
  ];

  studentsClass1.forEach((st) => {
    const stRef = doc(collection(db, COLLECTIONS.CLASS_STUDENTS));
    batch.set(stRef, {
      id: stRef.id,
      userId,
      classId: class1Id,
      fullName: st.name,
      phoneNumber: st.phone,
      status: 'ACTIVE',
      joinedDate: st.joined,
      droppedDate: null,
      notes: 'Học sinh chăm chỉ, nắm chắc lý thuyết',
      createdAt: now,
      updatedAt: now,
    });
  });

  // Học sinh lớp 2
  const studentsClass2 = [
    { name: 'Đặng Thảo Vy', phone: '0934567890', joined: `${currentMonthStr}-01` },
    { name: 'Vũ Đức Huy', phone: '0945678901', joined: `${currentMonthStr}-02` },
    { name: 'Hoàng Yến Nhi', phone: '0967890123', joined: `${currentMonthStr}-03` },
  ];

  studentsClass2.forEach((st) => {
    const stRef = doc(collection(db, COLLECTIONS.CLASS_STUDENTS));
    batch.set(stRef, {
      id: stRef.id,
      userId,
      classId: class2Id,
      fullName: st.name,
      phoneNumber: st.phone,
      status: 'ACTIVE',
      joinedDate: st.joined,
      droppedDate: null,
      notes: 'Mục tiêu 9.5+ THPT',
      createdAt: now,
      updatedAt: now,
    });
  });

  // Lịch mẫu tuần lớp 1: Thứ 3 (dayOfWeek=2), Thứ 5 (dayOfWeek=4) từ 18:30 đến 20:30
  const p1Ref = doc(collection(db, COLLECTIONS.SCHEDULE_PATTERNS));
  batch.set(p1Ref, {
    id: p1Ref.id,
    userId,
    classId: class1Id,
    dayOfWeek: 2, // Thứ 3
    startTime: '18:30',
    endTime: '20:30',
    createdAt: now,
    updatedAt: now,
  });

  const p2Ref = doc(collection(db, COLLECTIONS.SCHEDULE_PATTERNS));
  batch.set(p2Ref, {
    id: p2Ref.id,
    userId,
    classId: class1Id,
    dayOfWeek: 4, // Thứ 5
    startTime: '18:30',
    endTime: '20:30',
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
}
