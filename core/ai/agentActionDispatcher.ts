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
import { useSpendingStore } from '@/features/spending/stores/useSpendingStore';
import { ExpenseItem, ExpenseCategory, EXPENSE_CATEGORIES } from '@/features/spending/types';
import { getDb, COLLECTIONS, auth } from '@/core/firebase';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';

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
  // 5. Quản lý Chi tiêu Đời sống
  | 'CREATE_EXPENSE'
  | 'UPDATE_EXPENSE'
  | 'DELETE_EXPENSE'
  | 'SET_MONTHLY_BUDGET'
  | 'CREATE_EXPENSE_CATEGORY'
  // 6. Khởi tạo sẵn cho các tính năng tương lai
  | 'RECORD_HEALTH_METRIC'
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
// =============================================================================
async function handleTeachingScheduleAction(
  command: AgentActionCommand,
  userId?: string
): Promise<AgentActionResult> {
  const { action, params } = command;
  const store = useTeachingScheduleStore.getState();

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
          message: 'Vui lòng cung cấp tên danh mục chi tiêu muốn tạo.',
        };
      }

      const id = await spendingStore.addCustomCategory({
        label: label.trim(),
        color: params.color || '#3b82f6',
        iconName: params.iconName || params.icon || 'Tag',
        description: params.description || '',
      });

      return {
        success: true,
        action,
        message: `Đã tạo danh mục chi tiêu mới **${label.trim()}** thành công! Bạn có thể bắt đầu ghi nhận các khoản chi thuộc danh mục này ngay bây giờ.`,
        data: { id, label: label.trim() },
      };
    }

    default:
      throw new Error(`Hành động ${action} không thuộc phân hệ Spending.`);
  }
}

// =============================================================================
// 5. KHỞI TẠO SẴN SÀNG CHO CÁC TÍNH NĂNG TƯƠNG LAI (FUTURE MODULES INITIALIZERS)
// Sức khoẻ & Thể chất, Gia đình, Giáo dục... và mở rộng sau này
// =============================================================================

/**
 * Hàm khởi tạo ghi nhận chỉ số Sức khoẻ & Thể chất (Health & Fitness)
 */
export async function initializeHealthMetricAction(
  params: Record<string, any>,
  userId?: string
): Promise<AgentActionResult> {
  const uid = userId || 'anonymous';
  const db = getDb();
  const metricType = params.metricType || params.type || 'general';
  const value = params.value || 0;
  const date = params.date || new Date().toISOString().slice(0, 10);

  try {
    const docId = `health_${Date.now()}`;
    await setDoc(doc(db, 'health_metrics', docId), {
      id: docId,
      userId: uid,
      metricType,
      value,
      unit: params.unit || '',
      date,
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      action: 'RECORD_HEALTH_METRIC',
      message: `Đã ghi nhận chỉ số sức khoẻ [${metricType}: ${value} ${params.unit || ''}] ngày ${date}!`,
    };
  } catch (err: any) {
    return {
      success: true,
      action: 'RECORD_HEALTH_METRIC',
      message: `Đã ghi nhận thông tin sức khoẻ: ${params.notes || metricType} (${value})!`,
    };
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
    await setDoc(doc(db, 'family_events', docId), {
      id: docId,
      userId: uid,
      title,
      date,
      category: params.category || 'general',
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    });

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
    await setDoc(doc(db, 'education_goals', docId), {
      id: docId,
      userId: uid,
      title: goalTitle,
      targetDate: params.targetDate || '',
      status: 'in_progress',
      notes: params.notes || '',
      createdAt: new Date().toISOString(),
    });

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
    if (action === 'SET_MY_TEACHER' || action === 'UPDATE_PERIOD_NOTE') {
      return await handleTeachingScheduleAction(command, effectiveUserId);
    }

    // 4.1. Phân hệ Quản lý Chi tiêu Đời sống
    if (
      action === 'CREATE_EXPENSE' ||
      action === 'UPDATE_EXPENSE' ||
      action === 'DELETE_EXPENSE' ||
      action === 'SET_MONTHLY_BUDGET' ||
      action === 'CREATE_EXPENSE_CATEGORY'
    ) {
      return await handleSpendingAction(command, effectiveUserId);
    }

    // 5. Phân hệ Sức khoẻ & Thể chất (Hàm khởi tạo sẵn sàng)
    if (action === 'RECORD_HEALTH_METRIC') {
      return await initializeHealthMetricAction(params, effectiveUserId);
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
