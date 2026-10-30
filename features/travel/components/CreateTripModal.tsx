// features/travel/components/CreateTripModal.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Sparkles, MapPin, Calendar, Wallet, Image as ImageIcon, Users } from 'lucide-react';
import { TripStatus } from '../types';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    spent: number;
    coverImage?: string;
    notes?: string;
    members?: string[];
    tags?: string[];
    status: TripStatus;
    itinerary: any[];
  }) => void;
}

const COVER_PRESETS = [
  {
    name: 'Hà Giang',
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Đà Nẵng Biển',
    url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Sapa Săn Mây',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Phú Quốc',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
  },
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [budget, setBudget] = useState('5000000');
  const [coverImage, setCoverImage] = useState(COVER_PRESETS[0].url);
  const [membersInput, setMembersInput] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) {
      alert('Vui lòng nhập tên chuyến đi và điểm đến!');
      return;
    }

    const members = membersInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget: Number(budget) || 0,
      spent: 0,
      coverImage,
      notes: notes.trim(),
      members,
      tags: ['Du lịch', destination.trim()],
      status: 'planning',
      itinerary: [
        {
          day: 1,
          date: startDate,
          title: `Ngày 1: Khởi hành đến ${destination}`,
          activities: [],
        },
      ],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo Chuyến Đi Mới</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lên lịch trình, quản lý ngân sách và lưu trữ kỷ niệm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tên chuyến đi <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kỳ nghỉ hè Phú Quốc 4N3Đ..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>Điểm đến <span className="text-rose-500">*</span></span>
              </label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="VD: Đà Lạt, Nha Trang, Sapa..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
                <span>Ngân sách dự kiến (VND)</span>
              </label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="5000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Ngày khởi hành</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Ngày kết thúc</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Người đồng hành (phân cách bằng dấu phẩy)</span>
            </label>
            <Input
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              placeholder="VD: Vợ yêu, Bé Bo, Anh Tuấn..."
            />
          </div>

          {/* Cover image selector */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Ảnh bìa chuyến đi</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COVER_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setCoverImage(preset.url)}
                  className={`relative h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    coverImage === preset.url
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] font-bold text-white text-center py-0.5 truncate">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Hoặc dán URL ảnh trực tiếp..."
              className="text-xs mt-1.5"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Ghi chú quan trọng
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Lưu ý về trang phục, thời tiết, số điện thoại khẩn cấp..."
              className="w-full rounded-xl border border-input bg-background p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
            >
              Tạo Chuyến Đi Ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
