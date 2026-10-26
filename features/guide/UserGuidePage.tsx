'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Calendar,
  DollarSign,
  Settings,
  Sparkles,
  Search,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Lightbulb,
  Cloud,
  FileSpreadsheet,
  Clock,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Laptop,
  Zap,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { NavTabId } from '../../components/layout/Sidebar';

interface UserGuidePageProps {
  onNavigateTab: (tab: NavTabId) => void;
}

type GuideCategory = 'all' | 'quickstart' | 'classes' | 'schedule' | 'income' | 'cloud' | 'faq';

export const UserGuidePage: React.FC<UserGuidePageProps> = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const categories = [
    { id: 'all', label: 'Tất cả hướng dẫn', icon: BookOpen },
    { id: 'quickstart', label: 'Bắt đầu nhanh (4 bước)', icon: Zap },
    { id: 'classes', label: 'Quản lý Lớp & Buổi học', icon: GraduationCap },
    { id: 'schedule', label: 'Lịch tự do & Khách', icon: Calendar },
    { id: 'income', label: 'Thu nhập & Thù lao', icon: DollarSign },
    { id: 'cloud', label: 'Đồng bộ & Cài đặt', icon: Cloud },
    { id: 'faq', label: 'Câu hỏi thường gặp (FAQ)', icon: HelpCircle },
  ];

  const faqs = [
    {
      q: 'Dữ liệu lớp học và sổ thù lao của tôi có bị mất khi đổi máy tính hoặc tắt trình duyệt không?',
      a: 'Hoàn toàn không. Sổ Tay Béo tự động lưu trữ và đồng bộ thời gian thực đa thiết bị. Mọi thay đổi (thêm lớp, cập nhật học sinh, hoàn thành buổi dạy, lịch hẹn tự do) đều được bảo lưu an toàn tức thì. Bạn chỉ cần đăng nhập tài khoản trên bất kỳ thiết bị nào là toàn bộ dữ liệu luôn sẵn sàng.',
    },
    {
      q: 'Phần mềm tính thù lao mỗi buổi dạy như thế nào khi có học sinh vào thêm hoặc nghỉ hẳn giữa tháng?',
      a: 'Sổ Tay Béo quản lý học sinh theo Ngày vào học (Joined Date) và Ngày nghỉ hẳn (Dropped Date). Tại mỗi buổi dạy, hệ thống tự động xác định chính xác số lượng học sinh đang học (Active) vào đúng ngày hôm đó. Thù lao = Thù lao cố định / buổi + (Đơn giá mỗi học sinh × Sỹ số đang học). Khi học sinh thay đổi giữa tháng, bảng đối soát "Phân đoạn sỹ số (TimeSlice)" sẽ tự động chia nhỏ thời gian để bạn giải trình minh bạch.',
    },
    {
      q: 'Làm thế nào để thêm nhanh danh sách 30-50 học sinh vào lớp mà không phải nhập từng em?',
      a: 'Trong màn hình Chi tiết lớp học, hãy mở tab "Học viên" và bấm vào nút "Nhập từ Excel/Clipboard". Bạn chỉ cần mở file Excel hoặc bảng tính có sẵn, sao chép cột Họ tên và Số điện thoại (Ctrl+C hoặc Cmd+C), sau đó dán vào ô nhập liệu. Hệ thống sẽ tự động nhận diện và tạo danh sách học sinh chỉ trong 1 giây.',
    },
    {
      q: 'Tính năng Lịch mẫu (Schedule Pattern) giúp ích gì?',
      a: 'Lịch mẫu cho phép bạn thiết lập thời khóa biểu cố định hàng tuần cho lớp (ví dụ: Thứ 2, Thứ 4, Thứ 6 từ 18:30 - 20:30). Sau khi thiết lập, bạn có thể tự động sinh hàng loạt các buổi học cho cả tháng chỉ với 1 cú nhấp chuột mà không cần phải bấm tạo từng buổi lẻ.',
    },
    {
      q: 'Các trạng thái của buổi học trong lớp gồm những gì?',
      a: 'Mỗi buổi học có 4 trạng thái rõ ràng: (1) Hoàn thành (COMPLETED) - Đã dạy xong và thù lao được tính vào lương tháng; (2) Đã lên lịch (SCHEDULED) - Buổi học dự kiến trong tương lai; (3) Hủy buổi (CANCELLED) - Buổi dạy bị hủy; (4) Nghỉ lễ (HOLIDAY) - Nghỉ theo lịch lễ Tết.',
    },
    {
      q: 'Tôi dạy kèm 1-1 hoặc có khách hàng đặt lịch tư vấn riêng thì quản lý ở đâu?',
      a: 'Hãy sử dụng phân hệ "Lịch tự do" (Schedule). Tại đây bạn có thể lưu trữ danh bạ khách hàng, đặt các buổi hẹn theo khung giờ linh hoạt, đính kèm link học online (Google Meet, Zoom) hoặc địa điểm, và theo dõi riêng trạng thái hoàn thành / thanh toán.',
    },
    {
      q: 'Tính năng "Xem gần đây" trên thanh tiêu đề hoạt động như thế nào?',
      a: 'Biểu tượng đồng hồ trên thanh Header tự động ghi nhớ các lớp học hoặc màn hình bạn vừa thao tác gần nhất. Bạn có thể nhấp vào đó để chuyển nhanh qua lại giữa các lớp mà không cần phải quay ra trang danh sách tìm kiếm.',
    },
  ];

  // Lọc theo search và category
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const showQuickstart =
    (selectedCategory === 'all' || selectedCategory === 'quickstart') &&
    (matchesSearch('bắt đầu nhanh') ||
      matchesSearch('quy trình') ||
      matchesSearch('hướng dẫn') ||
      matchesSearch('lớp') ||
      matchesSearch('lịch') ||
      matchesSearch('buổi học') ||
      matchesSearch('thù lao'));

  const showClasses =
    (selectedCategory === 'all' || selectedCategory === 'classes') &&
    (matchesSearch('lớp học') ||
      matchesSearch('học viên') ||
      matchesSearch('sỹ số') ||
      matchesSearch('buổi dạy') ||
      matchesSearch('excel') ||
      matchesSearch('lịch mẫu') ||
      matchesSearch('thù lao') ||
      matchesSearch('timeslice'));

  const showSchedule =
    (selectedCategory === 'all' || selectedCategory === 'schedule') &&
    (matchesSearch('lịch tự do') ||
      matchesSearch('khách hàng') ||
      matchesSearch('lịch hẹn') ||
      matchesSearch('calendar') ||
      matchesSearch('hẹn') ||
      matchesSearch('gia sư'));

  const showIncome =
    (selectedCategory === 'all' || selectedCategory === 'income') &&
    (matchesSearch('thu nhập') ||
      matchesSearch('thù lao') ||
      matchesSearch('đối soát') ||
      matchesSearch('tiền') ||
      matchesSearch('thanh toán') ||
      matchesSearch('báo cáo'));

  const showCloud =
    (selectedCategory === 'all' || selectedCategory === 'cloud') &&
    (matchesSearch('đám mây') ||
      matchesSearch('cloud') ||
      matchesSearch('xem gần đây') ||
      matchesSearch('dark mode') ||
      matchesSearch('giao diện') ||
      matchesSearch('tài khoản'));

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    return faqs.filter(
      (f) => matchesSearch(f.q) || matchesSearch(f.a)
    );
  }, [searchQuery]);

  const showFaqSection = (selectedCategory === 'all' || selectedCategory === 'faq') && filteredFaqs.length > 0;

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-16 px-1 sm:px-2">
      {/* =========================================================================
          HERO BANNER
          ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-10 shadow-xl shadow-blue-500/15">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Cẩm Nang & Tài Liệu Trực Quan</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Hướng Dẫn Sử Dụng Sổ Tay Béo 2.0
          </h1>

          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Hệ thống toàn diện giúp Quý Thầy/Cô và các Freelancer quản lý lớp học, theo dõi sỹ số tự động,
            nhật ký bài giảng, lên lịch hẹn khách hàng và đối soát thù lao minh bạch, đồng bộ dữ liệu đa thiết bị.
          </p>

          {/* Ô tìm kiếm nhanh */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm: Thù lao, sỹ số, import Excel, buổi học, lịch hẹn, đồng bộ..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm shadow-lg shadow-black/10 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CATEGORY FILTER PILLS
          ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as GuideCategory)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer border ${active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20 font-semibold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          QUICK START: 4 BƯỚC BẮT ĐẦU NHANH
          ========================================================================= */}
      {showQuickstart && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lộ Trình Bắt Đầu Nhanh (4 Bước Chuẩn)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chỉ mất 2 phút để làm quen và thiết lập luồng giảng dạy của bạn
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bước 1 */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:border-blue-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  1
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Khởi tạo
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tạo Lớp Học</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Vào tab <strong>Lớp học</strong>, bấm <strong>Thêm Lớp Mới</strong>. Thiết lập tên lớp, thù lao cố định / buổi và mức cộng thêm trên mỗi học sinh.
              </p>
              <button
                onClick={() => onNavigateTab('classes')}
                className="w-full text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Đến màn Lớp học</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bước 2 */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  2
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Học sinh & Lịch
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dán Danh Sách & Lịch Mẫu</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dán nhanh cột Họ tên & SĐT từ Excel vào lớp. Cấu hình Lịch mẫu lặp lại (thứ trong tuần, giờ dạy) để tự động sinh các buổi học trong tháng.
              </p>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-2 px-3 rounded-xl font-medium">
                ⚡ Tiết kiệm 90% thời gian tạo buổi
              </div>
            </div>

            {/* Bước 3 */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:border-indigo-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  3
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Ghi nhận
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hoàn Thành Buổi Dạy</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sau mỗi ca dạy, chọn buổi học và chuyển trạng thái sang <strong>Hoàn thành</strong>. Hệ thống tự động chốt sỹ số active và tính tiền buổi dạy.
              </p>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 py-2 px-3 rounded-xl font-medium">
                📝 Có thể ghi chú đề bài & bài tập
              </div>
            </div>

            {/* Bước 4 */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative group hover:border-violet-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  4
                </span>
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                  Đối soát
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đối Soát Thù Lao</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mở tab <strong>Thù lao</strong> để xem tổng tiền tích lũy trong tháng, bảng phân đoạn biến động sỹ số và phân loại khoản đã nhận hay chờ thanh toán.
              </p>
              <button
                onClick={() => onNavigateTab('income')}
                className="w-full text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>Xem Thù Lao</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PHÂN HỆ 1: QUẢN LÝ LỚP HỌC & BUỔI HỌC CHI TIẾT
          ========================================================================= */}
      {showClasses && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  1. Phân Hệ Quản Lý Lớp Học, Sỹ Số & Buổi Dạy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trung tâm vận hành các lớp học, hồ sơ học sinh, lịch lặp lại và tự động tính toán thù lao theo sỹ số thực tế
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('classes')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Mở Quản lý Lớp học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Tạo và cấu hình lớp */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Tạo lớp học & Cấu hình mức thù lao</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Bấm <strong>"Thêm Lớp Mới"</strong> trên đầu trang danh sách.</li>
                <li>Điền <strong>Tên lớp</strong> (ví dụ: Toán 10 Nâng Cao, Tiếng Anh Giao Tiếp K12).</li>
                <li><strong>Thù lao cố định / buổi:</strong> Mức thù lao cứng cho mỗi ca dạy (ví dụ: 300.000đ).</li>
                <li><strong>Thù lao cộng thêm / 1 học sinh:</strong> Đơn giá nhân thêm trên mỗi học sinh đang học (ví dụ: 20.000đ/hs).</li>
                <li>Chọn <strong>Màu đại diện</strong> giúp phân biệt nhanh chóng trên lịch và bảng thống kê.</li>
              </ul>
            </div>

            {/* Card 2: Quản lý học sinh & Import Excel */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Quản lý học sinh theo Ngày vào / Ngày nghỉ</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Mở tab <strong>"Học viên"</strong> trong chi tiết lớp học.</li>
                <li>Bấm <strong>"Nhập từ Excel/Clipboard"</strong> để dán danh sách hàng loạt nhanh chóng.</li>
                <li>Mỗi học sinh gắn liền với <strong>Ngày bắt đầu học (Joined Date)</strong> và <strong>Ngày nghỉ hẳn (Dropped Date)</strong>.</li>
                <li>Trạng thái học sinh: <span className="font-semibold text-emerald-600">Đang học (ACTIVE)</span> hoặc <span className="font-semibold text-slate-500">Nghỉ hẳn (DROPPED)</span>.</li>
              </ul>
            </div>

            {/* Card 3: Lịch mẫu */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Lịch mẫu lặp lại (Schedule Pattern)</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Trong chi tiết lớp, chọn mục <strong>"Lịch mẫu"</strong>.</li>
                <li>Chọn các thứ trong tuần (ví dụ Thứ 2, Thứ 4, Thứ 6) và khung giờ bắt đầu / kết thúc.</li>
                <li>Bấm <strong>"Sinh buổi học tự động"</strong> cho khoảng thời gian bạn muốn (theo tháng hoặc cả quý).</li>
                <li>Các buổi học sẽ được tạo tự động với trạng thái <em>SCHEDULED (Đã lên lịch)</em>.</li>
              </ul>
            </div>

            {/* Card 4: Quản lý Buổi dạy & Nhật ký */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Buổi dạy, Sỹ số thực tế & Nhật ký bài học</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-disc list-inside">
                <li>Tại mỗi buổi học, hệ thống tự đối soát ngày dạy với danh sách học sinh để tính ra <strong>Sỹ số thực tế (calculatedHeadcount)</strong>.</li>
                <li>Chuyển trạng thái sang <strong>COMPLETED (Đã hoàn thành)</strong> sau khi dạy xong để ghi nhận thù lao.</li>
                <li>Nếu lớp nghỉ, chuyển sang <strong>CANCELLED (Hủy buổi)</strong> hoặc <strong>HOLIDAY (Nghỉ lễ)</strong>.</li>
                <li>Ghi lại <strong>Nội dung bài giảng</strong> và <strong>Bài tập về nhà</strong> để tiện theo dõi tiến độ.</li>
              </ul>
            </div>
          </div>

          {/* TimeSlice explanation highlight */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
              <p className="font-bold">Giải trình thù lao minh bạch với Bảng Phân Đoạn Sỹ Số (TimeSlice Breakdown):</p>
              <p className="text-indigo-900/85 dark:text-indigo-300">
                Khi có học sinh vào mới hoặc nghỉ hẳn giữa tháng, sỹ số lớp sẽ thay đổi. Hệ thống tự động chia tháng thành các khoảng thời gian tương ứng (ví dụ: từ 01-15/10 sỹ số 12 bạn, từ 16-31/10 sỹ số 14 bạn) kèm số buổi đã dạy và tổng tiền chính xác, giúp bạn xuất báo cáo đối soát thù lao không thể tranh cãi!
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PHÂN HỆ 2: LỊCH TỰ DO & KHÁCH HÀNG
          ========================================================================= */}
      {showSchedule && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  2. Phân Hệ Lịch Tự Do & Lịch Hẹn Khách Hàng
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dành cho gia sư kèm riêng 1-1, lịch hẹn tư vấn, dạy kèm hoặc công việc tự do freelance
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Mở Lịch Tự Do</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Danh bạ Khách hàng & Học viên 1-1</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Lưu trữ thông tin liên hệ, ghi chú nhu cầu, giá thỏa thuận của từng khách hàng hoặc phụ huynh.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Tạo lịch hẹn (Appointment)</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tạo lịch hẹn theo ngày giờ, gắn khách hàng, nội dung dịch vụ, link phòng Zoom/Meet hoặc địa điểm gặp mặt.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span>Xem Lịch Biểu Trực Quan</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Chuyển đổi dễ dàng giữa chế độ Lịch tháng / Lịch tuần và Danh sách sự kiện để không bao giờ bị trùng ca dạy.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PHÂN HỆ 3: THU NHẬP & ĐỐI SOÁT THÙ LAO
          ========================================================================= */}
      {showIncome && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  3. Phân Hệ Thu Nhập & Báo Cáo Đối Soát Thù Lao
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hợp nhất mọi nguồn thù lao giảng dạy và lịch hẹn, minh bạch từng đồng
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('income')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Mở Màn Thu Nhập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                💰 Cơ chế tổng hợp thu nhập tự động
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mỗi khi bạn đánh dấu Hoàn thành một buổi dạy trong lớp hoặc lịch hẹn tự do, thù lao sẽ tự động tính toán và đưa vào bảng kê thu nhập của tháng đó.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Đã thanh toán
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  Chờ thanh toán
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                ➕ Thêm khoản thu nhập ngoài hệ thống
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nếu bạn có các khoản tiền thưởng, phụ cấp biên soạn giáo trình, hoặc thù lao từ nguồn khác, bấm nút <strong>"Thêm Khoản Thu"</strong> để ghi nhận ngay.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ lọc theo từng tháng, xem chỉ số tích lũy lũy kế và dự kiến thu nhập trọn tháng nếu dạy đủ lịch.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PHÂN HỆ 4: ĐỒNG BỘ ĐÁM MÂY & CÀI ĐẶT
          ========================================================================= */}
      {showCloud && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  4. Đồng Bộ Dữ Liệu & Cài Đặt Hồ Sơ
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quản lý tài khoản, đồng bộ thời gian thực và cài đặt hiển thị
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('settings')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Vào Cài Đặt Hồ Sơ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bảo Mật Dữ Liệu Riêng Tư</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dữ liệu của bạn được mã hóa an toàn và bảo vệ riêng biệt. Không ai khác có thể truy cập sổ tay của bạn.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Laptop className="w-4 h-4 text-blue-500" />
                <span>Đa Thiết Bị (Desktop & Web)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Làm việc mượt mà trên máy tính để bàn (Desktop App) lẫn trình duyệt Web di động mọi lúc mọi nơi.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Giao Diện Sáng / Tối</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Tùy chọn Dark Mode giúp bạn êm dịu mắt khi chấm bài hay lên lịch vào ban đêm. Bấm nút Mặt Trời / Mặt Trăng trên góc phải.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          PHẦN 5: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION)
          ========================================================================= */}
      {showFaqSection && (
        <section className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                5. Câu Hỏi Thường Gặp (FAQ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Giải đáp nhanh các thắc mắc thường gặp trong quá trình sử dụng
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition cursor-pointer gap-4"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {faq.q}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 sm:p-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 leading-relaxed animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          BOTTOM HELP & SUPPORT BANNER
          ========================================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-100 to-slate-200/80 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Cần hỗ trợ thêm hoặc góp ý tính năng mới?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
            Đội ngũ phát triển Sổ Tay Béo luôn sẵn sàng lắng nghe phản hồi của Quý Thầy/Cô để cập nhật các tính năng quản lý giảng dạy tối ưu nhất.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('settings')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Xem Cài Đặt Hồ Sơ</span>
          </button>
          <button
            onClick={() => onNavigateTab('classes')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Bắt Đầu Với Lớp Học</span>
          </button>
        </div>
      </div>
    </div>
  );
};
