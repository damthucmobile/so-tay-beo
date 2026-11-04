// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU PHÂN HỆ QUẢN LÝ THU - CHI & TÀI CHÍNH - SỔ TAY BÉO 2.0
// ==============================================================================

export type TransactionType = 'expense' | 'income';
export type FinanceViewMode = 'all' | 'expense' | 'income';

export type ExpenseCategory = string;
export type IncomeCategory = string;

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'e_wallet';

export interface ExpenseItem {
  id: string;
  userId: string;
  type?: TransactionType; // 'expense' (mặc định) hoặc 'income'
  amount: number;
  category: ExpenseCategory;
  date: string; // 'YYYY-MM-DD'
  time?: string; // 'HH:mm'
  description: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FinanceTransaction = ExpenseItem;

export interface MonthlyBudget {
  id?: string;
  userId: string;
  month: string; // 'YYYY-MM'
  totalBudget: number; // Hạn mức ngân sách chi tiêu tháng
  updatedAt?: string;
}

export interface CategoryMeta {
  id: string;
  label: string;
  type?: TransactionType; // 'expense' (mặc định) hoặc 'income'
  iconName: string;
  color: string;
  bgColor?: string;
  description?: string;
  isCustom?: boolean;
  userId?: string;
  createdAt?: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'food',
    label: 'Ăn uống',
    iconName: 'Utensils',
    color: '#f97316', // orange-500
    bgColor: '#fff7ed', // orange-50
    description: 'Cơm trưa, cafe, đi chợ, siêu thị, ăn ngoài',
    isCustom: false,
  },
  {
    id: 'transport',
    label: 'Đi lại & Xăng xe',
    iconName: 'Car',
    color: '#3b82f6', // blue-500
    bgColor: '#eff6ff', // blue-50
    description: 'Xăng xe máy/ô tô, gửi xe, taxi, bảo dưỡng',
    isCustom: false,
  },
  {
    id: 'bills',
    label: 'Nhà cửa & Hóa đơn',
    iconName: 'Zap',
    color: '#eab308', // yellow-500
    bgColor: '#fefce8', // yellow-50
    description: 'Tiền thuê nhà, điện, nước, internet, dịch vụ chung cư',
    isCustom: false,
  },
  {
    id: 'shopping',
    label: 'Mua sắm',
    iconName: 'ShoppingBag',
    color: '#a855f7', // purple-500
    bgColor: '#faf5ff', // purple-50
    description: 'Quần áo, đồ dùng cá nhân, đồ gia dụng, thiết bị',
    isCustom: false,
  },
  {
    id: 'education',
    label: 'Giáo dục & Công việc',
    iconName: 'BookOpen',
    color: '#10b981', // emerald-500
    bgColor: '#ecfdf5', // emerald-50
    description: 'Sách vở, giáo trình, khóa học, văn phòng phẩm',
    isCustom: false,
  },
  {
    id: 'health',
    label: 'Y tế & Sức khỏe',
    iconName: 'HeartPulse',
    color: '#f43f5e', // rose-500
    bgColor: '#fff1f2', // rose-50
    description: 'Thuốc men, khám bệnh, vitamin, phòng tập thể thao',
    isCustom: false,
  },
  {
    id: 'entertainment',
    label: 'Giải trí & Xã giao',
    iconName: 'Coffee',
    color: '#ec4899', // pink-500
    bgColor: '#fdf2f8', // pink-50
    description: 'Xem phim, liên hoan bạn bè, quà tặng, hiếu hỉ',
    isCustom: false,
  },
  {
    id: 'family',
    label: 'Gia đình & Con cái',
    iconName: 'Users',
    color: '#06b6d4', // cyan-500
    bgColor: '#ecfeff', // cyan-50
    description: 'Sữa bỉm, đồ chơi, tiền tiêu vặt cho con, biếu bố mẹ',
    isCustom: false,
  },
  {
    id: 'other',
    label: 'Chi phí khác',
    iconName: 'MoreHorizontal',
    color: '#71717a', // zinc-500
    bgColor: '#f4f4f5', // zinc-100
    description: 'Các khoản phát sinh đột xuất khác',
    isCustom: false,
    type: 'expense',
  },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryMeta[] = [
  {
    id: 'salary',
    label: 'Lương cố định',
    iconName: 'Briefcase',
    color: '#10b981', // emerald-500
    bgColor: '#ecfdf5',
    description: 'Lương cơ bản, phụ cấp công tác, lương tháng',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'bonus',
    label: 'Thưởng & Phụ cấp',
    iconName: 'Gift',
    color: '#f59e0b', // amber-500
    bgColor: '#fffbeb',
    description: 'Thưởng KPI, hoa hồng, tiền thưởng lễ tết',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'tutoring',
    label: 'Dạy thêm & Gia sư',
    iconName: 'GraduationCap',
    color: '#3b82f6', // blue-500
    bgColor: '#eff6ff',
    description: 'Thù lao dạy kèm, ôn luyện thi, thù lao ngoài',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'investment',
    label: 'Đầu tư & Lãi suất',
    iconName: 'TrendingUp',
    color: '#06b6d4', // cyan-500
    bgColor: '#ecfeff',
    description: 'Lãi tiền gửi, cổ tức, lợi nhuận tài chính',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'business',
    label: 'Bán hàng & Kinh doanh',
    iconName: 'ShoppingBag',
    color: '#a855f7', // purple-500
    bgColor: '#faf5ff',
    description: 'Doanh thu bán lẻ, làm thêm dự án tự do',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'gift',
    label: 'Quà tặng & Trợ cấp',
    iconName: 'Heart',
    color: '#ec4899', // pink-500
    bgColor: '#fdf2f8',
    description: 'Tiền biếu tặng, mừng sinh nhật, trợ cấp gia đình',
    isCustom: false,
    type: 'income',
  },
  {
    id: 'other_income',
    label: 'Thu nhập khác',
    iconName: 'MoreHorizontal',
    color: '#71717a', // zinc-500
    bgColor: '#f4f4f5',
    description: 'Các nguồn tiền thu phát sinh khác',
    isCustom: false,
    type: 'income',
  },
];

// Giữ lại alias để tương thích ngược
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES;
export const DEFAULT_FINANCE_CATEGORIES = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];

export const CATEGORY_COLORS = [
  '#10b981', // Emerald (chủ đạo cho thu nhập)
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#71717a', // Zinc
];

export const AVAILABLE_CATEGORY_ICONS = [
  { name: 'Utensils', label: 'Ăn uống' },
  { name: 'Car', label: 'Xe cộ' },
  { name: 'Zap', label: 'Điện nước' },
  { name: 'ShoppingBag', label: 'Mua sắm' },
  { name: 'BookOpen', label: 'Học tập' },
  { name: 'HeartPulse', label: 'Y tế' },
  { name: 'Coffee', label: 'Cafe / Hẹn hò' },
  { name: 'Users', label: 'Gia đình' },
  { name: 'Dog', label: 'Thú cưng' },
  { name: 'Sparkles', label: 'Làm đẹp' },
  { name: 'PiggyBank', label: 'Tiết kiệm' },
  { name: 'TrendingUp', label: 'Đầu tư' },
  { name: 'Briefcase', label: 'Lương / Đi làm' },
  { name: 'GraduationCap', label: 'Dạy học / Gia sư' },
  { name: 'Coins', label: 'Tiền / Thưởng' },
  { name: 'Heart', label: 'Quà / Trợ cấp' },
  { name: 'Building', label: 'Thuê nhà / BĐS' },
  { name: 'Laptop', label: 'Freelance / Công nghệ' },
  { name: 'Shield', label: 'Bảo hiểm' },
  { name: 'Gift', label: 'Quà tặng' },
  { name: 'Dumbbell', label: 'Thể thao' },
  { name: 'Plane', label: 'Du lịch' },
  { name: 'Film', label: 'Giải trí' },
  { name: 'Tag', label: 'Khác' },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'transfer', label: 'Chuyển khoản' },
  { id: 'cash', label: 'Tiền mặt' },
  { id: 'card', label: 'Thẻ tín dụng / ATM' },
  { id: 'e_wallet', label: 'Ví MoMo / ZaloPay / ShopeePay' },
];

export interface SpendingStats {
  totalSpent: number; // Tổng chi
  totalExpense: number; // Tổng chi
  totalIncome: number; // Tổng thu
  netBalance: number; // Số dư ròng (Thu - Chi)
  savingsRate: number; // Tỷ lệ tiết kiệm (%)
  monthlyBudget: number;
  remainingBudget: number;
  percentUsed: number;
  dailyAverage: number;
  topCategory: { category: ExpenseCategory; label: string; amount: number; percent: number; color?: string; iconName?: string } | null;
  topIncomeCategory: { category: IncomeCategory; label: string; amount: number; percent: number; color?: string; iconName?: string } | null;
  categoryBreakdown: { category: ExpenseCategory; label: string; amount: number; percent: number; color: string; iconName?: string }[];
  incomeBreakdown: { category: IncomeCategory; label: string; amount: number; percent: number; color: string; iconName?: string }[];
}
