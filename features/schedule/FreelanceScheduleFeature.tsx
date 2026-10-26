'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Briefcase, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useScheduleManager } from './hooks/useScheduleManager';
import { CalendarPage } from './components/CalendarPage';
import { AppointmentPage } from './components/AppointmentPage';
import { CustomerListPage } from './components/CustomerListPage';
import { ScheduleTabType } from './types';

interface FreelanceScheduleFeatureProps {
  defaultTab?: ScheduleTabType;
}

export const FreelanceScheduleFeature: React.FC<FreelanceScheduleFeatureProps> = ({
  defaultTab = 'calendar',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ScheduleTabType>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const {
    appointments,
    customers,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    saveAppointment,
    deleteAppointment,
    toggleComplete,
    saveCustomer,
    deleteCustomer,
    seedDemo,
  } = useScheduleManager(user?.uid);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Sub-Tabs Navigation Bar */}
      <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'calendar'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Lịch trực quan</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'appointments'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Danh sách Lịch hẹn</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'customers'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Khách hàng & Học viên</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content View - Mở rộng full chiều ngang */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 min-h-0">
        <div className="w-full">
          {isLoading ? (
            <div className="flex h-64 w-full items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
              <span className="text-xs font-medium">Đang tải...</span>
            </div>
          ) : (
          <>
            {activeTab === 'calendar' && (
              <CalendarPage
                appointments={appointments}
                customers={customers}
                onSaveAppointment={saveAppointment}
                onDeleteAppointment={deleteAppointment}
                onToggleComplete={toggleComplete}
                onSeedDemo={seedDemo}
              />
            )}
            {activeTab === 'appointments' && (
              <AppointmentPage
                appointments={appointments}
                customers={customers}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onSaveAppointment={saveAppointment}
                onDeleteAppointment={deleteAppointment}
                onToggleComplete={toggleComplete}
              />
            )}
            {activeTab === 'customers' && (
              <CustomerListPage
                customers={customers}
                appointments={appointments}
                onSaveCustomer={saveCustomer}
                onDeleteCustomer={deleteCustomer}
              />
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
