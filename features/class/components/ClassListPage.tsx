'use client';

import React, { useState, useMemo } from 'react';
import {
  ClassEntity,
  ClassStudentEntity,
  ClassSessionEntity,
  SchedulePatternEntity,
} from '../types';
import { calculateClassMonthlyMetrics } from '../utils/salaryCalculator';
import {
  GraduationCap,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Calendar,
  Search,
  BookOpen,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ChevronLeft,
  CalendarDays,
  Building,
} from 'lucide-react';
import { format, parseISO, subMonths, addMonths } from 'date-fns';
import { CurrencyInput } from '@/components/ui/CurrencyInput';

interface ClassListPageProps {
  classes: ClassEntity[];
  studentsByClass: Record<string, ClassStudentEntity[]>;
  sessionsByClass: Record<string, ClassSessionEntity[]>;
  patternsByClass: Record<string, SchedulePatternEntity[]>;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onSelectClass: (classId: string) => void;
  onSaveClass: (classData: Partial<ClassEntity>) => Promise<string>;
  onDeleteClass: (classId: string) => Promise<void>;
  onSeedDemo: () => Promise<void>;
  isLoading: boolean;
}

const CLASS_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
];

export const ClassListPage: React.FC<ClassListPageProps> = ({
  classes,
  studentsByClass,
  sessionsByClass,
  patternsByClass,
  selectedMonth,
  onSelectMonth,
  onSelectClass,
  onSaveClass,
  onDeleteClass,
  onSeedDemo,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassEntity | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form Lớp học
  const [classNameInput, setClassNameInput] = useState('');
  const [centerNameInput, setCenterNameInput] = useState('');
  const [baseFeeInput, setBaseFeeInput] = useState<number>(150000);
  const [ratePerStudentInput, setRatePerStudentInput] = useState<number>(25000);
  const [colorInput, setColorInput] = useState<string>(CLASS_COLORS[0]);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điều hướng tháng
  const handlePrevMonth = () => {
    const d = parseISO(`${selectedMonth}-01`);
    onSelectMonth(format(subMonths(d, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const d = parseISO(`${selectedMonth}-01`);
    onSelectMonth(format(addMonths(d, 1), 'yyyy-MM'));
  };

  // Mở modal tạo mới
  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassNameInput('');
    setCenterNameInput('');
    setBaseFeeInput(150000);
    setRatePerStudentInput(25000);
    setColorInput(CLASS_COLORS[Math.floor(Math.random() * CLASS_COLORS.length)]);
    setDescriptionInput('');
    setIsClassModalOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEdit = (c: ClassEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass(c);
    setClassNameInput(c.className);
    setCenterNameInput(c.centerName || '');
    setBaseFeeInput(c.baseFeePerSession);
    setRatePerStudentInput(c.ratePerStudent);
    setColorInput(c.color || CLASS_COLORS[0]);
    setDescriptionInput(c.description || '');
    setIsClassModalOpen(true);
  };

  // Lưu lớp học
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    try {
      setIsSubmitting(true);
      await onSaveClass({
        id: editingClass ? editingClass.id : undefined,
        className: classNameInput.trim(),
        centerName: centerNameInput.trim(),
        baseFeePerSession: Number(baseFeeInput) || 0,
        ratePerStudent: Number(ratePerStudentInput) || 0,
        color: colorInput,
        description: descriptionInput.trim(),
      });
      setIsClassModalOpen(false);
    } catch (err) {
      alert('Lỗi lưu lớp học: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: ClassEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc chắn muốn xóa lớp "${c.className}"? Toàn bộ học sinh và buổi học của lớp sẽ bị xóa.`)) {
      try {
        await onDeleteClass(c.id);
      } catch (err) {
        alert('Lỗi xóa lớp học: ' + String(err));
      }
    }
  };

  const handleRunSeed = async () => {
    try {
      setIsSeeding(true);
      await onSeedDemo();
    } catch (err) {
      alert('Lỗi tạo dữ liệu mẫu: ' + String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  // Tính toán KPI tổng hợp toàn bộ các lớp trong tháng đã chọn
  const overallKPI = useMemo(() => {
    let totalActiveStudents = 0;
    let totalCompletedSessions = 0;
    let totalAccumulatedSalary = 0;
    let totalProjectedSalary = 0;

    classes.forEach((c) => {
      const sts = studentsByClass[c.id] || [];
      const ses = sessionsByClass[c.id] || [];
      const m = calculateClassMonthlyMetrics(c, sts, ses, selectedMonth);
      totalActiveStudents += m.activeHeadcount;
      totalCompletedSessions += m.completedSessionsCount;
      totalAccumulatedSalary += m.accumulatedSalaryToDate;
      totalProjectedSalary += m.projectedMonthlySalary;
    });

    return {
      totalClasses: classes.length,
      totalActiveStudents,
      totalCompletedSessions,
      totalAccumulatedSalary,
      totalProjectedSalary,
    };
  }, [classes, studentsByClass, sessionsByClass, selectedMonth]);

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.centerName && c.centerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [classes, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* KPI DASHBOARD CARDS TỔNG THỂ                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Số lớp */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng số lớp</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {overallKPI.totalClasses}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Đang trực tiếp quản lý</p>
        </div>

        {/* Card 2: Sỹ số học sinh active */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Học sinh đang học</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {overallKPI.totalActiveStudents}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Sỹ số hiệu lực tháng {selectedMonth}</p>
        </div>

        {/* Card 3: Buổi học đã dạy */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Số buổi học Hoàn thành</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {overallKPI.totalCompletedSessions}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Trong tháng {selectedMonth}</p>
        </div>

        {/* Card 4: Thù lao tích lũy */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Thù lao đã tích luỹ</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {overallKPI.totalAccumulatedSalary.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            Dự kiến cả tháng: {overallKPI.totalProjectedSalary.toLocaleString('vi-VN')} đ
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* THANH TÌM KIẾM & BỘ LỌC / HÀNH ĐỘNG                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học theo tên lớp, trung tâm online..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition shadow-sm dark:shadow-inner"
          />
        </div>

        {/* Toolbar: Bộ chọn tháng & Nút hành động */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          {/* Bộ chọn tháng đối soát */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span>Tháng {selectedMonth}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nút Seed Demo nếu chưa có lớp nào */}
          {classes.length === 0 && (
            <button
              onClick={handleRunSeed}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-purple-600/10 dark:bg-purple-600/20 hover:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span>{isSeeding ? 'Đang tạo mẫu...' : 'Tạo Lớp Mẫu Demo'}</span>
            </button>
          )}

          {/* Nút Tạo lớp mới */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lớp mới</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DANH SÁCH CÁC LỚP HỌC (GRID CARDS)                                        */}
      {/* ========================================================================= */}
      {filteredClasses.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/40">
          <GraduationCap className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Chưa có lớp học nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Hãy bắt đầu bằng việc tạo lớp học đầu tiên hoặc bấm nút tạo lớp mẫu để làm quen ngay.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleRunSeed}
              className="px-4 py-2 bg-purple-600/10 dark:bg-purple-600/20 hover:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tạo Lớp Mẫu Demo
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Tạo Lớp Học Mới
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredClasses.map((c) => {
            const sts = studentsByClass[c.id] || [];
            const ses = sessionsByClass[c.id] || [];
            const pats = patternsByClass[c.id] || [];
            const metrics = calculateClassMonthlyMetrics(c, sts, ses, selectedMonth);

            return (
              <div
                key={c.id}
                onClick={() => onSelectClass(c.id)}
                className="bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800/90 hover:border-blue-500/50 rounded-3xl p-5 shadow-sm dark:shadow-xl hover:shadow-md dark:hover:shadow-2xl transition duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Dải màu nhận diện trên đầu card */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: c.color || '#3b82f6' }}
                />

                {/* Phần thông tin tiêu đề */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                        {c.className}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{c.centerName || 'Lớp độc lập / Gia sư'}</span>
                      </div>
                    </div>

                    {/* Nút sửa / xóa */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEdit(c, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa lớp"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(c, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Xóa lớp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mô tả ngắn nếu có */}
                  {c.description && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 mb-2.5">
                      {c.description}
                    </p>
                  )}

                  {/* Đơn giá thù lao */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl text-xs space-y-2 my-3">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Đơn giá cố định:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.baseFeePerSession.toLocaleString('vi-VN')} đ/buổi
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Đơn giá theo đầu HS:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.ratePerStudent.toLocaleString('vi-VN')} đ/HS/buổi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thống kê tháng mục tiêu */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                      <span>Sỹ số hiện tại:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{metrics.activeHeadcount}</span>
                      {metrics.trendType === 'INCREASED' && (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> +{metrics.trendDiff}
                        </span>
                      )}
                      {metrics.trendType === 'DECREASED' && (
                        <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> {metrics.trendDiff}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Buổi dạy (T.{selectedMonth}):</span>
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {metrics.completedSessionsCount} / {metrics.totalSessionsInMonth} buổi
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>Thù lao tích lũy:</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {metrics.accumulatedSalaryToDate.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {/* Nút xem chi tiết */}
                  <div className="pt-2.5 flex items-center justify-end text-blue-600 dark:text-blue-400 text-xs font-semibold group-hover:translate-x-1 transition">
                    <span>Xem chi tiết & lịch dạy</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TẠO / SỬA LỚP HỌC                                                   */}
      {/* ========================================================================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingClass ? 'Cập Nhật Lớp Học' : 'Tạo Lớp Học Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Thiết lập thông tin và cơ chế tính thù lao</p>
                </div>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Tên lớp học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Toán 10 - Nâng Cao A1..."
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Trung tâm / Đơn vị tổ chức
                </label>
                <input
                  type="text"
                  placeholder="VD: Gia sư Khang Thịnh, Trung tâm MathPro..."
                  value={centerNameInput}
                  onChange={(e) => setCenterNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Thù lao cố định / buổi (VNĐ)
                  </label>
                  <CurrencyInput
                    value={baseFeeInput}
                    onChange={(val) => setBaseFeeInput(val)}
                    placeholder="150.000"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Thù lao / 1 HS / buổi (VNĐ)
                  </label>
                  <CurrencyInput
                    value={ratePerStudentInput}
                    onChange={(val) => setRatePerStudentInput(val)}
                    placeholder="25.000"
                  />
                </div>
              </div>

              {/* Màu sắc nhận diện */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">Màu sắc nhận diện</label>
                <div className="flex items-center gap-3">
                  {CLASS_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColorInput(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${colorInput === c ? 'ring-2 ring-blue-500 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Ghi chú mô tả */}
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Mô tả thêm</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về giáo trình, mục tiêu đào tạo..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : editingClass ? 'Lưu Cập Nhật' : 'Tạo Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
