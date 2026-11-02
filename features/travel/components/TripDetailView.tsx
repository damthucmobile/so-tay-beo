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
  CloudUpload,
  Link as LinkIcon,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import { Trip, ActivityCategory, TripActivity } from '../types';
import { useTravelStore } from '../stores/useTravelStore';
import { uploadFileToR2 } from '@/core/cloudflare/client';

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
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [mediaSourceTab, setMediaSourceTab] = useState<'upload' | 'link'>('upload');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; previewUrl: string }[]>([]);
  const [isUploadingR2, setIsUploadingR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewingMedia, setPreviewingMedia] = useState<{ url: string; caption?: string; createdAt?: string } | null>(null);
  const [copiedMediaUrl, setCopiedMediaUrl] = useState(false);

  // Xử lý khi người dùng chọn file ảnh từ máy
  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('Vui lòng chọn tệp định dạng hình ảnh (JPG, PNG, WEBP, GIF)');
      return;
    }

    setSelectedMediaFiles((prev) => [...prev, ...fileArray]);

    const newPreviews = fileArray.map((f) => ({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      previewUrl: URL.createObjectURL(f),
    }));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]?.previewUrl || '');
    setSelectedMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload toàn bộ các file đã chọn lên Cloudflare R2
  const handleUploadToR2 = async () => {
    if (selectedMediaFiles.length === 0) return;
    setIsUploadingR2(true);
    setUploadProgress(0);

    const total = selectedMediaFiles.length;

    for (let i = 0; i < total; i++) {
      const file = selectedMediaFiles[i];
      setUploadStatusText(`Đang tải ảnh ${i + 1}/${total}: ${file.name}...`);

      try {
        const result = await uploadFileToR2(file, {
          folder: 'travel',
          onProgress: (p) => {
            const overall = Math.round(((i + p.percentage / 100) / total) * 100);
            setUploadProgress(overall);
          },
        });

        // Thêm ngay vào album chuyến đi trên Firestore
        await addMedia(trip.id, {
          url: result.publicUrl,
          caption: newMediaCaption.trim() || file.name.replace(/\.[^/.]+$/, ''),
        });
      } catch (err: any) {
        console.error(`Lỗi khi tải ảnh ${file.name} lên R2:`, err);
        alert(`Không thể tải lên "${file.name}": ${err?.message || 'Lỗi mạng'}`);
      }
    }

    setIsUploadingR2(false);
    setSelectedMediaFiles([]);
    filePreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setFilePreviews([]);
    setNewMediaCaption('');
    setUploadStatusText('');
    setUploadProgress(0);
    setShowAddMediaModal(false);
  };

  // Thêm ảnh qua liên kết URL trực tiếp
  const handleAddMediaByLink = (e: React.FormEvent) => {
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
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-500" />
                  <span>Album Ảnh Chuyến Đi & Kỷ Niệm Gia Đình</span>
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  <CloudUpload className="w-3 h-3" />
                  Cloudflare R2 Ready
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lưu giữ những khoảnh khắc đẹp nhất không giới hạn dung lượng với Cloudflare R2 hoặc dán liên kết ảnh từ web.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <Button
                onClick={() => {
                  setMediaSourceTab('upload');
                  setShowAddMediaModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20 text-xs"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Tải ảnh lên R2</span>
              </Button>
              <Button
                onClick={() => {
                  setMediaSourceTab('link');
                  setShowAddMediaModal(true);
                }}
                variant="outline"
                className="gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Thêm bằng Link</span>
              </Button>
            </div>
          </div>

          {(!trip.media || trip.media.length === 0) ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-foreground text-base">Chưa có ảnh nào trong album</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bắt đầu lưu giữ những kỷ niệm tuyệt đẹp của chuyến đi. Bạn có thể tải ảnh trực tiếp từ điện thoại / máy tính lên Cloudflare R2 hoặc dán link ảnh từ bất kỳ đâu.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  onClick={() => {
                    setMediaSourceTab('upload');
                    setShowAddMediaModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-md shadow-emerald-500/20"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Tải ảnh từ máy lên R2</span>
                </Button>
                <Button
                  onClick={() => {
                    setMediaSourceTab('link');
                    setShowAddMediaModal(true);
                  }}
                  variant="outline"
                  className="gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Dán liên kết ảnh URL</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trip.media.map((img) => {
                const isR2Image = img.url.includes('/api/media/view') || img.url.includes('r2.cloudflarestorage.com');
                return (
                  <div
                    key={img.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-slate-900 shadow-sm hover:shadow-xl transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'Ảnh chuyến đi'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setPreviewingMedia(img)}
                    />

                    {/* Badge nguồn ảnh */}
                    {isR2Image && (
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-600/90 text-white backdrop-blur-md shadow-sm flex items-center gap-1">
                        <CloudUpload className="w-2.5 h-2.5" />
                        <span>R2 CDN</span>
                      </div>
                    )}

                    {/* Overlay action bar on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewingMedia(img)}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition cursor-pointer"
                          title="Xem ảnh phóng to"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(img.url);
                            alert('Đã sao chép liên kết ảnh vào clipboard!');
                          }}
                          className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition cursor-pointer"
                          title="Sao chép link ảnh"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMedia(trip.id, img.id)}
                          className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {img.caption && (
                        <p className="text-xs text-white font-medium line-clamp-2 px-1 pb-0.5">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {/* Modal Thêm Ảnh Kỷ Niệm (Hỗ trợ cả Cloudflare R2 & Dán Link URL) */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Thêm Ảnh Kỷ Niệm</h3>
                  <p className="text-xs text-muted-foreground">
                    Chọn tải file trực tiếp lên Cloudflare R2 hoặc dán liên kết ảnh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isUploadingR2) return;
                  setShowAddMediaModal(false);
                  setSelectedMediaFiles([]);
                  filePreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                  setFilePreviews([]);
                }}
                disabled={isUploadingR2}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Switcher: Cloudflare R2 vs Dán Link */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMediaSourceTab('upload')}
                disabled={isUploadingR2}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl transition cursor-pointer ${
                  mediaSourceTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CloudUpload className="w-4 h-4" />
                <span>Tải lên Cloudflare R2</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaSourceTab('link')}
                disabled={isUploadingR2}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl transition cursor-pointer ${
                  mediaSourceTab === 'link'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Thêm bằng Link URL</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD LÊN CLOUDFLARE R2 */}
            {mediaSourceTab === 'upload' && (
              <div className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFilesSelected(e.dataTransfer.files);
                  }}
                  className={`relative rounded-3xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploadingR2}
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    id="r2-file-input"
                  />
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        Kéo thả ảnh vào đây hoặc <span className="text-emerald-600 underline">bấm để chọn</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Hỗ trợ JPG, PNG, WEBP, GIF tối đa 25MB/ảnh. Có thể chọn nhiều ảnh cùng lúc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Previews của các file đã chọn */}
                {filePreviews.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span>Đã chọn ({filePreviews.length} ảnh):</span>
                      <button
                        type="button"
                        onClick={() => {
                          filePreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                          setFilePreviews([]);
                          setSelectedMediaFiles([]);
                        }}
                        className="text-muted-foreground hover:text-red-500 text-[11px]"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                      {filePreviews.map((p, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                          <img src={p.previewUrl} alt={p.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedFile(idx)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition"
                            title="Bỏ ảnh này"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white px-1 py-0.5 truncate">
                            {p.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chú thích chung */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Chú thích khoảnh khắc (tùy chọn)</label>
                  <Input
                    value={newMediaCaption}
                    onChange={(e) => setNewMediaCaption(e.target.value)}
                    placeholder="VD: Cả nhà cùng ngắm hoàng hôn, check-in đèo..."
                    disabled={isUploadingR2}
                  />
                </div>

                {/* Progress bar khi đang tải lên R2 */}
                {isUploadingR2 && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{uploadStatusText || 'Đang tải lên Cloudflare R2...'}</span>
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingR2}
                    onClick={() => {
                      setShowAddMediaModal(false);
                      setSelectedMediaFiles([]);
                      filePreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
                      setFilePreviews([]);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleUploadToR2}
                    disabled={isUploadingR2 || selectedMediaFiles.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-500/20"
                  >
                    {isUploadingR2 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải lên ({uploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        <span>Tải lên R2 ({selectedMediaFiles.length} ảnh)</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 2: THÊM BẰNG LIÊN KẾT URL */}
            {mediaSourceTab === 'link' && (
              <form onSubmit={handleAddMediaByLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Đường dẫn hình ảnh (URL) *</label>
                  <Input
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... hoặc link ảnh bất kỳ"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dán đường dẫn ảnh trực tiếp từ Google Photos, Pinterest, Unsplash hoặc bất kỳ website nào.
                  </p>
                </div>

                {/* Preview ảnh từ link */}
                {newMediaUrl.trim() && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Xem trước hình ảnh:</label>
                    <div className="h-36 rounded-2xl overflow-hidden border border-border bg-slate-950 flex items-center justify-center">
                      <img
                        src={newMediaUrl}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://placehold.co/600x400?text=Kh%C3%B4ng+t%E1%BA%A3i+%C4%91%C6%B0%E1%BB%A3c+%E1%BA%A3nh';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Chú thích khoảnh khắc (tùy chọn)</label>
                  <Input
                    value={newMediaCaption}
                    onChange={(e) => setNewMediaCaption(e.target.value)}
                    placeholder="VD: View ngắm bình minh trên đỉnh Fansipan..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowAddMediaModal(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md shadow-emerald-500/20">
                    <Plus className="w-4 h-4" />
                    <span>Lưu Ảnh Vào Album</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal: Xem ảnh phóng to */}
      {previewingMedia && (
        <div
          onClick={() => setPreviewingMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center gap-3"
          >
            {/* Top Bar Actions */}
            <div className="w-full flex items-center justify-between text-white px-2">
              <span className="text-xs font-semibold truncate max-w-md">
                {previewingMedia.caption || 'Ảnh chuyến đi'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewingMedia.url);
                    setCopiedMediaUrl(true);
                    setTimeout(() => setCopiedMediaUrl(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedMediaUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMediaUrl ? 'Đã sao chép link' : 'Sao chép link'}</span>
                </button>
                <a
                  href={previewingMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                  title="Mở ảnh tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewingMedia(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Đóng xem ảnh"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Image */}
            <div className="w-full rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center max-h-[80vh]">
              <img
                src={previewingMedia.url}
                alt={previewingMedia.caption || 'Ảnh chi tiết'}
                className="max-h-[80vh] max-w-full object-contain rounded-2xl"
              />
            </div>
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
