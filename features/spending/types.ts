// ==============================================================================
// ĐỊNH NGHĨA DỮ LIỆU PHÂN HỆ QUẢN LÝ CHI TIÊU ĐỜI SỐNG - SỔ TAY BÉO 2.0
// ==============================================================================

export type ExpenseCategory = string;

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'e_wallet';

export interface ExpenseItem {
  id: string;
  userId: string;
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

export interface MonthlyBudget {
  id?: string;
  userId: string;
  month: string; // 'YYYY-MM'
  totalBudget: number; // Hạn mức ngân sách tháng
  updatedAt?: string;
}

export interface CategoryMeta {
  id: string;
  label: string;
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
  },
];

// Giữ lại alias để tương thích ngược
export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;

export const CATEGORY_COLORS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#a855f7', // Purple
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#eab308', // Amber
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
  totalSpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  percentUsed: number;
  dailyAverage: number;
  topCategory: { category: ExpenseCategory; label: string; amount: number; percent: number; color?: string; iconName?: string } | null;
  categoryBreakdown: { category: ExpenseCategory; label: string; amount: number; percent: number; color: string; iconName?: string }[];
}
