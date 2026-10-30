// features/travel/components/TripDetailView.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Car,
  Hotel,
  Utensils,
  Camera,
  Coffee,
  Sparkles,
  Wallet,
  Clock,
  X,
} from 'lucide-react';
import { Trip, ActivityCategory, TripActivity } from '../types';

interface TripDetailViewProps {
  trip: Trip;
  onBack: () => void;
  onUpdateStatus: (tripId: string, status: Trip['status']) => void;
  onAddActivity: (tripId: string, dayNumber: number, activity: Omit<TripActivity, 'id'>) => void;
  onToggleActivity: (tripId: string, dayNumber: number, activityId: string) => void;
  onDeleteActivity: (tripId: string, dayNumber: number, activityId: string) => void;
}

const CATEGORY_MAP: Record<
  ActivityCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  transport: { label: 'Di chuyển', icon: Car, color: 'text-blue-500 bg-blue-500/10' },
  hotel: { label: 'Lưu trú', icon: Hotel, color: 'text-violet-500 bg-violet-500/10' },
  food: { label: 'Ẩm thực', icon: Utensils, color: 'text-amber-500 bg-amber-500/10' },
  sightseeing: { label: 'Tham quan', icon: Camera, color: 'text-emerald-500 bg-emerald-500/10' },
  relax: { label: 'Thư giãn', icon: Coffee, color: 'text-rose-500 bg-rose-500/10' },
  other: { label: 'Khác', icon: Sparkles, color: 'text-slate-500 bg-slate-500/10' },
};

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  trip,
  onBack,
  onUpdateStatus,
  onAddActivity,
  onToggleActivity,
  onDeleteActivity,
}) => {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New activity form state
  const [newTime, setNewTime] = useState('08:00');
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('sightseeing');
  const [newNotes, setNewNotes] = useState('');

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const currentDay = trip.itinerary.find((d) => d.day === selectedDayNumber);
  const activities = currentDay?.activities || [];

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddActivity(trip.id, selectedDayNumber, {
      time: newTime,
      title: newTitle.trim(),
      location: newLocation.trim() || undefined,
      cost: Number(newCost) || 0,
      category: newCategory,
      notes: newNotes.trim() || undefined,
    });

    setNewTitle('');
    setNewLocation('');
    setNewCost('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Navigation & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="self-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách chuyến đi</span>
        </Button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400">Trạng thái:</span>
          <select
            value={trip.status}
            onChange={(e) => onUpdateStatus(trip.id, e.target.value as Trip['status'])}
            className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="planning">Đang lên lịch</option>
            <option value="ongoing">Đang diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white min-h-[220px] sm:min-h-[260px] flex flex-col justify-end p-6 sm:p-8 shadow-xl">
        <img
          src={
            trip.coverImage ||
            'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop'
          }
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <MapPin className="w-3 h-3 inline mr-1" />
              {trip.destination}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/20 backdrop-blur-md">
              <Calendar className="w-3 h-3 inline mr-1" />
              {trip.startDate} → {trip.endDate}
            </span>
            {trip.members && trip.members.length > 0 && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/20 backdrop-blur-md">
                Đồng hành: {trip.members.join(', ')}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{trip.title}</h1>

          {trip.notes && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              💡 {trip.notes}
            </p>
          )}

          {/* Budget Quick Summary */}
          <div className="pt-2 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Ngân sách: </span>
              <span className="font-bold text-amber-400">{formatVND(trip.budget)}</span>
            </div>
            <div>
              <span className="text-slate-400">Đã chi: </span>
              <span className="font-bold text-emerald-400">{formatVND(trip.spent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Days Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {trip.itinerary.map((day) => (
            <button
              key={day.day}
              type="button"
              onClick={() => setSelectedDayNumber(day.day)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedDayNumber === day.day
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>Ngày {day.day}</span>
              <span className="ml-1.5 opacity-70 text-[10px]">({day.activities.length})</span>
            </button>
          ))}

          {/* Button to add extra day */}
          <button
            type="button"
            onClick={() => {
              const nextDayNumber = (trip.itinerary[trip.itinerary.length - 1]?.day || 0) + 1;
              onAddActivity(trip.id, nextDayNumber, {
                time: '08:00',
                title: `Bắt đầu ngày ${nextDayNumber}`,
                category: 'sightseeing',
              });
              setSelectedDayNumber(nextDayNumber);
            }}
            className="px-3 py-2 rounded-2xl text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-dashed border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ngày</span>
          </button>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Thêm Hoạt Động</span>
        </Button>
      </div>

      {/* Day Title & Summary */}
      {currentDay && (
        <div className="flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/15 rounded-2xl p-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {currentDay.title || `Lịch trình chi tiết Ngày ${currentDay.day}`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activities.length} hoạt động được lên kế hoạch
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Chi phí ngày này:</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatVND(activities.reduce((sum, a) => sum + (a.cost || 0), 0))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Activities List */}
      {activities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">
            Chưa có hoạt động nào cho Ngày {selectedDayNumber}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bấm nút &quot;Thêm Hoạt Động&quot; để lên lịch cho các điểm tham quan, bữa ăn hoặc giờ di chuyển.
          </p>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Thêm hoạt động đầu tiên</span>
          </Button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {activities.map((act) => {
            const cat = CATEGORY_MAP[act.category] || CATEGORY_MAP.other;
            const CatIcon = cat.icon;

            return (
              <div key={act.id} className="relative group">
                {/* Timeline node icon */}
                <button
                  type="button"
                  onClick={() => onToggleActivity(trip.id, selectedDayNumber, act.id)}
                  className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer border-2 bg-white dark:bg-slate-900 ${
                    act.completed
                      ? 'border-emerald-500 text-emerald-500'
                      : 'border-slate-300 dark:border-slate-700 text-slate-300 hover:border-emerald-400'
                  }`}
                  title={act.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                >
                  {act.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
                </button>

                {/* Activity Card */}
                <Card
                  className={`rounded-2xl transition-all ${
                    act.completed
                      ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-70'
                      : 'hover:border-emerald-500/40 hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <CatIcon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {act.time}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {cat.label}
                          </span>
                        </div>

                        <h4
                          className={`font-bold text-sm sm:text-base text-slate-900 dark:text-white ${
                            act.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {act.title}
                        </h4>

                        {act.location && (
                          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{act.location}</span>
                          </div>
                        )}

                        {act.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Ghi chú: {act.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {act.cost && act.cost > 0 ? (
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                          {formatVND(act.cost)}
                        </span>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onDeleteActivity(trip.id, selectedDayNumber, act.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                        title="Xóa hoạt động này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Thêm Hoạt Động (Ngày {selectedDayNumber})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Giờ</label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phân loại
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="sightseeing">Tham quan</option>
                    <option value="food">Ăn uống</option>
                    <option value="transport">Di chuyển</option>
                    <option value="hotel">Khách sạn / Lưu trú</option>
                    <option value="relax">Thư giãn / Cafe</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên hoạt động <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Tham quan bảo tàng, ăn tối hải sản..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Địa điểm
                  </label>
                  <Input
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Tên quán, địa danh..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chi phí (VND)
                  </label>
                  <Input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    placeholder="VD: 150000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ghi chú thêm
                </label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Mẹo chụp ảnh, code giảm giá..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Lưu Hoạt Động
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
