'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  CalendarPlus,
} from 'lucide-react';
import { Appointment, Customer, CalendarViewMode } from '../types';
import { AppointmentModal } from './AppointmentModal';

interface ContextMenuState {
  x: number;
  y: number;
  day: number;
  dateStr: string;
}

interface CalendarPageProps {
  appointments: Appointment[];
  customers: Customer[];
  onSaveAppointment: (data: Partial<Appointment>) => Promise<any>;
  onDeleteAppointment: (id: string) => Promise<void>;
  onToggleComplete: (app: Appointment) => Promise<void>;
  onSeedDemo: () => Promise<void>;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  appointments,
  customers,
  onSaveAppointment,
  onDeleteAppointment,
  onToggleComplete,
  onSeedDemo,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Floating Context Menu state khi Click Chuột Phải vào ô Ngày
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayContextMenu = (e: React.MouseEvent, day: number) => {
    e.preventDefault();
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const menuWidth = 230;
    const menuHeight = 110;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16;
    }

    setContextMenu({ x, y, day, dateStr });
  };

  // Generate Month Grid Days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const daysGrid: (number | null)[] = [];
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  for (let i = 0; i < paddingDays; i++) daysGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysGrid.push(i);

  const getAppointmentsForDay = (day: number) => {
    const targetStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.filter((a) => a.date.startsWith(targetStr));
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
          <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="capitalize">{monthName}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-100 dark:bg-slate-800/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Ngày
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition cursor-pointer ${viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedAppointment(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Lịch Mới</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            Hôm nay
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <h2 className="text-base font-bold capitalize text-slate-900 dark:text-white">{monthName}</h2>
        </div>
      </div>

      {/* VIEW: Month View */}
      {viewMode === 'month' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="grid grid-cols-7 text-center font-semibold text-xs py-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
            <div>Thứ 2</div>
            <div>Thứ 3</div>
            <div>Thứ 4</div>
            <div>Thứ 5</div>
            <div>Thứ 6</div>
            <div className="text-blue-600 dark:text-blue-400">Thứ 7</div>
            <div className="text-rose-500">Chủ nhật</div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 min-h-[540px]">
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty_${idx}`}
                    className="p-2 bg-slate-50/50 dark:bg-slate-950/40 min-h-[100px]"
                  />
                );
              }

              const dayApps = getAppointmentsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <div
                  key={`day_${day}`}
                  onContextMenu={(e) => handleDayContextMenu(e, day)}
                  title="Nhấp chuột phải để mở menu tạo lịch cho ngày này"
                  className={`group relative p-2 min-h-[100px] flex flex-col justify-between transition-colors bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-850 cursor-pointer ${isToday ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center ${isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800 dark:text-slate-200'
                        }`}
                    >
                      {day}
                    </span>
                    {dayApps.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {dayApps.length} hẹn
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                    {dayApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(app);
                          setIsModalOpen(true);
                        }}
                        className={`w-full text-left p-1 rounded text-[11px] font-medium truncate flex items-center gap-1 transition-all hover:scale-[1.02] cursor-pointer ${app.isCompleted
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 line-through'
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                          }`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: app.color || '#3b82f6' }}
                        />
                        <span className="truncate">{app.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: Agenda View / Week / Day */}
      {(viewMode === 'agenda' || viewMode === 'week' || viewMode === 'day') && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              Chưa có lịch hẹn nào được ghi nhận. Hãy tạo cuộc hẹn mới!
            </div>
          ) : (
            appointments.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="h-10 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: app.color || '#3b82f6' }}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{app.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${app.priority === 'Ưu tiên cao'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                          {app.priority}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          {new Date(app.date).toLocaleString('vi-VN')} ({app.durationMinutes} phút)
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-amber-500" />
                          {app.location || 'Trực tuyến / Chưa đặt'}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Khách hàng: {app.customerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onToggleComplete(app)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${app.isCompleted
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-blue-600 bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                      {app.isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span>Đã Hoàn Thành</span>
                        </>
                      ) : (
                        <span>Đánh Dấu Hoàn Thành</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppointment(app);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Sửa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }}
        initialData={selectedAppointment}
        customers={customers}
        onSave={onSaveAppointment}
      />

      {/* Popup Context Menu gắn trực tiếp vào document.body bằng React Portal */}
      {contextMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[99999] min-w-[220px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-2xl animate-fadeIn duration-100"
            style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1 uppercase tracking-wider">
              Ngày {contextMenu.day} tháng {month + 1}, {year}
            </div>

            <button
              onClick={() => {
                setSelectedAppointment({ date: `${contextMenu.dateStr}T09:00` } as Appointment);
                setIsModalOpen(true);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
            >
              <CalendarPlus className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:text-white shrink-0" />
              <span>Tạo lịch cho ngày này</span>
            </button>

            <button
              onClick={() => {
                setCurrentDate(new Date(year, month, contextMenu.day));
                setViewMode('day');
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Xem chi tiết ngày này</span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};
