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
  Share2,
  Image as ImageIcon,
  CheckSquare,
  Upload,
} from 'lucide-react';
import { Trip, ActivityCategory, TripActivity } from '../types';
import { useTravelStore } from '../stores/useTravelStore';

interface TripDetailViewProps {
  trip: Trip;
  onBack: () => void;
  onUpdateStatus: (tripId: string, status: Trip['status']) => void;
  onAddActivity: (tripId: string, dayNumber: number, activity: Omit<TripActivity, 'id'>) => void;
  onToggleActivity: (tripId: string, dayNumber: number, activityId: string) => void;
  onDeleteActivity: (tripId: string, dayNumber: number, activityId: string) => void;
  onShare?: (trip: Trip) => void;
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
  onShare,
}) => {
  const [mainTab, setMainTab] = useState<'itinerary' | 'album' | 'checklist'>('itinerary');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Travel store actions for media & checklist
  const { addMedia, deleteMedia, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useTravelStore();

  // Media upload modal/state
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);

  // Checklist state
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistCategory, setNewChecklistCategory] = useState<'clothes' | 'documents' | 'electronics' | 'medicine' | 'other'>('clothes');

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

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    addMedia(trip.id, {
      url: newMediaUrl.trim(),
      caption: newMediaCaption.trim() || undefined,
    });
    setNewMediaUrl('');
    setNewMediaCaption('');
    setShowAddMediaModal(false);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(trip.id, {
      text: newChecklistText.trim(),
      category: newChecklistCategory,
      completed: false,
    });
    setNewChecklistText('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Navigation & Quick Status & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="self-start gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách chuyến đi</span>
        </Button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {onShare && (
            <Button
              onClick={() => onShare(trip)}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ với gia đình</span>
            </Button>
          )}

          <div className="flex items-center gap-2">
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
            {trip.sharedMembers && trip.sharedMembers.length > 0 && (
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
                Đã chia sẻ: {trip.sharedMembers.length} người thân
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

      {/* Main Sub Tabs (Lịch trình, Album ảnh, Hành lý) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setMainTab('itinerary')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            mainTab === 'itinerary'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Lịch trình chi tiết</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {trip.itinerary.reduce((total, d) => total + d.activities.length, 0)}
          </span>
        </button>

        <button
          onClick={() => setMainTab('album')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            mainTab === 'album'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Album ảnh kỷ niệm</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {trip.media?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setMainTab('checklist')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            mainTab === 'checklist'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Chuẩn bị hành lý</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {trip.checklist?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1: Lịch trình chi tiết */}
      {mainTab === 'itinerary' && (
        <div className="space-y-6">
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
        </div>
      )}

      {/* Tab 2: Album Ảnh Kỷ Niệm */}
      {mainTab === 'album' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-500" />
                Album Ảnh Chuyến Đi & Gia Đình
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lưu giữ những khoảnh khắc đẹp nhất. Ảnh sẽ tự động hiển thị trong liên kết chia sẻ cho người thân.
              </p>
            </div>
            <Button
              onClick={() => setShowAddMediaModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Thêm ảnh kỷ niệm</span>
            </Button>
          </div>

          {(!trip.media || trip.media.length === 0) ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Chưa có ảnh nào trong album</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bấm nút &quot;Thêm ảnh kỷ niệm&quot; để lưu lại các góc chụp sống ảo, cảnh đẹp và kỷ niệm cùng người thân.
              </p>
              <Button
                onClick={() => setShowAddMediaModal(true)}
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Thêm ảnh đầu tiên</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trip.media.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-slate-900 shadow-sm hover:shadow-lg transition-all"
                >
                  <img
                    src={img.url}
                    alt={img.caption || 'Ảnh chuyến đi'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                    <button
                      onClick={() => deleteMedia(trip.id, img.id)}
                      className="self-end p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {img.caption && (
                      <p className="text-xs text-white font-medium line-clamp-2">
                        {img.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Chuẩn Bị Hành Lý */}
      {mainTab === 'checklist' && (
        <div className="space-y-6">
          {/* Quick Add Item Bar */}
          <form onSubmit={handleAddChecklist} className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row gap-3">
            <Input
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              placeholder="Thêm đồ dùng cần chuẩn bị (VD: Hộ chiếu, kem chống nắng, sạc dự phòng...)"
              className="flex-1 text-xs"
            />
            <select
              value={newChecklistCategory}
              onChange={(e) => setNewChecklistCategory(e.target.value as any)}
              className="text-xs rounded-xl border border-input bg-background px-3 py-2 text-foreground focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="clothes">👕 Quần áo</option>
              <option value="documents">📄 Giấy tờ / Vé</option>
              <option value="electronics">🔌 Thiết bị điện tử</option>
              <option value="medicine">💊 Y tế & Thuốc</option>
              <option value="other">✨ Khác</option>
            </select>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              <span>Thêm đồ</span>
            </Button>
          </form>

          {/* Checklist Items */}
          {(!trip.checklist || trip.checklist.length === 0) ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center space-y-2">
              <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <h4 className="font-bold text-foreground text-sm">Chưa có danh sách đồ dùng</h4>
              <p className="text-xs text-muted-foreground">Nhập đồ dùng ở thanh phía trên để không bị quên đồ trước ngày lên đường.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trip.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    item.completed
                      ? 'bg-muted/40 border-border opacity-60'
                      : 'bg-card border-border hover:border-emerald-500/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleChecklistItem(trip.id, item.id)}
                    className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.text}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.category === 'clothes'
                        ? 'Quần áo'
                        : item.category === 'documents'
                        ? 'Giấy tờ'
                        : item.category === 'electronics'
                        ? 'Thiết bị'
                        : item.category === 'medicine'
                        ? 'Y tế'
                        : 'Khác'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => deleteChecklistItem(trip.id, item.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 transition cursor-pointer"
                      title="Xóa đồ dùng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Media Modal */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                Thêm Ảnh Vào Album Kỷ Niệm
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMediaModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedia} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Đường dẫn hình ảnh (URL)</label>
                <Input
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... hoặc link ảnh"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Chú thích khoảnh khắc</label>
                <Input
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  placeholder="VD: Cả nhà cùng ngắm hoàng hôn, check-in đèo..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddMediaModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Lưu Ảnh Vào Album
                </Button>
              </div>
            </form>
          </div>
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
