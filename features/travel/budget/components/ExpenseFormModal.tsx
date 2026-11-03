// features/travel/budget/components/ExpenseFormModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Wallet,
  Car,
  Hotel,
  Utensils,
  Camera,
  ShoppingBag,
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  Plus,
  Loader2,
  Upload,
} from 'lucide-react';
import { TravelExpense, ExpenseCategory } from '../../types';
import { useTravelStore } from '../../stores/useTravelStore';
import { uploadFileToR2 } from '@/core/cloudflare/client';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TravelExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  initialData?: TravelExpense | null;
  defaultTripId?: string;
}

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  transport: { label: 'Di chuyển / Vé máy bay', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  hotel: { label: 'Khách sạn / Lưu trú', icon: Hotel, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  food: { label: 'Ẩm thực / Ăn uống', icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  sightseeing: { label: 'Tham quan / Vé vào cổng', icon: Camera, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  shopping: { label: 'Mua sắm / Quà lưu niệm', icon: ShoppingBag, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  other: { label: 'Chi phí phát sinh khác', icon: Sparkles, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
};

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultTripId,
}) => {
  const { trips } = useTravelStore();

  const [tripId, setTripId] = useState(initialData?.tripId || defaultTripId || trips[0]?.id || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState<string>(initialData?.amount ? String(initialData.amount) : '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'food');
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || 'Tôi');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [splitMembersInput, setSplitMembersInput] = useState(
    initialData?.splitWith?.join(', ') || 'Tôi'
  );
  const [receiptUrl, setReceiptUrl] = useState(initialData?.receiptUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadFileToR2(file, { folder: 'travel' });
      if (res.publicUrl) {
        setReceiptUrl(res.publicUrl);
      }
    } catch (err) {
      console.error('Lỗi khi tải hóa đơn lên Cloudflare R2:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      alert('Vui lòng nhập số tiền chi tiêu hợp lệ');
      return;
    }
    if (!title.trim()) {
      alert('Vui lòng nhập tên khoản chi');
      return;
    }

    const selectedTrip = trips.find((t) => t.id === tripId);
    const splitWith = splitMembersInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSubmit({
        tripId: tripId || 'general',
        tripTitle: selectedTrip?.title || 'Chuyến đi chung',
        title: title.trim(),
        amount: numAmount,
        category,
        paidBy: paidBy.trim() || 'Tôi',
        date,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        splitWith: splitWith.length > 0 ? splitWith : [paidBy.trim() || 'Tôi'],
      });
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu khoản chi:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {initialData ? 'Chỉnh Sửa Khoản Chi' : 'Ghi Nhận Khoản Chi Mới'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu vào sổ quỹ và tự động tính chia tiền nhóm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Số tiền chi tiêu (VNĐ) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={
                  amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('vi-VN') : ''
                }
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full text-xl sm:text-2xl font-black rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1">
              {[50000, 100000, 200000, 500000, 1000000, 2000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(String(val))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer whitespace-nowrap"
                >
                  +{val.toLocaleString('vi-VN')}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên khoản chi / Hóa đơn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Ăn trưa hải sản Bé Mặn, Tiền phòng khách sạn..."
              className="w-full text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Trip & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Chuyến đi
              </label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Danh mục chi
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
              >
                {Object.entries(CATEGORY_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Người trả tiền
              </label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="Tôi, Nam, Linh..."
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ngày thanh toán
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
              />
            </div>
          </div>

          {/* Split with members */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Users className="w-3.5 h-3.5" />
                <span>Chia tiền cho ai? (Các thành viên cùng chịu khoản này)</span>
              </span>
            </label>
            <input
              type="text"
              value={splitMembersInput}
              onChange={(e) => setSplitMembersInput(e.target.value)}
              placeholder="Ngăn cách bằng dấu phẩy: Tôi, Nam, Linh, Hùng..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2"
            />
            <p className="text-[10px] text-slate-400">
              Hệ thống sẽ tự động chia đều khoản tiền này cho các thành viên để tính công nợ.
            </p>
          </div>

          {/* Notes & Receipt Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghi chú</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chi tiết món ăn, số lượng người, số hóa đơn..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialData ? 'Lưu thay đổi' : 'Thêm khoản chi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
