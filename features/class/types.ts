// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU PHÂN HỆ QUẢN LÝ LỚP HỌC - SỔ TAY BÉO 2.0
// ==============================================================================

export type StudentStatus = 'ACTIVE' | 'DROPPED';
export type SessionStatus = 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'HOLIDAY';

/**
 * Thông tin một Lớp học
 */
export interface ClassEntity {
  id: string;
  userId: string;
  className: string;           // Tên lớp (VD: Toán 10 - Luyện thi ĐH)
  centerName?: string;         // Tên trung tâm hoặc hình thức (VD: Gia sư Online, Trung tâm ABC)
  baseFeePerSession: number;   // Thù lao cố định / buổi học (VND)
  ratePerStudent: number;      // Thù lao cộng thêm / 1 học sinh / buổi (VND)
  color?: string;              // Màu đại diện cho lớp (dùng render badge / calendar)
  description?: string;        // Mô tả thêm
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Học sinh trong lớp học
 */
export interface ClassStudentEntity {
  id: string;
  userId: string;
  classId: string;             // ID lớp học trực thuộc
  fullName: string;            // Họ và tên học sinh
  phoneNumber: string;         // Số điện thoại liên lạc
  parentName?: string;         // Tên phụ huynh (nếu có)
  status: StudentStatus;       // 'ACTIVE' (Đang học) | 'DROPPED' (Nghỉ hẳn)
  joinedDate: string;          // Ngày bắt đầu vào học ('YYYY-MM-DD')
  droppedDate?: string | null; // Ngày chính thức nghỉ hẳn ('YYYY-MM-DD')
  notes?: string;              // Ghi chú đặc biệt
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Cấu hình lịch học định kỳ trong tuần của lớp
 */
export interface SchedulePatternEntity {
  id: string;
  userId: string;
  classId: string;
  dayOfWeek: number;           // 0 (Chủ nhật), 1 (Thứ 2) -> 6 (Thứ 7)
  startTime: string;           // 'HH:mm' (VD: '18:30')
  endTime: string;             // 'HH:mm' (VD: '20:30')
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Một buổi học trong tháng & Nhật ký giảng dạy
 */
export interface ClassSessionEntity {
  id: string;
  userId: string;
  classId: string;
  sessionDate: string;         // Ngày diễn ra buổi dạy ('YYYY-MM-DD')
  startTime: string;           // 'HH:mm'
  endTime: string;             // 'HH:mm'
  status: SessionStatus;       // 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'HOLIDAY'
  calculatedHeadcount: number; // Sỹ số học sinh active tại đúng ngày sessionDate
  calculatedSalary: number;    // Thù lao được tính cho buổi dạy
  lessonTopic?: string;        // Nội dung bài giảng hôm nay
  homework?: string;           // Bài tập về nhà giao cho học sinh
  notes?: string;              // Nhật ký / đánh giá buổi dạy
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Chỉ số KPI tổng hợp theo tháng của lớp học
 */
export interface ClassMonthlyMetrics {
  activeHeadcount: number;        // Sỹ số học sinh hiện tại đang học
  startOfMonthHeadcount: number;  // Sỹ số ngày đầu tháng
  trendType: 'INCREASED' | 'DECREASED' | 'UNCHANGED';
  trendDiff: number;              // Chênh lệch sỹ số (+/-)
  trendPercent: number;           // Phần trăm tăng trưởng
  completedSessionsCount: number; // Số buổi đã dạy thành công (COMPLETED)
  totalSessionsInMonth: number;   // Tổng số buổi học trong tháng
  accumulatedSalaryToDate: number;// Thù lao tích lũy các buổi đã dạy
  projectedMonthlySalary: number; // Dự kiến thù lao trọn tháng (nếu dạy đủ)
}

/**
 * Phân đoạn thời gian theo biến động sỹ số (dùng để giải trình đối soát thù lao minh bạch)
 */
export interface TimeSliceBreakdown {
  startDate: string;
  endDate: string;
  headcount: number;
  sessionCount: number;
  rateDescription: string;
  totalSalary: number;
  studentsInSlice: ClassStudentEntity[];
}
