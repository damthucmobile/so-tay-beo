// features/travel/checklist/components/AddTravelDocModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Plane,
  Hotel,
  ShieldCheck,
  Ticket,
  FileText,
  Upload,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { TravelDocument, TravelDocType } from '../../types';
import { useTravelStore } from '../../stores/useTravelStore';
import { uploadFileToR2 } from '@/core/cloudflare/client';

interface AddTravelDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TravelDocument, 'id' | 'createdAt'>) => Promise<any>;
  defaultTripId?: string;
}

export const DOC_TYPE_CONFIG: Record<
  TravelDocType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  flight: { label: 'Vé máy bay / Boarding Pass', icon: Plane, color: 'text-blue-500' },
  hotel: { label: 'Xác nhận đặt phòng khách sạn', icon: Hotel, color: 'text-purple-500' },
  passport: { label: 'Hộ chiếu / CCCD / Bảo hiểm', icon: ShieldCheck, color: 'text-emerald-500' },
  ticket: { label: 'Vé tham quan / Tàu xe / Event', icon: Ticket, color: 'text-amber-500' },
  other: { label: 'Giấy tờ & Voucher khác', icon: FileText, color: 'text-slate-500' },
};

export const AddTravelDocModal: React.FC<AddTravelDocModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTripId,
}) => {
  const { trips } = useTravelStore();

  const [title, setTitle] = useState('');
  const [tripId, setTripId] = useState(defaultTripId || trips[0]?.id || 'general');
  const [docType, setDocType] = useState<TravelDocType>('flight');
  const [bookingCode, setBookingCode] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadFileToR2(file, { folder: 'travel' });
      if (res.publicUrl) {
        setFileUrl(res.publicUrl);
      }
    } catch (err) {
      console.error('Lỗi khi tải tệp lên R2:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên tài liệu / vé máy bay');
      return;
    }

    const selectedTrip = trips.find((t) => t.id === tripId);
    setIsSubmitting(true);
    try {
      await onSubmit({
        tripId,
        tripTitle: selectedTrip?.title || 'Chuyến đi chung',
        title: title.trim(),
        docType,
        bookingCode: bookingCode.trim() || undefined,
        notes: notes.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu giấy tờ:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Lưu Trữ Giấy Tờ & Mã Đặt Chỗ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Két an toàn lưu trữ vé máy bay, voucher khách sạn, CCCD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên giấy tờ / Chuyến bay <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Vé máy bay Bamboo Airways QH201..."
              className="w-full text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chuyến đi</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              >
                <option value="general">Dùng chung cho mọi chuyến</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Loại giấy tờ</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as TravelDocType)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              >
                {Object.entries(DOC_TYPE_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mã đặt chỗ (Booking PNR / Code)
            </label>
            <input
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Ví dụ: VNA-897123, AGODA-8812..."
              className="w-full text-xs font-mono font-bold tracking-wider rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ảnh vé / Tệp PDF đính kèm (Tùy chọn)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Dán link ảnh hoặc tải lên..."
                className="flex-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <label className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-bold cursor-pointer transition shrink-0 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Đang tải...' : 'Upload'}</span>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadFile} />
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghi chú quan trọng</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Giờ bay, cổng ra máy bay, tên khách sạn..."
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Lưu vào két giấy tờ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
