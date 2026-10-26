import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { getDb, COLLECTIONS } from '@/core/firebase';
import { Appointment, Customer } from '../types';
import { saveIncomeTransaction, deleteIncomeTransaction } from '../../income/services/incomeService';

/**
 * Lắng nghe Realtime danh sách lịch hẹn của người dùng
 */
export function subscribeToAppointments(
  userId: string,
  onUpdate: (appointments: Appointment[]) => void,
  onError?: (error: any) => void
) {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sắp xếp theo ngày tăng dần
      list.sort((a, b) => a.date.localeCompare(b.date));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to appointments:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lắng nghe Realtime danh sách khách hàng của người dùng
 */
export function subscribeToCustomers(
  userId: string,
  onUpdate: (customers: Customer[]) => void,
  onError?: (error: any) => void
) {
  const db = getDb();
  const q = query(
    collection(db, COLLECTIONS.CUSTOMERS),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      onUpdate(list);
    },
    (err) => {
      console.error('Error listening to customers:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Lưu (tạo mới hoặc cập nhật) lịch hẹn
 */
export async function saveAppointment(
  data: Partial<Appointment>,
  userId: string
): Promise<string> {
  const db = getDb();
  const appRef = collection(db, COLLECTIONS.APPOINTMENTS);
  const appId = data.id || doc(appRef).id;
  const now = new Date().toISOString();

  const entity: Appointment = {
    id: appId,
    userId,
    title: data.title?.trim() || '',
    customerId: data.customerId || 'cust_guest',
    customerName: data.customerName?.trim() || 'Khách vãng lai',
    customerAvatar: data.customerAvatar,
    date: data.date || now.slice(0, 16),
    durationMinutes: Number(data.durationMinutes) || 60,
    price: Number(data.price) || 0,
    location: data.location?.trim() || '',
    isRecurring: data.isRecurring || false,
    recurrencePattern: data.recurrencePattern || 'none',
    hasReminder: data.hasReminder !== undefined ? data.hasReminder : true,
    reminderMinutes: data.reminderMinutes || 15,
    isOnline: data.isOnline || false,
    notes: data.notes?.trim() || '',
    isCompleted: data.isCompleted || false,
    priority: data.priority || 'Bình thường',
    status: data.status || (data.isCompleted ? 'Đã hoàn thành' : 'Đang chờ'),
    paymentStatus: data.paymentStatus || (data.isCompleted ? 'Đã thanh toán' : 'Chưa thanh toán'),
    color: data.color || '#3b82f6',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.APPOINTMENTS, appId), entity, { merge: true });

  // Đồng bộ với Thu nhập hợp nhất nếu đã hoàn thành
  if (entity.isCompleted || entity.status === 'Đã hoàn thành') {
    await saveIncomeTransaction(
      {
        appointmentId: appId,
        clientName: entity.customerName,
        serviceName: entity.title,
        amount: entity.price,
        date: entity.date.slice(0, 10),
        status: 'Đã trả',
        notes: `Tự động tạo từ lịch hẹn: ${entity.title}`,
      },
      userId
    );
  }

  return appId;
}

/**
 * Xóa một lịch hẹn
 */
export async function deleteAppointment(id: string, userId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.APPOINTMENTS, id));

  // Tự động xóa giao dịch thu nhập tương ứng nếu có
  try {
    const q = query(
      collection(db, COLLECTIONS.INCOME_TRANSACTIONS),
      where('appointmentId', '==', id),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    snap.forEach(async (d) => {
      await deleteIncomeTransaction(d.id);
    });
  } catch (e) {
    console.error('Failed to cleanup linked income transaction:', e);
  }
}

/**
 * Đổi trạng thái hoàn thành của lịch hẹn & đồng bộ thù lao
 */
export async function toggleAppointmentComplete(
  app: Appointment,
  userId: string
): Promise<void> {
  const nextCompleted = !app.isCompleted;
  const nextStatus: 'Đang chờ' | 'Đã hoàn thành' = nextCompleted ? 'Đã hoàn thành' : 'Đang chờ';
  const nextPayment: 'Chưa thanh toán' | 'Đã thanh toán' = nextCompleted ? 'Đã thanh toán' : 'Chưa thanh toán';

  await saveAppointment(
    {
      ...app,
      isCompleted: nextCompleted,
      status: nextStatus,
      paymentStatus: nextPayment,
    },
    userId
  );

  // Nếu đánh dấu chưa hoàn thành, xóa giao dịch thu nhập đồng bộ
  if (!nextCompleted) {
    const db = getDb();
    try {
      const q = query(
        collection(db, COLLECTIONS.INCOME_TRANSACTIONS),
        where('appointmentId', '==', app.id),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteIncomeTransaction(d.id);
      });
    } catch (e) {
      console.error('Failed to remove linked income transaction:', e);
    }
  }
}

/**
 * Lưu khách hàng mới hoặc cập nhật
 */
export async function saveCustomer(
  data: Partial<Customer>,
  userId: string
): Promise<string> {
  const db = getDb();
  const custRef = collection(db, COLLECTIONS.CUSTOMERS);
  const custId = data.id || doc(custRef).id;
  const now = new Date().toISOString();

  const entity: Customer = {
    id: custId,
    userId,
    name: data.name?.trim() || '',
    phone: data.phone?.trim() || '',
    email: data.email?.trim() || '',
    address: data.address?.trim() || '',
    group: data.group || 'Cá nhân',
    notes: data.notes?.trim() || '',
    avatarUrl: data.avatarUrl || '',
    totalRevenue: data.totalRevenue || 0,
    completedAppointmentsCount: data.completedAppointmentsCount || 0,
    upcomingAppointmentsCount: data.upcomingAppointmentsCount || 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.CUSTOMERS, custId), entity, { merge: true });
  return custId;
}

/**
 * Xóa khách hàng
 */
export async function deleteCustomer(id: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, id));
}

/**
 * Tạo dữ liệu mẫu nếu người dùng chưa có lịch hẹn nào
 */
export async function seedDemoSchedule(userId: string): Promise<void> {
  const c1 = await saveCustomer(
    {
      name: 'Nguyễn Văn Minh',
      phone: '0912345678',
      email: 'minh.nguyen@example.com',
      address: 'Hà Nội',
      group: 'VIP',
      notes: 'Phụ huynh học viên kèm nâng cao',
    },
    userId
  );

  const c2 = await saveCustomer(
    {
      name: 'Trần Thúy Hằng',
      phone: '0988776655',
      email: 'hang.tran@example.com',
      address: 'Đà Nẵng',
      group: 'Thường xuyên',
      notes: 'Học viên luyện đề cấp tốc',
    },
    userId
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  await saveAppointment(
    {
      title: 'Kèm Gia Sư Toán Nâng Cao 1-1',
      customerId: c1,
      customerName: 'Nguyễn Văn Minh',
      date: `${todayStr}T14:30`,
      durationMinutes: 90,
      price: 450000,
      location: 'Google Meet',
      isOnline: true,
      priority: 'Ưu tiên cao',
      notes: 'Chuyên đề Số Phức & Hình không gian',
      color: '#3b82f6',
    },
    userId
  );

  await saveAppointment(
    {
      title: 'Tư Vấn Định Hướng Ôn Thi ĐH',
      customerId: c2,
      customerName: 'Trần Thúy Hằng',
      date: `${todayStr}T19:00`,
      durationMinutes: 60,
      price: 300000,
      location: 'Zoom Meeting',
      isOnline: true,
      priority: 'Bình thường',
      notes: 'Đánh giá năng lực và lộ trình 3 tháng cuối',
      color: '#10b981',
    },
    userId
  );
}
