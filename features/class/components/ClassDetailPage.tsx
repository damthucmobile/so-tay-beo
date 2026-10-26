'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useHeaderStore } from '../../../stores/useHeaderStore';
import { useActivityTracker } from '@/core/firebase';
import {
  ClassEntity,
  ClassStudentEntity,
  ClassSessionEntity,
  SchedulePatternEntity,
  SessionStatus,
} from '../types';
import {
  calculateClassMonthlyMetrics,
  generateTimeSliceBreakdowns,
} from '../utils/salaryCalculator';
import {
  exportClassSalaryExcel,
  generateSalaryReportText,
} from '../utils/exportClassExcel';
import { SchedulePatternModal } from './SchedulePatternModal';
import { SessionEditModal } from './SessionEditModal';
import { ImportStudentModal } from './ImportStudentModal';
import {
  Users,
  Calendar,
  DollarSign,
  UserPlus,
  FileSpreadsheet,
  Edit2,
  Trash2,
  X,
  UserX,
  CheckCircle2,
  Clock,
  Info,
  CalendarDays,
  Upload,
  Sparkles,
  Plus,
  Settings,
  MoreHorizontal,
  CheckSquare,
  Square,
  Check,
  ChevronDown,
  Phone,
  RefreshCw,
  Copy,
  TrendingUp,
  TrendingDown,
  BookOpen,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';

interface ClassDetailPageProps {
  classItem: ClassEntity;
  students: ClassStudentEntity[];
  sessions: ClassSessionEntity[];
  patterns: SchedulePatternEntity[];
  selectedMonth: string;
  onBack: () => void;
  onSaveStudent: (data: Partial<ClassStudentEntity>) => Promise<string>;
  onMarkStudentDropped: (studentId: string, droppedDate: string) => Promise<void>;
  onReactivateStudent: (studentId: string) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onSaveSchedulePatterns: (
    classId: string,
    patterns: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ) => Promise<void>;
  onGenerateMonthlySessions: (classId: string, monthStr: string) => Promise<number>;
  onUpdateSessionStatus: (sessionId: string, status: SessionStatus) => Promise<void>;
  onBulkUpdateSessionStatus: (sessionIds: string[], status: SessionStatus) => Promise<void>;
  onBulkDeleteSessions: (sessionIds: string[]) => Promise<void>;
  onSaveSingleSession: (data: Partial<ClassSessionEntity>) => Promise<void>;
  onRecalculateSessions: (classId: string) => Promise<void>;
}

export const ClassDetailPage: React.FC<ClassDetailPageProps> = ({
  classItem,
  students,
  sessions,
  patterns,
  selectedMonth,
  onBack,
  onSaveStudent,
  onMarkStudentDropped,
  onReactivateStudent,
  onDeleteStudent,
  onSaveSchedulePatterns,
  onGenerateMonthlySessions,
  onUpdateSessionStatus,
  onBulkUpdateSessionStatus,
  onBulkDeleteSessions,
  onSaveSingleSession,
  onRecalculateSessions,
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'sessions' | 'breakdown'>('students');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DROPPED'>('ALL');

  const { setCustomHeader } = useHeaderStore();
  const { trackManualView } = useActivityTracker();

  // Tự động ghi nhận lượt xem vào Recent Views & Activity Logs
  useEffect(() => {
    trackManualView({
      contentId: classItem.id,
      contentType: 'class',
      title: classItem.className,
      subtitle: classItem.centerName || 'Lớp học',
      route: `/classes/${classItem.id}`,
    });
  }, [classItem.id, classItem.className, classItem.centerName, trackManualView]);

  useEffect(() => {
    setCustomHeader({
      title: classItem.className,
      subtitle: `${classItem.centerName || 'Lớp độc lập'} • Tháng ${selectedMonth}`,
      badge: 'Chi Tiết Lớp',
      showBackButton: true,
      onBack,
    });
    return () => {
      setCustomHeader(null);
    };
  }, [classItem.className, classItem.centerName, selectedMonth, onBack, setCustomHeader]);

  // Modals học sinh
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<ClassStudentEntity | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentParentName, setStudentParentName] = useState('');
  const [studentJoinedDate, setStudentJoinedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [studentNotes, setStudentNotes] = useState('');

  // Modal Đánh dấu nghỉ học
  const [dropStudentTarget, setDropStudentTarget] = useState<ClassStudentEntity | null>(null);
  const [droppedDateInput, setDroppedDateInput] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modals buổi học & Lịch tuần
  const [isSessionEditModalOpen, setIsSessionEditModalOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<ClassSessionEntity | null>(null);
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Chỉ số KPI tháng
  const metrics = useMemo(() => {
    return calculateClassMonthlyMetrics(classItem, students, sessions, selectedMonth);
  }, [classItem, students, sessions, selectedMonth]);

  // Phân đoạn đối soát thù lao
  const slices = useMemo(() => {
    return generateTimeSliceBreakdowns(classItem, students, sessions, selectedMonth);
  }, [classItem, students, sessions, selectedMonth]);

  // Lọc học sinh
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchSearch =
        st.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        st.phoneNumber.includes(studentSearch) ||
        (st.notes && st.notes.toLowerCase().includes(studentSearch.toLowerCase()));

      const matchStatus =
        studentStatusFilter === 'ALL' ? true : st.status === studentStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [students, studentSearch, studentStatusFilter]);

  // Các buổi học trong tháng được chọn
  const monthlySessions = useMemo(() => {
    return sessions
      .filter((s) => s.sessionDate.startsWith(selectedMonth))
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  }, [sessions, selectedMonth]);

  // --------------------------------------------------------------------------
  // HÀNH ĐỘNG HỌC SINH
  // --------------------------------------------------------------------------
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentName('');
    setStudentPhone('');
    setStudentParentName('');
    setStudentJoinedDate(format(new Date(), 'yyyy-MM-dd'));
    setStudentNotes('');
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st: ClassStudentEntity) => {
    setEditingStudent(st);
    setStudentName(st.fullName);
    setStudentPhone(st.phoneNumber);
    setStudentParentName(st.parentName || '');
    setStudentJoinedDate(st.joinedDate);
    setStudentNotes(st.notes || '');
    setIsStudentModalOpen(true);
  };

  const handleSaveStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    try {
      await onSaveStudent({
        id: editingStudent ? editingStudent.id : undefined,
        classId: classItem.id,
        fullName: studentName.trim(),
        phoneNumber: studentPhone.trim(),
        parentName: studentParentName.trim(),
        status: editingStudent ? editingStudent.status : 'ACTIVE',
        joinedDate: studentJoinedDate,
        notes: studentNotes.trim(),
      });
      setIsStudentModalOpen(false);
    } catch (err) {
      alert('Lỗi lưu học sinh: ' + String(err));
    }
  };

  const handleConfirmDropStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropStudentTarget) return;

    try {
      await onMarkStudentDropped(dropStudentTarget.id, droppedDateInput);
      setDropStudentTarget(null);
    } catch (err) {
      alert('Lỗi cập nhật nghỉ học: ' + String(err));
    }
  };

  const handleImportStudents = async (studentList: Partial<ClassStudentEntity>[]) => {
    for (const st of studentList) {
      await onSaveStudent({ ...st, classId: classItem.id });
    }
  };

  // --------------------------------------------------------------------------
  // HÀNH ĐỘNG BUỔI HỌC
  // --------------------------------------------------------------------------
  const handleGenerateSessions = async () => {
    if (patterns.length === 0) {
      setIsPatternModalOpen(true);
      return;
    }

    try {
      setIsGenerating(true);
      const count = await onGenerateMonthlySessions(classItem.id, selectedMonth);
      alert(`Đã tự động khởi tạo thành công ${count} buổi học cho tháng ${selectedMonth}.`);
    } catch (err) {
      alert('Lỗi tạo buổi học: ' + String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSelectSession = (id: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllSessions = () => {
    if (selectedSessionIds.length === monthlySessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(monthlySessions.map((s) => s.id));
    }
  };

  const handleBulkStatusChange = async (status: SessionStatus) => {
    if (selectedSessionIds.length === 0) return;
    try {
      await onBulkUpdateSessionStatus(selectedSessionIds, status);
      setSelectedSessionIds([]);
    } catch (err) {
      alert('Lỗi cập nhật hàng loạt: ' + String(err));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessionIds.length === 0) return;
    if (confirm(`Bạn có chắc muốn xóa ${selectedSessionIds.length} buổi học đã chọn?`)) {
      try {
        await onBulkDeleteSessions(selectedSessionIds);
        setSelectedSessionIds([]);
      } catch (err) {
        alert('Lỗi xóa buổi học: ' + String(err));
      }
    }
  };

  const handleRecalculate = async () => {
    try {
      setIsRecalculating(true);
      await onRecalculateSessions(classItem.id);
      alert('Đã tính toán lại sỹ số và thù lao cho toàn bộ buổi học thành công!');
    } catch (err) {
      alert('Lỗi tính toán: ' + String(err));
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleExportExcel = () => {
    exportClassSalaryExcel(classItem, students, sessions, slices, selectedMonth);
  };

  const handleCopyReport = () => {
    const text = generateSalaryReportText(classItem, students, sessions, slices, selectedMonth);
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* THANH THÔNG TIN ĐƠN GIÁ & HÀNH ĐỘNG NHANH CỦA LỚP                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Cố định: <strong className="text-slate-800 dark:text-slate-200 font-mono">{classItem.baseFeePerSession.toLocaleString('vi-VN')}đ</strong>/buổi
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Đầu HS: <strong className="text-slate-800 dark:text-slate-200 font-mono">{classItem.ratePerStudent.toLocaleString('vi-VN')}đ</strong>/HS/buổi
          </span>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPatternModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Thiết lập các thứ và khung giờ học cố định trong tuần"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Lịch Tuần ({patterns.length})</span>
          </button>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition cursor-pointer"
            title="Tính toán lại sỹ số và thù lao cho toàn bộ buổi học"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 CARDS CHỈ SỐ NHANH CỦA LỚP                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Sỹ Số Hiện Tại
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-baseline gap-2">
            <span>{metrics.activeHeadcount}</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">học sinh</span>
            {metrics.trendType === 'INCREASED' && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{metrics.trendDiff}
              </span>
            )}
            {metrics.trendType === 'DECREASED' && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {metrics.trendDiff}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Đầu tháng: {metrics.startOfMonthHeadcount} HS</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Buổi Đã Dạy
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-baseline gap-2">
            <span>{metrics.completedSessionsCount}</span>
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ {metrics.totalSessionsInMonth} buổi</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Tháng {selectedMonth}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Thù Lao Tích Lũy
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {metrics.accumulatedSalaryToDate.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Các buổi đã COMPLETED</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Dự Kiến Cả Tháng
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2 truncate">
            {metrics.projectedMonthlySalary.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Nếu hoàn thành hết lịch</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB NAVIGATION: 3 TABS                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'students'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Học Sinh ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'sessions'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch Học & Nhật Ký Buổi Dạy ({monthlySessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('breakdown')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'breakdown'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Bảng Giải Trình Đối Soát ({slices.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 1: DANH SÁCH HỌC SINH                                        */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls tìm kiếm & nút thêm */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên, số điện thoại..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 shadow-sm dark:shadow-none"
                />
              </div>

              {/* Lọc trạng thái */}
              <select
                value={studentStatusFilter}
                onChange={(e) => setStudentStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 shadow-sm dark:shadow-none cursor-pointer"
              >
                <option value="ALL">Tất cả ({students.length})</option>
                <option value="ACTIVE">Đang học ({students.filter((s) => s.status === 'ACTIVE').length})</option>
                <option value="DROPPED">Đã thôi học ({students.filter((s) => s.status === 'DROPPED').length})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Nhập Excel / Dán Text</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm Học Sinh</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách học sinh */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
            {filteredStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                Chưa có học sinh nào phù hợp với bộ lọc tìm kiếm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-4 py-3.5">Học Sinh</th>
                      <th className="px-4 py-3.5">Liên Lạc</th>
                      <th className="px-4 py-3.5">Trạng Thái</th>
                      <th className="px-4 py-3.5">Ngày Vào Học</th>
                      <th className="px-4 py-3.5">Ngày Nghỉ (nếu có)</th>
                      <th className="px-4 py-3.5">Ghi Chú</th>
                      <th className="px-4 py-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                              {st.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{st.fullName}</p>
                              {st.parentName && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">Phụ huynh: {st.parentName}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                          {st.phoneNumber ? (
                            <a
                              href={`tel:${st.phoneNumber}`}
                              className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              <Phone className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              <span>{st.phoneNumber}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {st.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                              Đang học
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-semibold">
                              Đã nghỉ hẳn
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">{st.joinedDate}</td>
                        <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {st.droppedDate ? <span className="text-red-500 dark:text-red-400">{st.droppedDate}</span> : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{st.notes || '-'}</td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            {st.status === 'ACTIVE' ? (
                              <button
                                onClick={() => {
                                  setDropStudentTarget(st);
                                  setDroppedDateInput(format(new Date(), 'yyyy-MM-dd'));
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                                title="Đánh dấu nghỉ học"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onReactivateStudent(st.id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                                title="Khôi phục đang học lại"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEditStudent(st)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa học sinh "${st.fullName}"?`)) {
                                  onDeleteStudent(st.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 2: LỊCH DẠY & NHẬT KÝ BUỔI HỌC                               */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm dark:shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllSessions}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {selectedSessionIds.length === monthlySessions.length && monthlySessions.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                )}
                <span>Chọn tất cả ({monthlySessions.length})</span>
              </button>

              {selectedSessionIds.length > 0 && (
                <div className="flex items-center gap-1.5 animate-fadeIn">
                  <button
                    onClick={() => handleBulkStatusChange('COMPLETED')}
                    className="px-2.5 py-1.5 bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Đánh dấu Đã dạy ({selectedSessionIds.length})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-2.5 py-1.5 bg-red-600/10 dark:bg-red-600/20 hover:bg-red-600/20 dark:hover:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Xóa ({selectedSessionIds.length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateSessions}
                disabled={isGenerating}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Đang tạo lịch...' : `Sinh Lịch Tự Động Tháng ${selectedMonth}`}</span>
              </button>
            </div>
          </div>

          {/* Danh sách các buổi dạy */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
            {monthlySessions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                Chưa có buổi học nào trong tháng {selectedMonth}. Hãy bấm nút "Sinh Lịch Tự Động" ở trên.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="w-10 px-4 py-3.5 text-center">#</th>
                      <th className="px-4 py-3.5">Ngày & Giờ Học</th>
                      <th className="px-4 py-3.5">Trạng Thái</th>
                      <th className="px-4 py-3.5">Sỹ Số Hiệu Lực</th>
                      <th className="px-4 py-3.5">Thù Lao Buổi Dạy</th>
                      <th className="px-4 py-3.5">Nội Dung / Bài Giảng</th>
                      <th className="px-4 py-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {monthlySessions.map((s) => {
                      const isSelected = selectedSessionIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition ${
                            isSelected ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectSession(s.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {s.sessionDate}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>
                                {s.startTime} - {s.endTime}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <select
                              value={s.status}
                              onChange={(e) =>
                                onUpdateSessionStatus(s.id, e.target.value as SessionStatus)
                              }
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition focus:outline-none cursor-pointer ${
                                s.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : s.status === 'SCHEDULED'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : s.status === 'HOLIDAY'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                              }`}
                            >
                              <option value="COMPLETED">✅ Đã dạy (COMPLETED)</option>
                              <option value="SCHEDULED">📅 Lên lịch (SCHEDULED)</option>
                              <option value="HOLIDAY">🏖️ Nghỉ lễ (HOLIDAY)</option>
                              <option value="CANCELLED">❌ Hủy (CANCELLED)</option>
                            </select>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {s.calculatedHeadcount} HS
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`font-bold font-mono ${
                                s.status === 'COMPLETED'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : s.status === 'SCHEDULED'
                                  ? 'text-slate-600 dark:text-slate-400'
                                  : 'text-slate-400 dark:text-slate-600 line-through'
                              }`}
                            >
                              {(s.calculatedSalary || 0).toLocaleString('vi-VN')} đ
                            </span>
                          </td>

                          <td className="px-4 py-3.5 max-w-[220px]">
                            {s.lessonTopic ? (
                              <p className="text-slate-800 dark:text-slate-200 truncate font-medium">{s.lessonTopic}</p>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 italic">Chưa ghi nhận nội dung</span>
                            )}
                            {s.notes && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{s.notes}</p>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSessionToEdit(s);
                                  setIsSessionEditModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition cursor-pointer"
                                title="Chỉnh sửa chi tiết buổi học"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NỘI DUNG TAB 3: BẢNG GIẢI TRÌNH ĐỐI SOÁT THÙ LAO (TIME-SLICE BREAKDOWN)    */}
      {/* ========================================================================= */}
      {activeTab === 'breakdown' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Bảng giải trình & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-md">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Bảng Giải Trình Phân Đoạn Sỹ Số</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                  Tự động đối soát
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chia nhỏ các khoảng thời gian có biến động học sinh để tính toán thù lao chuẩn xác tuyệt đối.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>{copiedReport ? '✓ Đã sao chép' : 'Sao chép Zalo'}</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Báo Cáo Excel</span>
              </button>
            </div>
          </div>

          {/* Bảng phân đoạn */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-xl">
            {slices.length === 0 ? (
              <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                Chưa có dữ liệu phân đoạn cho tháng {selectedMonth}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="w-12 px-4 py-3.5 text-center">STT</th>
                      <th className="px-4 py-3.5">Khoảng Thời Gian</th>
                      <th className="px-4 py-3.5">Sỹ Số (Active)</th>
                      <th className="px-4 py-3.5">Số Buổi Dạy Đã Hoàn Thành</th>
                      <th className="px-4 py-3.5">Đơn Giá Áp Dụng</th>
                      <th className="px-4 py-3.5 text-right">Thành Tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {slices.map((slice, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5 text-center font-mono text-slate-400 dark:text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <span className="text-slate-800 dark:text-slate-200">{slice.startDate}</span>
                          <span className="text-slate-400 dark:text-slate-500 mx-1.5">➔</span>
                          <span className="text-slate-800 dark:text-slate-200">{slice.endDate}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                            <Users className="w-3 h-3" />
                            {slice.headcount} học sinh
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {slice.sessionCount} buổi
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {slice.rateDescription}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {slice.totalSalary.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* TỔNG CỘNG */}
                  <tfoot className="bg-slate-50 dark:bg-slate-950/80 border-t-2 border-slate-200 dark:border-slate-800 font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-slate-600 dark:text-slate-300 text-right uppercase">
                        TỔNG CỘNG THÁNG {selectedMonth}:
                      </td>
                      <td className="px-4 py-4 text-slate-900 dark:text-white">
                        {slices.reduce((sum, s) => sum + s.sessionCount, 0)} buổi
                      </td>
                      <td className="px-4 py-4 text-slate-400 dark:text-slate-500">-</td>
                      <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 text-base font-black font-mono">
                        {slices.reduce((sum, s) => sum + s.totalSalary, 0).toLocaleString('vi-VN')} VNĐ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA HỌC SINH                                                 */}
      {/* ========================================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Cập Nhật Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Họ và tên học sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Hoàng Nam..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Tên phụ huynh (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chị Lan (mẹ Nam)..."
                  value={studentParentName}
                  onChange={(e) => setStudentParentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Ngày bắt đầu vào học
                </label>
                <input
                  type="date"
                  value={studentJoinedDate}
                  onChange={(e) => setStudentJoinedDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về học lực, tính cách..."
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  {editingStudent ? 'Cập Nhật' : 'Thêm Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ĐÁNH DẤU NGHỈ HỌC                                                   */}
      {/* ========================================================================= */}
      {dropStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Đánh Dấu Nghỉ Học</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{dropStudentTarget.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmDropStudent} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Ngày chính thức nghỉ học:
                </label>
                <input
                  type="date"
                  value={droppedDateInput}
                  onChange={(e) => setDroppedDateInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-red-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sỹ số lớp sẽ tự động dừng tính cho học sinh này kể từ sau ngày được chọn.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDropStudentTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  Xác Nhận Nghỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LỊCH TUẦN, BUỔI HỌC & IMPORT                                        */}
      {/* ========================================================================= */}
      <SchedulePatternModal
        isOpen={isPatternModalOpen}
        onClose={() => setIsPatternModalOpen(false)}
        patterns={patterns}
        classNameTitle={classItem.className}
        onSave={(newPatterns) => onSaveSchedulePatterns(classItem.id, newPatterns)}
      />

      <SessionEditModal
        isOpen={isSessionEditModalOpen}
        onClose={() => setIsSessionEditModalOpen(false)}
        session={sessionToEdit}
        onSave={onSaveSingleSession}
      />

      <ImportStudentModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        classId={classItem.id}
        onImport={handleImportStudents}
      />
    </div>
  );
};
