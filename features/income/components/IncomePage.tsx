'use client';

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Calendar,
  GraduationCap,
  Briefcase,
  Layers,
  CalendarRange,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building,
} from 'lucide-react';
import { ClassEntity, ClassStudentEntity, ClassSessionEntity } from '../../class/types';
import {
  IncomeTransaction,
  TimeFilterMode,
} from '../types';
import {
  consolidateAllIncome,
} from '../utils/incomeConsolidator';
import { AddIncomeModal } from './AddIncomeModal';

interface IncomePageProps {
  classes: ClassEntity[];
  sessionsByClass: Record<string, ClassSessionEntity[]>;
  studentsByClass: Record<string, ClassStudentEntity[]>;
  transactions: IncomeTransaction[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterMode: TimeFilterMode;
  onFilterModeChange: (mode: TimeFilterMode) => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  selectedYear: string;
  onSelectYear: (year: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
  onAddTransaction: (tx: Partial<IncomeTransaction>) => Promise<any>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onMarkAsPaid: (id: string) => Promise<void>;
  onCleanDuplicates: () => Promise<number>;
}

export const IncomePage: React.FC<IncomePageProps> = ({
  classes,
  sessionsByClass,
  studentsByClass,
  transactions,
  isLoading,
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  selectedMonth,
  onSelectMonth,
  selectedYear,
  onSelectYear,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onAddTransaction,
  onDeleteTransaction,
  onMarkAsPaid,
  onCleanDuplicates,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'class' | 'freelance'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanNotice, setCleanNotice] = useState<string | null>(null);

  // Danh sách năm động cho dropdown
  const yearOptions = useMemo(() => {
    const curYear = new Date().getFullYear();
    return [curYear - 2, curYear - 1, curYear, curYear + 1];
  }, []);

  // Hợp nhất dữ liệu thu nhập
  const consolidation = useMemo(() => {
    return consolidateAllIncome(
      classes,
      sessionsByClass,
      studentsByClass,
      transactions,
      filterMode,
      selectedMonth,
      selectedYear,
      customStartDate,
      customEndDate
    );
  }, [
    classes,
    sessionsByClass,
    studentsByClass,
    transactions,
    filterMode,
    selectedMonth,
    selectedYear,
    customStartDate,
    customEndDate,
  ]);

  // Lọc items theo từ khóa tìm kiếm
  const filteredConsolidatedItems = useMemo(() => {
    if (!searchQuery.trim()) return consolidation.consolidatedItems;
    const q = searchQuery.toLowerCase();
    return consolidation.consolidatedItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q)
    );
  }, [consolidation.consolidatedItems, searchQuery]);

  const handleClean = async () => {
    try {
      setIsCleaning(true);
      const count = await onCleanDuplicates();
      if (count > 0) {
        setCleanNotice(`Đã làm sạch ${count} giao dịch trùng lặp thành công.`);
      } else {
        setCleanNotice('Không phát hiện giao dịch trùng lặp nào.');
      }
      setTimeout(() => setCleanNotice(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================================= */}
      {/* TOP ACTION BAR                                                            */}
      {/* ========================================================================= */}
      {/* TOOLBAR 1 HÀNG TỐI ƯU: BỘ LỌC THỜI GIAN & HÀNH ĐỘNG THU NHẬP               */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-sm">
        {/* Nhóm bên trái: Bộ lọc thời gian */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs chuyển chế độ */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={() => onFilterModeChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterMode === 'month'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Theo tháng</span>
            </button>
            <button
              onClick={() => onFilterModeChange('year')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterMode === 'year'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
              <span>Theo năm</span>
            </button>
            <button
              onClick={() => onFilterModeChange('custom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterMode === 'custom'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Khoảng tùy chọn</span>
            </button>
          </div>

          {/* Dynamic input theo mode */}
          {filterMode === 'month' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium">Tháng:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-mono"
              />
            </div>
          )}

          {filterMode === 'year' && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => onSelectYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-mono"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y.toString()} className="bg-white dark:bg-slate-900">
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-400">Từ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomStartDateChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Đến:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomEndDateChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Nhóm bên phải: Nút hành động */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClean}
            disabled={isCleaning}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            title="Lọc và dọn dẹp các bản ghi trùng lặp"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isCleaning ? 'Đang lọc...' : 'Làm sạch trùng'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận thu nhập</span>
          </button>
        </div>
      </div>

      {cleanNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>{cleanNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 THẺ CHỈ SỐ TÀI CHÍNH (FINANCIAL KPI CARDS)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng thu nhập thực nhận */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng thu nhập thực nhận</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {consolidation.totalEarned.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium">VNĐ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Thực nhận trong chu kỳ lọc</span>
          </div>
        </div>

        {/* Card 2: Thù lao Lớp học Online */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Thù lao Lớp học Online</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {consolidation.classIncomeTotal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium">VNĐ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Từ {consolidation.classSummaries.length} lớp học đang quản lý</span>
          </div>
        </div>

        {/* Card 3: Thu nhập Lịch tự do 1-1 */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Thu nhập Lịch tự do 1-1</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {consolidation.freelanceIncomeTotal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium">VNĐ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>{consolidation.freelanceTransactions.filter((t) => t.status === 'Đã trả').length} giao dịch đã thu</span>
          </div>
        </div>

        {/* Card 4: Chờ thanh toán */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Chờ thanh toán</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {consolidation.pendingIncomeTotal.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400 font-medium">VNĐ</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>{consolidation.freelanceTransactions.filter((t) => t.status === 'Chờ').length} khoản đang chờ thu</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TABS BẢNG CHI TIẾT & TÌM KIẾM                                          */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tổng hợp dòng tiền ({consolidation.consolidatedItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'class'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Thù lao lớp học ({consolidation.classSummaries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('freelance')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === 'freelance'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Giao dịch tự do ({consolidation.freelanceTransactions.length})</span>
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm dòng tiền..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* TAB 1: TỔNG HỢP DÒNG TIỀN */}
        {activeTab === 'all' && (
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Nguồn dòng tiền</th>
                    <th className="px-5 py-3.5">Tên lớp / Khách hàng</th>
                    <th className="px-5 py-3.5">Chi tiết / Nội dung</th>
                    <th className="px-5 py-3.5">Ngày phát sinh</th>
                    <th className="px-5 py-3.5 text-right">Số tiền (VNĐ)</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredConsolidatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        Không tìm thấy giao dịch thu nhập nào trong khoảng thời gian được chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredConsolidatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5">
                          {item.source === 'CLASS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                              <GraduationCap className="w-3 h-3" /> Lớp Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                              <Briefcase className="w-3 h-3" /> Tự do 1-1
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                          <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {item.details}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{item.date}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                          {item.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'Đã hoàn thành' || item.status === 'Đã trả'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              }`}
                          >
                            <CheckCircle2 className="w-3 h-3" /> {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: THÙ LAO THEO LỚP HỌC */}
        {activeTab === 'class' && (
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5 w-12 text-center">STT</th>
                    <th className="px-5 py-3.5">Tên lớp học</th>
                    <th className="px-5 py-3.5">Trung tâm / Đơn vị</th>
                    <th className="px-5 py-3.5">Số buổi đã dạy</th>
                    <th className="px-5 py-3.5">Đơn giá áp dụng</th>
                    <th className="px-5 py-3.5 text-right">Lũy kế thù lao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {consolidation.classSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        Chưa có lớp học nào trong hệ thống.
                      </td>
                    </tr>
                  ) : (
                    consolidation.classSummaries.map((s, idx) => (
                      <tr key={s.classId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: s.color || '#3b82f6' }}
                          />
                          <span>{s.className}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.centerName}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                          {s.completedSessionsCount} buổi hoàn thành
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {s.baseFeePerSession.toLocaleString('vi-VN')} đ + {s.ratePerStudent.toLocaleString('vi-VN')} đ/HS
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                          {s.totalSalaryInPeriod.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GIAO DỊCH LỊCH TỰ DO 1-1 */}
        {activeTab === 'freelance' && (
          <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Dịch vụ / Nội dung</th>
                    <th className="px-5 py-3.5">Ngày giao dịch</th>
                    <th className="px-5 py-3.5 text-right">Số tiền</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {consolidation.freelanceTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        Chưa có giao dịch khách hàng 1-1 nào trong khoảng thời gian được chọn.
                      </td>
                    </tr>
                  ) : (
                    consolidation.freelanceTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {tx.clientName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                          {tx.serviceName}
                          {tx.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">{tx.notes}</p>}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-500">{tx.date}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                          {tx.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${tx.status === 'Đã trả'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}
                          >
                            {tx.status === 'Đã trả' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tx.status === 'Chờ' && (
                              <button
                                onClick={() => onMarkAsPaid(tx.id)}
                                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="Xác nhận đã thanh toán"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã thu</span>
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                              title="Xóa giao dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL THÊM GIAO DỊCH */}
      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddTransaction}
      />
    </div>
  );
};
