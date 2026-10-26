'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Trash2,
  Edit3,
  MoreVertical,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/core/utils/formatters';
import { Appointment, Customer } from '../types';
import { AppointmentModal } from './AppointmentModal';

interface AppointmentPageProps {
  appointments: Appointment[];
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'all' | 'pending' | 'completed';
  onStatusFilterChange: (status: 'all' | 'pending' | 'completed') => void;
  onSaveAppointment: (data: Partial<Appointment>) => Promise<any>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onToggleComplete: (app: Appointment) => Promise<void>;
}

export const AppointmentPage: React.FC<AppointmentPageProps> = ({
  appointments,
  customers,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSaveAppointment,
  onDeleteAppointment,
  onToggleComplete,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return appointments.filter((app) => {
      const matchesSearch =
        app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.location.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'completed') return matchesSearch && app.isCompleted;
      if (statusFilter === 'pending') return matchesSearch && !app.isCompleted;
      return matchesSearch;
    });
  }, [appointments, searchQuery, statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingAppointment(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (app: Appointment) => {
    setEditingAppointment(app);
    setIsAddModalOpen(true);
  };

  const handleUpdateStatus = (app: Appointment, newStatus: 'Đang chờ' | 'Đã hoàn thành' | 'Đã hủy') => {
    const isCompleted = newStatus === 'Đã hoàn thành';
    onSaveAppointment({
      ...app,
      status: newStatus,
      isCompleted,
      paymentStatus: isCompleted ? 'Đã thanh toán' : 'Chưa thanh toán',
    });
    setOpenDropdownId(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-4 animate-fadeIn">
      {/* Top Action Controls */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Lịch Hẹn</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            placeholder="Tìm theo tiêu đề, khách hàng, địa điểm..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Tất cả ({appointments.length})
          </button>
          <button
            onClick={() => onStatusFilterChange('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Đang chờ ({appointments.filter((a) => !a.isCompleted).length})
          </button>
          <button
            onClick={() => onStatusFilterChange('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Đã hoàn thành ({appointments.filter((a) => a.isCompleted).length})
          </button>
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-4 py-3">Công Việc / Tiêu Đề</th>
              <th className="px-4 py-3">Khách Hàng</th>
              <th className="px-4 py-3">Thời Gian</th>
              <th className="px-4 py-3">Địa Điểm</th>
              <th className="px-4 py-3 text-right">Giá Dịch Vụ</th>
              <th className="px-4 py-3 text-center">Trạng Thái</th>
              <th className="px-4 py-3 text-center">Ưu Tiên</th>
              <th className="px-4 py-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Chưa có lịch hẹn nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr
                  key={app.id}
                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition ${
                    app.isCompleted ? 'opacity-80 bg-slate-50/40 dark:bg-slate-950/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`font-semibold text-slate-900 dark:text-white ${
                        app.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {app.title}
                    </div>
                    {app.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{app.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{app.customerName}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{formatDate(app.date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="truncate max-w-[150px]">{app.location || 'Chưa rõ'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-blue-600 dark:text-blue-400 text-xs">
                    {formatCurrency(app.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        app.status === 'Đã hoàn thành'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : app.status === 'Đã hủy'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        app.priority === 'Ưu tiên cao'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {app.priority}
                    </span>
                  </td>

                  {/* Actions column */}
                  <td className="px-4 py-3 text-right relative">
                    <div className="inline-block text-left">
                      <button
                        onClick={() =>
                          setOpenDropdownId((cur) => (cur === app.id ? null : app.id))
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openDropdownId === app.id && (
                        <div
                          className="absolute right-4 mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-30 p-1.5 text-xs animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                            Trạng Thái
                          </div>
                          <button
                            onClick={() => handleUpdateStatus(app, 'Đã hoàn thành')}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition cursor-pointer ${
                              app.status === 'Đã hoàn thành' ? 'text-emerald-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Đã hoàn thành</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app, 'Đang chờ')}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition cursor-pointer ${
                              app.status === 'Đang chờ' ? 'text-amber-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Đang chờ</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app, 'Đã hủy')}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition cursor-pointer ${
                              app.status === 'Đã hủy' ? 'text-red-600 font-bold' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            <span>Đã hủy</span>
                          </button>

                          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                          <button
                            onClick={() => {
                              handleOpenEditModal(app);
                              setOpenDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition cursor-pointer text-slate-700 dark:text-slate-300"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                            <span>Chỉnh sửa thông tin</span>
                          </button>
                          <button
                            onClick={() => {
                              onDeleteAppointment(app.id);
                              setOpenDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition cursor-pointer text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xóa lịch hẹn</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAppointment(null);
        }}
        initialData={editingAppointment}
        customers={customers}
        onSave={onSaveAppointment}
      />
    </div>
  );
};
