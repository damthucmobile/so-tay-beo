'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, MapPin, X, AlertCircle } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Appointment, Customer } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Appointment | null;
  initialDateStr?: string;
  customers: Customer[];
  onSave: (data: Partial<Appointment>) => Promise<any>;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  initialData,
  initialDateStr,
  customers,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(500000);
  const [location, setLocation] = useState('Online (Google Meet / Zoom)');
  const [isOnline, setIsOnline] = useState(true);
  const [priority, setPriority] = useState<'Bình thường' | 'Ưu tiên cao'>('Bình thường');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCustomerId(initialData.customerId || '');
      setCustomerName(initialData.customerName || '');
      setDate(initialData.date ? initialData.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
      setDurationMinutes(initialData.durationMinutes || 60);
      setPrice(initialData.price || 0);
      setLocation(initialData.location || '');
      setIsOnline(initialData.isOnline ?? true);
      setPriority(initialData.priority || 'Bình thường');
      setNotes(initialData.notes || '');
      setColor(initialData.color || '#3b82f6');
    } else {
      const defaultDate = initialDateStr
        ? `${initialDateStr}T09:00`
        : new Date().toISOString().slice(0, 16);
      setTitle('');
      const defaultCust = customers[0];
      setCustomerId(defaultCust ? defaultCust.id : '');
      setCustomerName(defaultCust ? defaultCust.name : '');
      setDate(defaultDate);
      setDurationMinutes(60);
      setPrice(500000);
      setLocation('Online (Google Meet / Zoom)');
      setIsOnline(true);
      setPriority('Bình thường');
      setNotes('');
      setColor('#3b82f6');
    }
  }, [initialData, initialDateStr, isOpen, customers]);

  if (!isOpen) return null;

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const found = customers.find((c) => c.id === cId);
    if (found) {
      setCustomerName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        id: initialData?.id,
        title: title.trim(),
        customerId: customerId || 'cust_guest',
        customerName: customerName.trim() || 'Khách vãng lai',
        date,
        durationMinutes: Number(durationMinutes) || 60,
        price: Number(price) || 0,
        location: location.trim(),
        isOnline,
        priority,
        notes: notes.trim(),
        color,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Chỉnh Sửa Lịch Hẹn' : 'Tạo Lịch Hẹn Mới'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thiết lập thời gian, học viên và đơn giá ca làm việc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tiêu đề buổi làm việc */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Tiêu đề lịch hẹn / Nội dung <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Gia sư kèm 1-1 Toán 12, Tư vấn chuyên sâu..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Chọn khách hàng / học viên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Chọn từ danh bạ khách hàng
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- Khách vãng lai / Tự nhập --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Tên hiển thị khách hàng
              </label>
              <input
                type="text"
                placeholder="Tên khách hàng / Học viên..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Thời gian & Thời lượng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Ngày & Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Thời lượng (Phút)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Đơn vị giá & Mức độ ưu tiên */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Thù lao / Phí buổi hẹn (VNĐ)
              </label>
              <CurrencyInput
                value={price}
                onChange={(val) => setPrice(val)}
                placeholder="500.000"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Mức độ ưu tiên
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('Bình thường')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    priority === 'Bình thường'
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Bình thường
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('Ưu tiên cao')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    priority === 'Ưu tiên cao'
                      ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚡ Ưu tiên cao
                </button>
              </div>
            </div>
          </div>

          {/* Địa điểm / Hình thức */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Địa điểm / Link phòng học trực tuyến
            </label>
            <input
              type="text"
              placeholder="VD: Google Meet / Zoom link hoặc địa chỉ nhà riêng..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Ghi chú nội dung buổi hẹn
            </label>
            <textarea
              rows={2}
              placeholder="Tài liệu cần chuẩn bị, bài tập về nhà..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập Nhật Lịch Hẹn' : 'Tạo Lịch Hẹn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
