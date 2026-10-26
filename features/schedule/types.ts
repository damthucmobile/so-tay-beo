export type CustomerGroup = 'Mới' | 'Thường xuyên' | 'Tiềm năng' | 'Cá nhân' | 'Doanh nghiệp' | 'VIP';

export const CUSTOMER_GROUPS: CustomerGroup[] = [
  'Mới',
  'Thường xuyên',
  'Tiềm năng',
  'Cá nhân',
  'Doanh nghiệp',
  'VIP',
];

export const APPOINTMENT_PRIORITIES = ['Bình thường', 'Ưu tiên cao'] as const;
export const APPOINTMENT_STATUSES = ['Đang chờ', 'Đã hoàn thành', 'Đã hủy'] as const;
export const PAYMENT_STATUSES = ['Chưa thanh toán', 'Đã thanh toán'] as const;

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  group: CustomerGroup;
  notes: string;
  avatarUrl?: string;
  totalRevenue: number;
  completedAppointmentsCount: number;
  upcomingAppointmentsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  title: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  date: string; // ISO string e.g. 'YYYY-MM-DDTHH:mm'
  durationMinutes: number;
  price: number;
  location: string;
  isRecurring?: boolean;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  hasReminder?: boolean;
  reminderMinutes?: number;
  isOnline?: boolean;
  notes?: string;
  isCompleted: boolean;
  priority: 'Bình thường' | 'Ưu tiên cao';
  status: 'Đang chờ' | 'Đã hoàn thành' | 'Đã hủy';
  paymentStatus?: 'Chưa thanh toán' | 'Đã thanh toán';
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduleTabType = 'calendar' | 'appointments' | 'customers';
export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';
