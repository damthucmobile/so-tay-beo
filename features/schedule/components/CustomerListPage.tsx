'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/core/utils/formatters';
import { Customer, Appointment } from '../types';
import { CustomerModal } from './CustomerModal';

interface CustomerListPageProps {
  customers: Customer[];
  appointments: Appointment[];
  onSaveCustomer: (data: Partial<Customer>) => Promise<any>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export const CustomerListPage: React.FC<CustomerListPageProps> = ({
  customers,
  appointments,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const selectedCustomer = useMemo(() => {
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      filteredCustomers[0] ||
      null
    );
  }, [customers, selectedCustomerId, filteredCustomers]);

  // Helper to dynamically calculate total revenue for a customer from completed appointments
  const getCustomerRevenue = (customer?: Customer | null): number => {
    if (!customer) return 0;
    const completedAppts = appointments.filter(
      (a) =>
        (a.customerId === customer.id ||
          a.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()) &&
        (a.status === 'Đã hoàn thành' || a.isCompleted === true)
    );
    return completedAppts.reduce((sum, a) => sum + (a.price || 0), 0);
  };

  // Helper to dynamically get all appointments for a customer
  const getCustomerAppointments = (customer?: Customer | null): Appointment[] => {
    if (!customer) return [];
    return appointments.filter(
      (a) =>
        a.customerId === customer.id ||
        a.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()
    );
  };

  const selectedCustomerAppointments = getCustomerAppointments(selectedCustomer);

  return (
    <div className="flex h-full w-full flex-col gap-4 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Khách Hàng</span>
        </button>
      </div>

      {/* Main Split Panels */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Customer Table (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                placeholder="Tìm tên, sđt, email khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Nhóm</th>
                  <th className="px-4 py-3">Số Điện Thoại</th>
                  <th className="px-4 py-3 text-right">Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      Chưa có khách hàng nào.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = cust.id === selectedCustomer?.id;
                    const totalRev = getCustomerRevenue(cust);

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className={`cursor-pointer transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                          isSelected ? 'bg-blue-500/10 dark:bg-blue-500/15 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src={
                              cust.avatarUrl ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cust.name)}`
                            }
                            alt={cust.name}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{cust.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                              {cust.email || 'Chưa có email'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              cust.group === 'VIP'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {cust.group}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                          {cust.phone || 'Chưa có'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold font-mono text-blue-600 dark:text-blue-400">
                          {formatCurrency(totalRev)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Customer Inspector Panel (4 or 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm overflow-y-auto">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <img
                  src={
                    selectedCustomer.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedCustomer.name)}`
                  }
                  alt={selectedCustomer.name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-blue-600 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate text-slate-900 dark:text-white">
                    {selectedCustomer.name}
                  </h2>
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mt-1">
                    {selectedCustomer.group}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-medium">
                    {selectedCustomer.phone || 'Chưa có'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200 truncate">
                    {selectedCustomer.email || 'Chưa có'}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedCustomer.address || 'Chưa có địa chỉ'}
                  </span>
                </div>
              </div>

              {/* Revenue Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Tổng Doanh Thu</div>
                  <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                    {formatCurrency(getCustomerRevenue(selectedCustomer))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Lịch Hẹn</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {selectedCustomerAppointments.length} cuộc hẹn
                  </div>
                </div>
              </div>

              {/* Appointment History */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Lịch Hẹn Gần Đây</span>
                </h3>
                {selectedCustomerAppointments.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có lịch hẹn nào với khách hàng này.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {selectedCustomerAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1 bg-slate-50/50 dark:bg-slate-950/30"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                          <span className="truncate">{app.title}</span>
                          <span className="font-bold font-mono text-blue-600 dark:text-blue-400 ml-2 shrink-0">
                            {formatCurrency(app.price)}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span className="font-mono">{formatDate(app.date)}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              app.status === 'Đã hoàn thành'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onDeleteCustomer(selectedCustomer.id)}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xóa Khách Hàng</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Chọn một khách hàng để xem chi tiết.
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <CustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={onSaveCustomer}
        />
      )}
    </div>
  );
};
