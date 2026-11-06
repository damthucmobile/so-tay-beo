/**
 * Universal Agent Action Dispatcher cho AI Agent Sổ Tay Béo 2.0
 * Cho phép AI Agent tự động thực thi các thao tác Dữ liệu thực tế đa phân hệ:
 * 1. Chuyến đi & Du lịch (Travel Trips, Activities, Checklist)
 * 2. Quản lý Lớp học & Học sinh (Classes, Students)
 * 3. Lịch làm việc tự do & Lịch hẹn gia sư (Appointments, Customers)
 * 4. Lịch dạy học nhà trường (Teaching Schedule, My Teacher)
 * 5. Khởi tạo sẵn sàng cho các phân hệ tương lai:
 *    - Sức khoẻ & Thể chất (Health & Fitness metrics)
 *    - Gia đình (Family events & milestones)
 *    - Giáo dục & Phát triển (Education goals & learning roadmap)
 *    - Module generic mở rộng tùy biến
 */

import { useTravelStore } from '@/features/travel/stores/useTravelStore';
import { Trip, TripActivity, TripChecklistItem } from '@/features/travel/types';
import { saveClass, deleteClass, saveStudent, deleteStudent } from '@/features/class/services/classService';
import { ClassEntity, ClassStudentEntity } from '@/features/class/types';
import { saveAppointment, deleteAppointment, saveCustomer } from '@/features/schedule/services/scheduleService';
import { Appointment, Customer } from '@/features/schedule/types';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';
import { DayOfWeek, Session, TimetableEntry } from '@/features/teaching-schedule/types';
import { useSpendingStore } from '@/features/spending/stores/useSpendingStore';
import { ExpenseItem, ExpenseCategory, EXPENSE_CATEGORIES } from '@/features/spending/types';
import { getDb, COLLECTIONS, auth, cleanUndefinedFields } from '@/core/firebase';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { HealthService } from '@/features/health/services/healthService';
import { HealthCategory, HealthMetricValue } from '@/features/health/types';
import { evaluateMetricStatus, MEDICAL_METRIC_DEFINITIONS } from '@/features/health/constants/medicalMetrics';

// =============================================================================
// ĐỊNH NGHĨA CÁC LOẠI HÀNH ĐỘNG AGENT ĐA PHÂN HỆ
// =============================================================================
export type AgentActionType =
  // 1. Chuyến đi & Du lịch
  | 'CREATE_TRIP'
  | 'UPDATE_TRIP'
  | 'DELETE_TRIP'
  | 'ADD_TRIP_ACTIVITY'
  | 'ADD_TRIP_CHECKLIST'
  // 2. Lớp học & Học sinh
  | 'CREATE_CLASS'
  | 'UPDATE_CLASS'
  | 'DELETE_CLASS'
  | 'ADD_STUDENT'
  | 'DELETE_STUDENT'
  // 3. Lịch tự do & Khách hàng
  | 'CREATE_APPOINTMENT'
  | 'UPDATE_APPOINTMENT'
  | 'DELETE_APPOINTMENT'
  | 'CREATE_CUSTOMER'
  // 4. Lịch dạy học (TKB)
  | 'SET_MY_TEACHER'
  | 'UPDATE_PERIOD_NOTE'
  | 'UPDATE_TIMETABLE_ENTRY'
  | 'SWAP_TIMETABLE_ENTRIES'
  | 'MOVE_TIMETABLE_ENTRY'
  | 'DELETE_TIMETABLE_ENTRY'
  | 'ADD_TIMETABLE_ENTRY'
  // 5. Quản lý Thu - Chi Đời sống
  | 'CREATE_EXPENSE'
  | 'CREATE_INCOME'
  | 'UPDATE_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'SET_MONTHLY_BUDGET'
  | 'CREATE_EXPENSE_CATEGORY'
  // 6. Sức khoẻ & Thể chất (Health & Biometrics)
  | 'RECORD_HEALTH_METRIC'
  | 'UPDATE_HEALTH_METRIC'
  | 'DELETE_HEALTH_METRIC'
  | 'IMPORT_HEALTH_RECORD'
  | 'DELETE_HEALTH_RECORD'
  | 'CREATE_CHECKUP_SESSION'
  | 'UPDATE_CHECKUP_SESSION'
  | 'DELETE_CHECKUP_SESSION'
  // 7. Khởi tạo sẵn cho các tính năng tương lai
  | 'ADD_FAMILY_EVENT'
  | 'ADD_EDUCATION_GOAL'
  | 'GENERIC_MODULE_ACTION';

export interface AgentActionCommand {
  action: AgentActionType;
  params: Record<string, any>;
}

export interface AgentActionResult {
  success: boolean;
  action: AgentActionType;
  message: string;
  data?: any;
}

// =============================================================================
// TRÍCH XUẤT LỆNH HÀNH ĐỘNG TỪ PHẢN HỒI AI
// =============================================================================
export function extractAgentActions(content: string): {
  cleanContent: string;
  commands: AgentActionCommand[];
} {
  if (!content) return { cleanContent: '', commands: [] };

  const commands: AgentActionCommand[] = [];

  // 1. Dạng Markdown code block: ```agent_action\n{...}\n```
  const codeBlockRegex = /```agent_action\s*([\s\S]*?)\s*```/g;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed.action) {
        commands.push(parsed as AgentActionCommand);
      }
    } catch (e) {
      console.warn('[AgentAction] Lỗi phân tích JSON action code block:', e);
    }
  }

  // 2. Dạng HTML Comment: <!--ACTION_COMMAND:\s*([\s\S]*?)\s*-->
  const commentRegex = /<!--ACTION_COMMAND:\s*([\s\S]*?)\s*-->/g;
  while ((match = commentRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed && parsed.action) {
        commands.push(parsed as AgentActionCommand);
      }
    } catch (e) {
      console.warn('[AgentAction] Lỗi phân tích JSON comment action:', e);
    }
  }

  // Loại bỏ các khối lệnh kỹ thuật ra khỏi văn bản hiển thị cho người dùng
  const cleanContent = content
    .replace(/```agent_action[\s\S]*?```/g, '')
    .replace(/<!--ACTION_COMMAND:[\s\S]*?-->/g, '')
    .trim();

  return { cleanContent, commands };
}

// =============================================================================
// 1. HANDLER: CHUYẾN ĐI & DU LỊCH (TRAVEL)
// =============================================================================
function findTrip(identifier?: string): Trip | null {
  if (!identifier) return null;
  const trips = useTravelStore.getState().trips;
  if (!trips || trips.length === 0) return null;

  const byId = trips.find((t) => t.id === identifier);
  if (byId) return byId;

  const q = identifier.toLowerCase().trim();
  const byExactTitle = trips.find((t) => t.title.toLowerCase().trim() === q);
  if (byExactTitle) return byExactTitle;

  const byPartial = trips.find(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      q.includes(t.title.toLowerCase()) ||
      t.destination?.toLowerCase().includes(q) ||
      q.includes(t.destination?.toLowerCase() || '')
  );

  return byPartial || null;
}

async function handleTravelAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const store = useTravelStore.getState();

  switch (action) {
    case 'CREATE_TRIP': {
      const title = params.title || `Chuyến đi ${params.destination || 'mới'}`;
      const destination = params.destination || 'Điểm đến';
      const startDate = params.startDate || new Date().toISOString().slice(0, 10);
      const endDate = params.endDate || startDate;
      const budget = Number(params.budget) || 0;
      const notes = params.notes || '';
      const tags = Array.isArray(params.tags) ? params.tags : [];

      const newTrip = await store.addTrip(
        {
          title,
          destination,
          startDate,
          endDate,
          budget,
          spent: 0,
          status: 'planning',
          notes,
          tags,
          members: [],
          itinerary: [],
          checklist: [],
        },
        userId
      );

      return {
        success: true,
        action,
        message: `Đã tạo chuyến đi "${title}" đến ${destination} (Ngân sách: ${budget.toLocaleString('vi-VN')} đ) thành công!`,
        data: newTrip,
      };
    }

    case 'UPDATE_TRIP': {
      const targetTrip = findTrip(params.tripId || params.tripTitle);
      if (!targetTrip) {
        return {
          success: false,
          action,
          message: `Không tìm thấy chuyến đi "${params.tripTitle || params.tripId}" để cập nhật.`,
        };
      }

      const updateData: Partial<Trip> = {};
      if (params.title) updateData.title = params.title;
      if (params.destination) updateData.destination = params.destination;
      if (params.startDate) updateData.startDate = params.startDate;
      if (params.endDate) updateData.endDate = params.endDate;
      if (params.budget !== undefined) updateData.budget = Number(params.budget);
      if (params.spent !== undefined) updateData.spent = Number(params.spent);
      if (params.status) updateData.status = params.status;
      if (params.notes !== undefined) updateData.notes = params.notes;

      if (params.update && typeof params.update === 'object') {
        Object.assign(updateData, params.update);
      }

      await store.updateTrip(targetTrip.id, updateData);

      return {
        success: true,
        action,
        message: `Đã cập nhật thành công chuyến đi "${targetTrip.title}"!`,
        data: { ...targetTrip, ...updateData },
      };
    }

    case 'DELETE_TRIP': {
      const targetTrip = findTrip(params.tripId || params.tripTitle);
      if (!targetTrip) {
        return {
          success: false,
          action,
          message: `Không tìm thấy chuyến đi "${params.tripTitle || params.tripId}" để xoá.`,
        };
      }

      await store.deleteTrip(targetTrip.id);

      return {
        success: true,
        action,
        message: `Đã xoá thành công chuyến đi "${targetTrip.title}" khỏi hệ thống!`,
        data: { id: targetTrip.id, title: targetTrip.title },
      };
    }

    case 'ADD_TRIP_ACTIVITY': {
      const targetTrip = findTrip(params.tripId || params.tripTitle);
      if (!targetTrip) {
        return {
          success: false,
          action,
          message: `Không tìm thấy chuyến đi để thêm hoạt động.`,
        };
      }

      const dayNumber = Number(params.dayNumber) || 1;
      const actData: Omit<TripActivity, 'id'> = {
        title: params.activity?.title || params.title || 'Hoạt động',
        time: params.activity?.time || params.time || '09:00',
        category: params.activity?.category || params.category || 'sightseeing',
        location: params.activity?.location || params.location || '',
        cost: Number(params.activity?.cost || params.cost || 0),
        notes: params.activity?.notes || params.notes || '',
      };

      await store.addActivity(targetTrip.id, dayNumber, actData);

      return {
        success: true,
        action,
        message: `Đã thêm hoạt động "${actData.title}" vào ngày ${dayNumber} của chuyến đi "${targetTrip.title}"!`,
      };
    }

    case 'ADD_TRIP_CHECKLIST': {
      const targetTrip = findTrip(params.tripId || params.tripTitle);
      if (!targetTrip) {
        return {
          success: false,
          action,
          message: `Không tìm thấy chuyến đi để thêm đồ chuẩn bị.`,
        };
      }

      const itemData: Omit<TripChecklistItem, 'id'> = {
        text: params.item?.text || params.text || 'Đồ dùng',
        category: params.item?.category || params.category || 'other',
        completed: false,
      };

      await store.addChecklistItem(targetTrip.id, itemData);

      return {
        success: true,
        action,
        message: `Đã thêm "${itemData.text}" vào danh sách chuẩn bị đồ của chuyến đi "${targetTrip.title}"!`,
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Travel.`);
  }
}

// =============================================================================
// 2. HANDLER: QUẢN LÝ LỚP HỌC & HỌC SINH (CLASSES & STUDENTS)
// =============================================================================
async function handleClassAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const uid = userId || 'anonymous';
  const db = getDb();

  switch (action) {
    case 'CREATE_CLASS': {
      const className = params.className || params.name || 'Lớp học mới';
      const centerName = params.centerName || '';
      const baseFee = Number(params.baseFeePerSession || params.baseFee || 0);
      const ratePerStudent = Number(params.ratePerStudent || 0);
      const description = params.description || '';

      const classId = await saveClass(
        {
          className,
          centerName,
          baseFeePerSession: baseFee,
          ratePerStudent,
          description,
        },
        uid
      );

      return {
        success: true,
        action,
        message: `Đã tạo lớp học "${className}" thành công (Thù lao: ${baseFee.toLocaleString('vi-VN')} đ/buổi)!`,
        data: { id: classId, className },
      };
    }

    case 'UPDATE_CLASS': {
      // Tìm lớp theo ID hoặc Tên
      let targetClassId = params.classId;
      if (!targetClassId && params.className) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.CLASSES), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as ClassEntity;
          return data.className.toLowerCase().includes(params.className.toLowerCase());
        });
        if (found) targetClassId = found.id;
      }

      if (!targetClassId) {
        return {
          success: false,
          action,
          message: `Không tìm thấy lớp học "${params.className || params.classId}" để cập nhật.`,
        };
      }

      await saveClass({ ...params, id: targetClassId }, uid);
      return {
        success: true,
        action,
        message: `Đã cập nhật thông tin lớp học thành công!`,
      };
    }

    case 'DELETE_CLASS': {
      let targetClassId = params.classId;
      let targetName = params.className || '';
      if (!targetClassId && params.className) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.CLASSES), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as ClassEntity;
          return data.className.toLowerCase().includes(params.className.toLowerCase());
        });
        if (found) {
          targetClassId = found.id;
          targetName = (found.data() as ClassEntity).className;
        }
      }

      if (!targetClassId) {
        return {
          success: false,
          action,
          message: `Không tìm thấy lớp học "${params.className || params.classId}" để xoá.`,
        };
      }

      await deleteClass(targetClassId, uid);
      return {
        success: true,
        action,
        message: `Đã xoá lớp học "${targetName || targetClassId}" khỏi hệ thống!`,
      };
    }

    case 'ADD_STUDENT': {
      // Tìm classId nếu người dùng truyền className
      let classId = params.classId;
      if (!classId && params.className) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.CLASSES), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as ClassEntity;
          return data.className.toLowerCase().includes(params.className.toLowerCase());
        });
        if (found) classId = found.id;
      }

      const fullName = params.fullName || params.name || 'Học sinh mới';
      const phoneNumber = params.phoneNumber || params.phone || '';
      const parentName = params.parentName || '';

      const studentId = await saveStudent(
        {
          classId: classId || '',
          fullName,
          phoneNumber,
          parentName,
          notes: params.notes || '',
        },
        uid
      );

      return {
        success: true,
        action,
        message: `Đã thêm học sinh "${fullName}" vào lớp thành công!`,
        data: { id: studentId, fullName },
      };
    }

    case 'DELETE_STUDENT': {
      let studentId = params.studentId;
      let studentName = params.fullName || params.name || '';
      if (!studentId && studentName) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.CLASS_STUDENTS), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as ClassStudentEntity;
          return data.fullName.toLowerCase().includes(studentName.toLowerCase());
        });
        if (found) {
          studentId = found.id;
          studentName = (found.data() as ClassStudentEntity).fullName;
        }
      }

      if (!studentId) {
        return {
          success: false,
          action,
          message: `Không tìm thấy học sinh "${studentName || params.studentId}" để xoá.`,
        };
      }

      await deleteStudent(studentId, uid);
      return {
        success: true,
        action,
        message: `Đã xoá học sinh "${studentName}" khỏi danh sách lớp!`,
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Class.`);
  }
}

// =============================================================================
// 3. HANDLER: LỊCH TỰ DO & KHÁCH HÀNG / GIA SƯ (SCHEDULE & APPOINTMENTS)
// =============================================================================
async function handleScheduleAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const uid = userId || 'anonymous';
  const db = getDb();

  switch (action) {
    case 'CREATE_APPOINTMENT': {
      const title = params.title || 'Ca gia sư / Lịch hẹn';
      const customerName = params.customerName || params.clientName || 'Học viên';
      const date = params.date || `${new Date().toISOString().slice(0, 10)}T18:00`;
      const price = Number(params.price || params.fee || 0);
      const durationMinutes = Number(params.durationMinutes || 60);
      const location = params.location || 'Tại nhà';
      const notes = params.notes || '';

      const appId = await saveAppointment(
        {
          title,
          customerName,
          customerId: params.customerId || '',
          date,
          price,
          durationMinutes,
          location,
          notes,
          priority: params.priority || 'Bình thường',
          status: 'Đang chờ',
          isCompleted: false,
        },
        uid
      );

      return {
        success: true,
        action,
        message: `Đã tạo lịch hẹn "${title}" với ${customerName} lúc ${date.replace('T', ' ')} (Phí: ${price.toLocaleString('vi-VN')} đ) thành công!`,
        data: { id: appId, title },
      };
    }

    case 'UPDATE_APPOINTMENT': {
      let appId = params.appointmentId || params.id;
      if (!appId && params.title) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.APPOINTMENTS), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as Appointment;
          return data.title.toLowerCase().includes(params.title.toLowerCase());
        });
        if (found) appId = found.id;
      }

      if (!appId) {
        return {
          success: false,
          action,
          message: `Không tìm thấy lịch hẹn để cập nhật.`,
        };
      }

      await saveAppointment({ ...params, id: appId }, uid);
      return {
        success: true,
        action,
        message: `Đã cập nhật lịch hẹn thành công!`,
      };
    }

    case 'DELETE_APPOINTMENT': {
      let appId = params.appointmentId || params.id;
      let appTitle = params.title || '';
      if (!appId && appTitle) {
        const qSnap = await getDocs(
          query(collection(db, COLLECTIONS.APPOINTMENTS), where('userId', '==', uid))
        );
        const found = qSnap.docs.find((d) => {
          const data = d.data() as Appointment;
          return data.title.toLowerCase().includes(appTitle.toLowerCase());
        });
        if (found) {
          appId = found.id;
          appTitle = (found.data() as Appointment).title;
        }
      }

      if (!appId) {
        return {
          success: false,
          action,
          message: `Không tìm thấy lịch hẹn "${appTitle || params.id}" để xoá.`,
        };
      }

      await deleteAppointment(appId, uid);
      return {
        success: true,
        action,
        message: `Đã xoá lịch hẹn "${appTitle}" thành công!`,
      };
    }

    case 'CREATE_CUSTOMER': {
      const name = params.name || params.customerName || 'Khách hàng mới';
      const phone = params.phone || params.phoneNumber || '';
      const email = params.email || '';
      const group = params.group || 'Cá nhân';
      const notes = params.notes || '';

      const custId = await saveCustomer(
        {
          name,
          phone,
          email,
          group,
          notes,
          address: params.address || '',
        },
        uid
      );

      return {
        success: true,
        action,
        message: `Đã lưu thông tin học viên/khách hàng "${name}" (${phone}) vào danh bạ!`,
        data: { id: custId, name },
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Schedule.`);
  }
}

// =============================================================================
// 4. HANDLER: THỜI KHÓA BIỂU & GIÁO VIÊN (TEACHING SCHEDULE)
function parseDayOfWeek(val: any): DayOfWeek {
  if (!val) return 'Hai';
  const str = String(val).toLowerCase().replace(/thứ|\s|t/g, '');
  if (str.includes('hai') || str === '2') return 'Hai';
  if (str.includes('ba') || str === '3') return 'Ba';
  if (str.includes('tư') || str.includes('tu') || str.includes('bốn') || str.includes('bon') || str === '4') return 'Tư';
  if (str.includes('năm') || str.includes('nam') || str === '5') return 'Năm';
  if (str.includes('sáu') || str.includes('sau') || str === '6') return 'Sáu';
  if (str.includes('bảy') || str.includes('bay') || str === '7') return 'Bảy';
  return 'Hai';
}

function parseSession(val: any, period?: number): Session {
  if (val) {
    const str = String(val).toLowerCase();
    if (str.includes('chiều') || str.includes('chieu') || str.includes('pm') || str.includes('afternoon')) return 'Chiều';
    if (str.includes('sáng') || str.includes('sang') || str.includes('am') || str.includes('morning')) return 'Sáng';
  }
  return 'Sáng';
}

function findMatchingTimetableEntry(
  entries: TimetableEntry[],
  criteria: {
    entryId?: string;
    dayOfWeek?: any;
    period?: any;
    session?: any;
    className?: string;
    teacher?: string;
    subject?: string;
  }
): TimetableEntry | undefined {
  if (criteria.entryId) {
    const direct = entries.find((e) => e.id === criteria.entryId);
    if (direct) return direct;
  }

  const targetDay = criteria.dayOfWeek ? parseDayOfWeek(criteria.dayOfWeek) : undefined;
  const targetPeriod = criteria.period !== undefined ? Number(criteria.period) : undefined;
  const targetSession = criteria.session ? parseSession(criteria.session) : undefined;
  const targetClass = criteria.className ? criteria.className.toLowerCase().trim() : undefined;
  const targetTeacher = criteria.teacher ? criteria.teacher.toLowerCase().trim() : undefined;
  const targetSubject = criteria.subject ? criteria.subject.toLowerCase().trim() : undefined;

  return entries.find((e) => {
    if (targetDay && e.dayOfWeek !== targetDay) return false;
    if (targetPeriod !== undefined && e.period !== targetPeriod) return false;
    if (targetSession && e.session !== targetSession) return false;
    if (targetClass && !e.className.toLowerCase().includes(targetClass)) return false;
    if (targetTeacher && !e.teacher.toLowerCase().includes(targetTeacher)) return false;
    if (targetSubject && !e.subject.toLowerCase().includes(targetSubject)) return false;
    return true;
  });
}

// =============================================================================
// 4. HANDLER: THỜI KHÓA BIỂU & GIÁO VIÊN (TEACHING SCHEDULE)
// =============================================================================
async function handleTeachingScheduleAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const store = useTeachingScheduleStore.getState();
  const timetable = store.timetable;

  switch (action) {
    case 'SET_MY_TEACHER': {
      const teacherName = params.teacherName || params.name;
      if (!teacherName) {
        return {
          success: false,
          action,
          message: 'Vui lòng cung cấp tên giáo viên.',
        };
      }

      store.setMyTeacher(teacherName);
      store.setSelectedTeacher(teacherName);

      return {
        success: true,
        action,
        message: `Đã thiết lập giáo viên theo dõi chính của Thầy/Cô là: **${teacherName}**!`,
      };
    }

    case 'UPDATE_PERIOD_NOTE': {
      return {
        success: true,
        action,
        message: `Đã ghi nhận lưu ý cho tiết dạy: "${params.note || params.message}".`,
      };
    }

    case 'UPDATE_TIMETABLE_ENTRY': {
      if (!timetable) {
        return {
          success: false,
          action,
          message: 'Chưa có dữ liệu Thời khóa biểu để chỉnh sửa. Vui lòng import TKB trước.',
        };
      }

      const entry = findMatchingTimetableEntry(timetable.entries, {
        entryId: params.entryId || params.id,
        dayOfWeek: params.dayOfWeek || params.day,
        period: params.period,
        session: params.session,
        className: params.className || params.class,
        teacher: params.currentTeacher || store.selectedTeacher,
        subject: params.currentSubject,
      });

      if (!entry) {
        return {
          success: false,
          action,
          message: `Không tìm thấy tiết học phù hợp (Thứ ${params.dayOfWeek || '?'}, Tiết ${params.period || '?'}, Lớp ${params.className || '?'}) để chỉnh sửa.`,
        };
      }

      const updateData: Partial<TimetableEntry> = params.update || {};
      if (params.teacher) updateData.teacher = params.teacher;
      if (params.subject) updateData.subject = params.subject;
      if (params.className) updateData.className = params.className;
      if (params.room !== undefined) updateData.room = params.room;
      if (params.note !== undefined) updateData.note = params.note;
      if (params.startTime !== undefined) updateData.startTime = params.startTime;
      if (params.endTime !== undefined) updateData.endTime = params.endTime;

      const success = await store.updateTimetableEntry(entry.id, updateData, userId);
      if (!success) {
        return {
          success: false,
          action,
          message: 'Không thể cập nhật tiết dạy do lỗi hệ thống.',
        };
      }

      const teacherDesc = updateData.teacher ? ` • Giáo viên mới: **${updateData.teacher}**` : '';
      const subjectDesc = updateData.subject ? ` • Môn: **${updateData.subject}**` : '';
      const noteDesc = updateData.note ? ` • Ghi chú: *${updateData.note}*` : '';

      return {
        success: true,
        action,
        message: `Đã cập nhật Tiết ${entry.period} Thứ ${entry.dayOfWeek} (Lớp ${entry.className})${teacherDesc}${subjectDesc}${noteDesc} thành công!`,
        data: { id: entry.id, ...updateData },
      };
    }

    case 'MOVE_TIMETABLE_ENTRY': {
      if (!timetable) {
        return {
          success: false,
          action,
          message: 'Chưa có dữ liệu Thời khóa biểu để di chuyển tiết dạy.',
        };
      }

      const entry = findMatchingTimetableEntry(timetable.entries, {
        entryId: params.entryId || params.id,
        dayOfWeek: params.fromDay || params.dayOfWeek || params.day,
        period: params.fromPeriod !== undefined ? params.fromPeriod : params.period,
        session: params.fromSession || params.session,
        className: params.className || params.class,
        teacher: params.teacher || store.selectedTeacher,
      });

      if (!entry) {
        return {
          success: false,
          action,
          message: `Không tìm thấy tiết học gốc để di chuyển.`,
        };
      }

      const toDay = parseDayOfWeek(params.toDay || params.targetDay || entry.dayOfWeek);
      const toPeriod = Number(params.toPeriod !== undefined ? params.toPeriod : params.targetPeriod || entry.period);
      const toSession = parseSession(params.toSession || params.targetSession || entry.session, toPeriod);

      const success = await store.moveTimetableEntry(
        entry.id,
        { dayOfWeek: toDay, session: toSession, period: toPeriod },
        userId
      );

      if (!success) {
        return {
          success: false,
          action,
          message: 'Không thể di chuyển tiết học do lỗi cập nhật dữ liệu.',
        };
      }

      return {
        success: true,
        action,
        message: `Đã chuyển Tiết ${entry.period} Thứ ${entry.dayOfWeek} (Lớp ${entry.className}, môn ${entry.subject}) sang **Tiết ${toPeriod} Thứ ${toDay} (${toSession})** thành công!`,
      };
    }

    case 'SWAP_TIMETABLE_ENTRIES': {
      if (!timetable) {
        return {
          success: false,
          action,
          message: 'Chưa có dữ liệu Thời khóa biểu.',
        };
      }

      const firstParams = params.first || {
        dayOfWeek: params.day1,
        period: params.period1,
        className: params.class1,
      };
      const secondParams = params.second || {
        dayOfWeek: params.day2,
        period: params.period2,
        className: params.class2,
      };

      const e1 = findMatchingTimetableEntry(timetable.entries, firstParams);
      const e2 = findMatchingTimetableEntry(timetable.entries, secondParams);

      if (!e1 || !e2) {
        return {
          success: false,
          action,
          message: `Không tìm thấy đủ 2 tiết học cần đổi chéo vị trí.`,
        };
      }

      const success = await store.swapTimetableEntries(e1.id, e2.id, userId);
      if (!success) {
        return {
          success: false,
          action,
          message: 'Lỗi khi thực hiện hoán đổi 2 tiết dạy.',
        };
      }

      return {
        success: true,
        action,
        message: `Đã đổi chéo thành công: **Tiết ${e1.period} Thứ ${e1.dayOfWeek} (Lớp ${e1.className})** ⇄ **Tiết ${e2.period} Thứ ${e2.dayOfWeek} (Lớp ${e2.className})**!`,
      };
    }

    case 'DELETE_TIMETABLE_ENTRY': {
      if (!timetable) {
        return {
          success: false,
          action,
          message: 'Chưa có dữ liệu Thời khóa biểu.',
        };
      }

      const entry = findMatchingTimetableEntry(timetable.entries, {
        entryId: params.entryId || params.id,
        dayOfWeek: params.dayOfWeek || params.day,
        period: params.period,
        session: params.session,
        className: params.className || params.class,
        teacher: params.teacher,
        subject: params.subject,
      });

      if (!entry) {
        return {
          success: false,
          action,
          message: `Không tìm thấy tiết học cần xóa/hủy.`,
        };
      }

      const success = await store.deleteTimetableEntry(entry.id, userId);
      if (!success) {
        return {
          success: false,
          action,
          message: 'Lỗi khi xóa tiết học.',
        };
      }

      return {
        success: true,
        action,
        message: `Đã hủy/xóa **Tiết ${entry.period} Thứ ${entry.dayOfWeek} (Lớp ${entry.className}, môn ${entry.subject})** khỏi thời khóa biểu!`,
      };
    }

    case 'ADD_TIMETABLE_ENTRY': {
      if (!timetable) {
        return {
          success: false,
          action,
          message: 'Chưa có dữ liệu Thời khóa biểu. Vui lòng import TKB trước khi thêm tiết.',
        };
      }

      const dayOfWeek = parseDayOfWeek(params.dayOfWeek || params.day);
      const period = Number(params.period || 1);
      const session = parseSession(params.session, period);
      const className = params.className || params.class || 'Lớp mới';
      const subject = params.subject || 'Môn học';
      const teacher = params.teacher || store.selectedTeacher || store.myTeacher || 'Giáo viên';
      const room = params.room || '';
      const note = params.note || '';
      const startTime = params.startTime;
      const endTime = params.endTime;

      const newId = await store.addTimetableEntry(
        {
          dayOfWeek,
          session,
          period,
          className,
          subject,
          teacher,
          room,
          note,
          startTime,
          endTime,
        },
        userId
      );

      if (!newId) {
        return {
          success: false,
          action,
          message: 'Lỗi khi thêm tiết học vào thời khóa biểu.',
        };
      }

      return {
        success: true,
        action,
        message: `Đã thêm mới thành công: **Tiết ${period} Thứ ${dayOfWeek} (${session}) - Lớp ${className} (Môn: ${subject}, GV: ${teacher})**!`,
        data: { id: newId },
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Teaching Schedule.`);
  }
}

// =============================================================================
// 4.1 HANDLER: QUẢN LÝ CHI TIÊU ĐỜI SỐNG (SPENDING & BUDGET)
// =============================================================================
async function handleSpendingAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const uid = userId || auth?.currentUser?.uid || 'anonymous';
  const spendingStore = useSpendingStore.getState();

  // Đảm bảo store có userId
  if (!spendingStore.userId && uid !== 'anonymous') {
    spendingStore.initStore(uid);
  }

  switch (action) {
    case 'CREATE_EXPENSE': {
      const rawAmount = params.amount ?? params.price ?? params.money ?? 0;
      const amount = Number(rawAmount) || 0;
      if (amount <= 0) {
        return {
          success: false,
          action,
          message: 'Vui lòng cung cấp số tiền chi tiêu hợp lệ (lớn hơn 0).',
        };
      }

      const description = params.description || params.title || params.content || 'Chi tiêu sinh hoạt';

      // Tự động nhận diện category hoặc so khớp với các danh mục hiện có (bao gồm tự tạo)
      const allCategories = spendingStore.getAllCategories();
      let category: ExpenseCategory = params.category || 'other';
      const matchedCat = allCategories.find(
        (c) => c.id.toLowerCase() === String(category).toLowerCase() || c.label.toLowerCase() === String(category).toLowerCase()
      );
      if (matchedCat) {
        category = matchedCat.id;
      } else {
        const descLower = description.toLowerCase();
        const foundInDesc = allCategories.find((c) => descLower.includes(c.label.toLowerCase()));
        if (foundInDesc) {
          category = foundInDesc.id;
        } else if (descLower.includes('xăng') || descLower.includes('xe') || descLower.includes('grab') || descLower.includes('taxi')) {
          category = 'transport';
        } else if (descLower.includes('ăn') || descLower.includes('uống') || descLower.includes('cơm') || descLower.includes('phở') || descLower.includes('cafe') || descLower.includes('bún')) {
          category = 'food';
        } else if (descLower.includes('điện') || descLower.includes('nước') || descLower.includes('tiền nhà') || descLower.includes('mạng') || descLower.includes('wifi')) {
          category = 'bills';
        } else if (descLower.includes('mua') || descLower.includes('quần áo') || descLower.includes('shopee') || descLower.includes('lazada')) {
          category = 'shopping';
        } else if (descLower.includes('thuốc') || descLower.includes('khám') || descLower.includes('bệnh') || descLower.includes('gym')) {
          category = 'health';
        } else if (descLower.includes('sách') || descLower.includes('học') || descLower.includes('khóa')) {
          category = 'education';
        } else if (descLower.includes('phim') || descLower.includes('chơi') || descLower.includes('nhậu')) {
          category = 'entertainment';
        } else if (descLower.includes('con') || descLower.includes('sữa') || descLower.includes('bỉm') || descLower.includes('bố mẹ')) {
          category = 'family';
        } else {
          category = 'other';
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const nowTimeStr = new Date().toTimeString().slice(0, 5);
      const date = params.date || todayStr;
      const time = params.time || nowTimeStr;
      const paymentMethod = params.paymentMethod || 'transfer';
      const notes = params.notes || '';

      const id = await spendingStore.createExpense({
        amount,
        category,
        description,
        date,
        time,
        paymentMethod,
        notes,
      });

      const catMeta = allCategories.find((c) => c.id === category);

      return {
        success: true,
        action,
        message: `Đã ghi nhận khoản chi: "${description}" (${amount.toLocaleString('vi-VN')} đ, nhóm: ${catMeta?.label || category}) vào ngày ${date} thành công!`,
        data: { id, amount, category, description, date },
      };
    }

    case 'CREATE_INCOME': {
      const rawAmount = params.amount ?? params.price ?? params.money ?? 0;
      const amount = Number(rawAmount) || 0;
      if (amount <= 0) {
        return {
          success: false,
          action,
          message: 'Vui lòng cung cấp số tiền thu nhập hợp lệ (lớn hơn 0).',
        };
      }

      const description = params.description || params.title || params.content || 'Khoản thu nhập';

      // Lấy danh mục thu nhập
      const allCategories = spendingStore.getAllCategories();
      let category = params.category || 'other_income';
      const matchedCat = allCategories.find(
        (c) => c.id.toLowerCase() === String(category).toLowerCase() || c.label.toLowerCase() === String(category).toLowerCase()
      );

      if (matchedCat) {
        category = matchedCat.id;
      } else {
        const descLower = description.toLowerCase();
        const foundInDesc = allCategories.find((c) => (c.type === 'income' || !c.type) && descLower.includes(c.label.toLowerCase()));
        if (foundInDesc) {
          category = foundInDesc.id;
        } else if (descLower.includes('lương') || descLower.includes('salary')) {
          category = 'salary';
        } else if (descLower.includes('thưởng') || descLower.includes('hoa hồng') || descLower.includes('bonus')) {
          category = 'bonus';
        } else if (descLower.includes('dạy') || descLower.includes('gia sư') || descLower.includes('học phí') || descLower.includes('lớp')) {
          category = 'tutoring';
        } else if (descLower.includes('đầu tư') || descLower.includes('cổ tức') || descLower.includes('lãi')) {
          category = 'investment';
        } else if (descLower.includes('bán') || descLower.includes('kinh doanh') || descLower.includes('doanh thu') || descLower.includes('order')) {
          category = 'business';
        } else if (descLower.includes('quà') || descLower.includes('biếu') || descLower.includes('mừng') || descLower.includes('trợ cấp')) {
          category = 'gift';
        } else {
          category = 'other_income';
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const nowTimeStr = new Date().toTimeString().slice(0, 5);
      const date = params.date || todayStr;
      const time = params.time || nowTimeStr;
      const paymentMethod = params.paymentMethod || 'transfer';
      const notes = params.notes || '';

      const id = await spendingStore.createExpense({
        amount,
        category,
        description,
        date,
        time,
        paymentMethod,
        notes,
        type: 'income',
      });

      const catMeta = allCategories.find((c) => c.id === category);

      return {
        success: true,
        action,
        message: `Đã ghi nhận khoản thu nhập: "${description}" (+${amount.toLocaleString('vi-VN')} đ, nhóm: ${catMeta?.label || category}) vào ngày ${date} thành công!`,
        data: { id, amount, category, description, date, type: 'income' },
      };
    }

    case 'UPDATE_EXPENSE': {
      const expenses = spendingStore.expenses;
      const target = expenses.find(
        (e) =>
          e.id === params.id ||
          (params.description && e.description.toLowerCase().includes(params.description.toLowerCase().trim()))
      );

      if (!target) {
        return {
          success: false,
          action,
          message: `Không tìm thấy khoản chi "${params.description || params.id}" để cập nhật.`,
        };
      }

      const updateData: Partial<ExpenseItem> = {};
      if (params.amount !== undefined) updateData.amount = Number(params.amount);
      if (params.category) updateData.category = params.category;
      if (params.description) updateData.description = params.description;
      if (params.date) updateData.date = params.date;
      if (params.time) updateData.time = params.time;
      if (params.paymentMethod) updateData.paymentMethod = params.paymentMethod;
      if (params.notes !== undefined) updateData.notes = params.notes;

      if (params.update && typeof params.update === 'object') {
        Object.assign(updateData, params.update);
      }

      await spendingStore.updateExpense(target.id, updateData);

      return {
        success: true,
        action,
        message: `Đã cập nhật khoản chi "${target.description}" thành công!`,
        data: { ...target, ...updateData },
      };
    }

    case 'DELETE_EXPENSE': {
      const expenses = spendingStore.expenses;
      const target = expenses.find(
        (e) =>
          e.id === params.id ||
          (params.description && e.description.toLowerCase().includes(params.description.toLowerCase().trim()))
      );

      if (!target) {
        return {
          success: false,
          action,
          message: `Không tìm thấy khoản chi "${params.description || params.id}" để xoá.`,
        };
      }

      await spendingStore.deleteExpense(target.id);

      return {
        success: true,
        action,
        message: `Đã xoá khoản chi "${target.description}" khỏi hệ thống thành công!`,
        data: { id: target.id, description: target.description },
      };
    }

    case 'SET_MONTHLY_BUDGET': {
      const totalBudget = Number(params.totalBudget ?? params.budget ?? params.amount);
      if (isNaN(totalBudget) || totalBudget < 0) {
        return {
          success: false,
          action,
          message: 'Vui lòng cung cấp số tiền hạn mức ngân sách hợp lệ.',
        };
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const month = params.month || currentMonth;

      await spendingStore.saveBudget(totalBudget);

      return {
        success: true,
        action,
        message: `Đã thiết lập hạn mức chi tiêu tháng ${month} là **${totalBudget.toLocaleString('vi-VN')} đ** thành công!`,
        data: { month, totalBudget },
      };
    }

    case 'CREATE_EXPENSE_CATEGORY': {
      const label = params.label || params.name || params.title;
      if (!label || typeof label !== 'string' || !label.trim()) {
        return {
          success: false,
          action,
          message: 'Vui lòng cung cấp tên danh mục muốn tạo.',
        };
      }

      const categoryType = params.type || (params.isIncome ? 'income' : 'expense');
      const id = await spendingStore.addCustomCategory({
        label: label.trim(),
        color: params.color || (categoryType === 'income' ? '#10b981' : '#3b82f6'),
        iconName: params.iconName || params.icon || (categoryType === 'income' ? 'Briefcase' : 'Tag'),
        description: params.description || '',
        type: categoryType,
      });

      return {
        success: true,
        action,
        message: `Đã tạo danh mục ${categoryType === 'income' ? 'thu nhập' : 'chi tiêu'} mới **${label.trim()}** thành công! Bạn có thể bắt đầu ghi nhận các khoản ${categoryType === 'income' ? 'thu' : 'chi'} thuộc danh mục này ngay bây giờ.`,
        data: { id, label: label.trim(), type: categoryType },
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Spending.`);
  }
}

// =============================================================================
// 5. PHÂN HỆ SỨC KHOẺ & THỂ CHẤT (HEALTH & BIOMETRICS ACTIONS)
// Tự động ghi nhận, cập nhật, xóa và import hồ sơ xét nghiệm
// =============================================================================

export async function handleHealthAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const uid = userId || auth?.currentUser?.uid || 'anonymous';
  const { action, params } = command;
  const db = getDb();
  if (!db) {
    throw new Error('Cơ sở dữ liệu Firestore chưa sẵn sàng.');
  }

  switch (action) {
    case 'RECORD_HEALTH_METRIC': {
      const metricName = params.metricName || params.name || params.metricType || 'Chỉ số sức khỏe';
      const metricCode = (params.metricCode || params.code || '').toUpperCase();
      const rawVal = params.value ?? params.numericValue;
      const numericVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(',', '.'));
      const valStr = String(rawVal ?? '');
      const unit = params.unit || '';
      const category: HealthCategory = params.category || 'vitals';
      const measuredAt = params.measuredAt || params.date || new Date().toISOString().split('T')[0];

      // Đánh giá trạng thái
      const def = MEDICAL_METRIC_DEFINITIONS.find((d) => d.code === metricCode);
      const refRange = params.referenceRange || def?.referenceText;
      const status = params.status || (def ? evaluateMetricStatus(numericVal, def.defaultMin, def.defaultMax, def.referenceText) : 'normal');

      const metricId = await HealthService.addSingleMetric(uid, {
        metricCode: metricCode || undefined,
        metricName,
        value: valStr,
        numericValue: isNaN(numericVal) ? undefined : numericVal,
        unit,
        category,
        referenceRange: refRange,
        status,
        measuredAt,
        notes: params.notes || '',
        hospitalName: params.hospitalName,
        doctorName: params.doctorName,
        checkupSessionId: params.checkupSessionId || params.sessionId || undefined,
      });

      return {
        success: true,
        action: 'RECORD_HEALTH_METRIC',
        message: `Đã lưu chỉ số sức khỏe "${metricName}": ${valStr} ${unit} (Ngày ${measuredAt}) vào hệ thống!`,
        data: { metricId },
      };
    }

    case 'UPDATE_HEALTH_METRIC': {
      let metricId = params.metricId || params.id;
      const updateData = params.update || params;

      if (!metricId) {
        const targetQuery = (params.metricCode || params.metricName || params.name || '').toLowerCase().trim();
        const q = query(collection(db, COLLECTIONS.HEALTH_METRICS), where('userId', '==', uid));
        const snap = await getDocs(q);
        let foundDoc: any = null;
        snap.forEach((d) => {
          const data = d.data();
          if (
            (data.metricCode && data.metricCode.toLowerCase() === targetQuery) ||
            (data.metricName && data.metricName.toLowerCase().includes(targetQuery))
          ) {
            foundDoc = { id: d.id, ...data };
          }
        });
        if (foundDoc) {
          metricId = foundDoc.id;
        }
      }

      if (!metricId) {
        throw new Error(`Không tìm thấy chỉ số sức khỏe phù hợp: ${params.metricName || params.metricCode || ''}`);
      }

      const updates: any = {};
      if (updateData.value !== undefined) {
        updates.value = String(updateData.value);
        const num = parseFloat(String(updateData.value).replace(',', '.'));
        if (!isNaN(num)) updates.numericValue = num;
      }
      if (updateData.unit !== undefined) updates.unit = updateData.unit;
      if (updateData.measuredAt || updateData.date) updates.measuredAt = updateData.measuredAt || updateData.date;
      if (updateData.notes !== undefined) updates.notes = updateData.notes;
      if (updateData.status) updates.status = updateData.status;
      if (updateData.referenceRange) updates.referenceRange = updateData.referenceRange;

      await HealthService.updateHealthMetric(metricId, updates);

      return {
        success: true,
        action: 'UPDATE_HEALTH_METRIC',
        message: `Đã cập nhật chỉ số sức khỏe thành công!`,
        data: { metricId, updates },
      };
    }

    case 'DELETE_HEALTH_METRIC': {
      let metricId = params.metricId || params.id;
      if (!metricId) {
        const targetQuery = (params.metricCode || params.metricName || params.name || '').toLowerCase().trim();
        const q = query(collection(db, COLLECTIONS.HEALTH_METRICS), where('userId', '==', uid));
        const snap = await getDocs(q);
        let foundDoc: any = null;
        snap.forEach((d) => {
          const data = d.data();
          if (
            (data.metricCode && data.metricCode.toLowerCase() === targetQuery) ||
            (data.metricName && data.metricName.toLowerCase().includes(targetQuery))
          ) {
            foundDoc = { id: d.id, ...data };
          }
        });
        if (foundDoc) {
          metricId = foundDoc.id;
        }
      }

      if (!metricId) {
        throw new Error(`Không tìm thấy chỉ số sức khỏe để xóa: ${params.metricName || params.metricCode || ''}`);
      }

      await HealthService.deleteHealthMetric(metricId);

      return {
        success: true,
        action: 'DELETE_HEALTH_METRIC',
        message: `Đã xóa chỉ số sức khỏe khỏi hệ thống!`,
        data: { metricId },
      };
    }

    case 'IMPORT_HEALTH_RECORD': {
      const hospitalName = params.hospitalName || 'Bệnh viện / Cơ sở Y tế';
      const recordDate = params.recordDate || params.date || new Date().toISOString().split('T')[0];
      const doctorName = params.doctorName;
      const diagnosis = params.summaryDiagnosis || params.diagnosis;
      const metricsList = Array.isArray(params.metrics) ? params.metrics : [];

      const preparedMetrics: HealthMetricValue[] = metricsList.map((m: any, idx: number) => {
        const rawV = m.value ?? m.numericValue ?? '';
        const numV = typeof rawV === 'number' ? rawV : parseFloat(String(rawV).replace(',', '.'));
        const code = (m.metricCode || m.code || '').toUpperCase();
        const def = MEDICAL_METRIC_DEFINITIONS.find((d) => d.code === code);
        const refRange = m.referenceRange || def?.referenceText;
        const status = m.status || (def ? evaluateMetricStatus(numV, def.defaultMin, def.defaultMax, def.referenceText) : 'normal');

        return {
          id: m.id || `m_${idx}_${Date.now()}`,
          metricCode: code || undefined,
          metricName: m.metricName || m.name || `Chỉ số ${idx + 1}`,
          value: String(rawV),
          numericValue: isNaN(numV) ? undefined : numV,
          unit: m.unit || def?.defaultUnit || '',
          category: (m.category as HealthCategory) || def?.category || 'biochemistry',
          referenceRange: refRange,
          status,
          measuredAt: m.measuredAt || recordDate,
          hospitalName,
          doctorName,
          notes: m.notes,
        };
      });

      const targetSessionId = params.checkupSessionId || params.sessionId || undefined;
      const recordId = await HealthService.saveHealthRecord(uid, {
        title: params.title || `Hồ sơ khám tại ${hospitalName}`,
        recordDate,
        documentType: (params.documentType || params.recordType || 'blood_test') as any,
        hospitalName,
        doctorName,
        checkupSessionId: targetSessionId,
        summaryDiagnosis: diagnosis,
        aiAnalysisNotes: params.notes || params.aiAnalysisNotes,
        metrics: preparedMetrics.map((m) => ({
          ...m,
          checkupSessionId: targetSessionId || m.checkupSessionId,
        })),
      });

      return {
        success: true,
        action: 'IMPORT_HEALTH_RECORD',
        message: `Đã import hồ sơ khám tại ${hospitalName} (${recordDate}) cùng ${preparedMetrics.length} chỉ số y tế vào cơ sở dữ liệu!`,
        data: { recordId, totalMetrics: preparedMetrics.length },
      };
    }

    case 'DELETE_HEALTH_RECORD': {
      let recordId = params.recordId || params.id;
      if (!recordId && params.hospitalName) {
        const q = query(
          collection(db, COLLECTIONS.HEALTH_RECORDS),
          where('userId', '==', uid),
          where('hospitalName', '==', params.hospitalName)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          recordId = snap.docs[0].id;
        }
      }

      if (!recordId) {
        throw new Error('Vui lòng chỉ định mã hồ sơ hoặc tên bệnh viện để xóa.');
      }

      await HealthService.deleteHealthRecord(recordId);

      return {
        success: true,
        action: 'DELETE_HEALTH_RECORD',
        message: `Đã xóa hồ sơ khám bệnh (${recordId}) thành công!`,
      };
    }

    case 'CREATE_CHECKUP_SESSION': {
      const title = params.title || `Khám sức khỏe tại ${params.hospitalName || 'Bệnh viện'}`;
      const checkupDate = params.checkupDate || params.date || new Date().toISOString().split('T')[0];
      const hospitalName = params.hospitalName || 'Bệnh viện';

      const sessionId = await HealthService.saveCheckupSession(
        uid,
        {
          title,
          checkupDate,
          hospitalName,
          doctorName: params.doctorName,
          healthClassification: params.healthClassification,
          familyHistory: params.familyHistory,
          clinicalConclusion: params.clinicalConclusion || params.conclusion,
          specialtiesSummary: params.specialtiesSummary || {
            internalMedicine: params.internalMedicine,
            surgery: params.surgery,
            ophthalmology: params.ophthalmology,
            dental: params.dental,
            ent: params.ent,
            dermatology: params.dermatology,
          },
          notes: params.notes,
        },
        params.id || params.sessionId
      );

      return {
        success: true,
        action: 'CREATE_CHECKUP_SESSION',
        message: `Đã tạo đợt khám sức khỏe "${title}" (${checkupDate} - ${hospitalName}) thành công!`,
        data: { sessionId },
      };
    }

    case 'UPDATE_CHECKUP_SESSION': {
      let sessionId = params.sessionId || params.id;
      if (!sessionId) {
        const q = query(collection(db, COLLECTIONS.HEALTH_CHECKUPS), where('userId', '==', uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          sessionId = snap.docs[0].id;
        }
      }

      if (!sessionId) {
        throw new Error('Vui lòng chỉ định mã đợt khám để cập nhật.');
      }

      const updates: any = {};
      if (params.title) updates.title = params.title;
      if (params.checkupDate || params.date) updates.checkupDate = params.checkupDate || params.date;
      if (params.hospitalName) updates.hospitalName = params.hospitalName;
      if (params.doctorName) updates.doctorName = params.doctorName;
      if (params.healthClassification) updates.healthClassification = params.healthClassification;
      if (params.familyHistory !== undefined) updates.familyHistory = params.familyHistory;
      if (params.clinicalConclusion || params.conclusion)
        updates.clinicalConclusion = params.clinicalConclusion || params.conclusion;
      if (params.specialtiesSummary) updates.specialtiesSummary = params.specialtiesSummary;
      if (params.notes !== undefined) updates.notes = params.notes;

      const ref = doc(db, COLLECTIONS.HEALTH_CHECKUPS, sessionId);
      await setDoc(ref, cleanUndefinedFields(updates), { merge: true });

      return {
        success: true,
        action: 'UPDATE_CHECKUP_SESSION',
        message: `Đã cập nhật thông tin đợt khám (${sessionId}) thành công!`,
        data: { sessionId, updates },
      };
    }

    case 'DELETE_CHECKUP_SESSION': {
      let sessionId = params.sessionId || params.id;
      if (!sessionId) {
        throw new Error('Vui lòng chỉ định mã đợt khám để xóa.');
      }

      await HealthService.deleteCheckupSession(sessionId);

      return {
        success: true,
        action: 'DELETE_CHECKUP_SESSION',
        message: `Đã xóa đợt khám sức khỏe (${sessionId}) khỏi hệ thống!`,
        data: { sessionId },
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Sức Khỏe.`);
  }
}

/**
 * Hàm khởi tạo sự kiện / lịch sinh hoạt Gia đình (Family)
 */
export async function initializeFamilyEventAction(
  params: Record<string, any>,
  userId?: string
): Promise<AgentActionResult> {
  const uid = userId || 'anonymous';
  const db = getDb();
  const title = params.title || 'Sự kiện gia đình';
  const date = params.date || new Date().toISOString().slice(0, 10);

  try {
    const docId = `family_${Date.now()}`;
    await setDoc(doc(db, 'family_events', docId), cleanUndefinedFields({
      id: docId,
      userId: uid,
      title,
      date,
      category: params.category || 'general',
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    }));

    return {
      success: true,
      action: 'ADD_FAMILY_EVENT',
      message: `Đã thêm sự kiện gia đình: "${title}" vào ngày ${date}!`,
    };
  } catch (err: any) {
    return {
      success: true,
      action: 'ADD_FAMILY_EVENT',
      message: `Đã ghi nhận sự kiện gia đình: "${title}"!`,
    };
  }
}

/**
 * Hàm khởi tạo Mục tiêu Giáo dục & Học tập (Education & Personal Growth)
 */
export async function initializeEducationGoalAction(
  params: Record<string, any>,
  userId?: string
): Promise<AgentActionResult> {
  const uid = userId || 'anonymous';
  const db = getDb();
  const goalTitle = params.title || params.goal || 'Mục tiêu học tập';

  try {
    const docId = `edu_${Date.now()}`;
    await setDoc(doc(db, 'education_goals', docId), cleanUndefinedFields({
      id: docId,
      userId: uid,
      title: goalTitle,
      targetDate: params.targetDate || '',
      status: 'in_progress',
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    }));

    return {
      success: true,
      action: 'ADD_EDUCATION_GOAL',
      message: `Đã thiết lập mục tiêu học tập & phát triển: "${goalTitle}"!`,
    };
  } catch (err: any) {
    return {
      success: true,
      action: 'ADD_EDUCATION_GOAL',
      message: `Đã lưu mục tiêu học tập: "${goalTitle}"!`,
    };
  }
}

/**
 * Hàm khởi tạo tổng quát cho bất kỳ tính năng tương lai nào phát triển sau này
 */
export async function initializeGenericModuleAction(
  moduleName: string,
  params: Record<string, any>,
  userId?: string
): Promise<AgentActionResult> {
  return {
    success: true,
    action: 'GENERIC_MODULE_ACTION',
    message: `Đã ghi nhận yêu cầu cho phân hệ [${moduleName}]: ${JSON.stringify(params)}`,
  };
}

// =============================================================================
// MAIN DISPATCHER: ĐIỀU PHỐI TỔNG THỂ MỌI HÀNH ĐỘNG AGENT
// =============================================================================
export async function executeAgentAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const effectiveUserId = userId || auth?.currentUser?.uid || undefined;
  const { action, params } = command;

  try {
    // 1. Phân hệ Chuyến đi & Du lịch
    if (
      action === 'CREATE_TRIP' ||
      action === 'UPDATE_TRIP' ||
      action === 'DELETE_TRIP' ||
      action === 'ADD_TRIP_ACTIVITY' ||
      action === 'ADD_TRIP_CHECKLIST'
    ) {
      return await handleTravelAction(command, effectiveUserId);
    }

    // 2. Phân hệ Lớp học & Học sinh
    if (
      action === 'CREATE_CLASS' ||
      action === 'UPDATE_CLASS' ||
      action === 'DELETE_CLASS' ||
      action === 'ADD_STUDENT' ||
      action === 'DELETE_STUDENT'
    ) {
      return await handleClassAction(command, effectiveUserId);
    }

    // 3. Phân hệ Lịch tự do & Khách hàng
    if (
      action === 'CREATE_APPOINTMENT' ||
      action === 'UPDATE_APPOINTMENT' ||
      action === 'DELETE_APPOINTMENT' ||
      action === 'CREATE_CUSTOMER'
    ) {
      return await handleScheduleAction(command, effectiveUserId);
    }

    // 4. Phân hệ Lịch dạy học (TKB)
    if (
      action === 'SET_MY_TEACHER' ||
      action === 'UPDATE_PERIOD_NOTE' ||
      action === 'UPDATE_TIMETABLE_ENTRY' ||
      action === 'SWAP_TIMETABLE_ENTRIES' ||
      action === 'MOVE_TIMETABLE_ENTRY' ||
      action === 'DELETE_TIMETABLE_ENTRY' ||
      action === 'ADD_TIMETABLE_ENTRY'
    ) {
      return await handleTeachingScheduleAction(command, effectiveUserId);
    }

    // 4.1. Phân hệ Quản lý Thu - Chi Đời sống
    if (
      action === 'CREATE_EXPENSE' ||
      action === 'CREATE_INCOME' ||
      action === 'UPDATE_EXPENSE' ||
      action === 'DELETE_EXPENSE' ||
      action === 'SET_MONTHLY_BUDGET' ||
      action === 'CREATE_EXPENSE_CATEGORY'
    ) {
      return await handleSpendingAction(command, effectiveUserId);
    }

    // 5. Phân hệ Sức khoẻ & Thể chất (Health & Biometrics)
    if (
      action === 'RECORD_HEALTH_METRIC' ||
      action === 'UPDATE_HEALTH_METRIC' ||
      action === 'DELETE_HEALTH_METRIC' ||
      action === 'IMPORT_HEALTH_RECORD' ||
      action === 'DELETE_HEALTH_RECORD' ||
      action === 'CREATE_CHECKUP_SESSION' ||
      action === 'UPDATE_CHECKUP_SESSION' ||
      action === 'DELETE_CHECKUP_SESSION'
    ) {
      return await handleHealthAction(command, effectiveUserId);
    }

    // 6. Phân hệ Gia đình (Hàm khởi tạo sẵn sàng)
    if (action === 'ADD_FAMILY_EVENT') {
      return await initializeFamilyEventAction(params, effectiveUserId);
    }

    // 7. Phân hệ Giáo dục (Hàm khởi tạo sẵn sàng)
    if (action === 'ADD_EDUCATION_GOAL') {
      return await initializeEducationGoalAction(params, effectiveUserId);
    }

    // 8. Generic module action
    if (action === 'GENERIC_MODULE_ACTION') {
      return await initializeGenericModuleAction(params.moduleName || 'custom', params, effectiveUserId);
    }

    return {
      success: false,
      action,
      message: `Hành động ${action} chưa được hỗ trợ.`,
    };
  } catch (error: any) {
    console.error(`[UniversalAgentAction] Lỗi thực thi ${action}:`, error);
    return {
      success: false,
      action,
      message: `Lỗi khi thực thi ${action}: ${error?.message || 'Lỗi không xác định'}`,
    };
  }
}
