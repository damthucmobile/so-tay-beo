// features/travel/components/TripDetailView.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  Maximize2,
  Users,
  Luggage,
  BookOpen,
  ShieldCheck,
  DollarSign,
  PieChart,
  ShoppingBag,
  Palmtree,
  Mountain,
  Globe,
  Briefcase,
  Star,
  Edit3,
} from 'lucide-react';
import {
  Trip,
  ActivityCategory,
  TripActivity,
  ExpenseCategory,
  ChecklistCategory,
  TravelExpense,
  JournalEntry,
  ChecklistItem,
  TravelDocument,
} from '../types';
import { useTravelStore } from '../stores/useTravelStore';
import { useJournalStore, UnifiedMediaItem } from '../stores/useJournalStore';
import { useBudgetStore } from '../stores/useBudgetStore';
import { useChecklistStore } from '../stores/useChecklistStore';
import { useAuth } from '@/core/firebase';
import { uploadFileToR2 } from '@/core/cloudflare/client';

import { JournalCard } from './JournalCard';
import { JournalDetailModal } from './JournalDetailModal';
import { CreateJournalModal } from './CreateJournalModal';
import { MediaLightboxModal } from './MediaLightboxModal';

import { ExpenseFormModal, CATEGORY_CONFIG } from '../budget/components/ExpenseFormModal';
import { BillSplitterModal } from '../budget/components/BillSplitterModal';

import {
  AddChecklistItemModal,
  CHECKLIST_CATEGORY_CONFIG,
} from '../checklist/components/AddChecklistItemModal';
import { AddTravelDocModal, DOC_TYPE_CONFIG } from '../checklist/components/AddTravelDocModal';

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

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' ₫';
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  trip,
  onBack,
  onUpdateStatus,
  onAddActivity,
  onToggleActivity,
  onDeleteActivity,
  onShare,
}) => {
  const { user } = useAuth();
  const { addMedia } = useTravelStore();

  // Stores
  const {
    journals,
    fetchJournals,
    addJournal,
    deleteJournal,
  } = useJournalStore();

  const {
    expenses,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useBudgetStore();

  const {
    items: allChecklistItems,
    documents: allDocuments,
    fetchData: fetchChecklistData,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    deleteItem: deleteChecklistItem,
    applyPresetTemplate,
    addDocument,
    deleteDocumentItem,
  } = useChecklistStore();

  // 4 Phân hệ quản lý riêng biệt cho chuyến đi này
  const [mainTab, setMainTab] = useState<'itinerary' | 'journal' | 'budget' | 'checklist'>('itinerary');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // Modals state
  const [showAddActivityModal, setShowAddActivityModal] = useState<boolean>(false);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityTime, setNewActivityTime] = useState('09:00');
  const [newActivityLocation, setNewActivityLocation] = useState('');
  const [newActivityCost, setNewActivityCost] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState<ActivityCategory>('sightseeing');
  const [newActivityNotes, setNewActivityNotes] = useState('');

  // Modals for Journal & Media
  const [showCreateJournalModal, setShowCreateJournalModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [previewMedia, setPreviewMedia] = useState<UnifiedMediaItem | null>(null);
  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false);
  const [mediaUploadMode, setMediaUploadMode] = useState<'r2' | 'url'>('r2');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaCaptionInput, setMediaCaptionInput] = useState('');
  const [isUploadingR2, setIsUploadingR2] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals for Budget
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSplitterModal, setShowSplitterModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TravelExpense | null>(null);
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<ExpenseCategory | 'all'>('all');

  // Modals for Checklist & Vault
  const [showAddChecklistModal, setShowAddChecklistModal] = useState(false);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [checklistCategoryFilter, setChecklistCategoryFilter] = useState<ChecklistCategory | 'all'>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Load data for this trip
  useEffect(() => {
    if (user?.uid) {
      fetchJournals(user.uid);
      fetchExpenses(user.uid);
      fetchChecklistData(user.uid);
    }
  }, [user?.uid, fetchJournals, fetchExpenses, fetchChecklistData]);

  // ============================================================================
  // 1. DATA CỦA RIÊNG CHUYẾN ĐI NÀY (TRIP-SCOPED DATA)
  // ============================================================================
  // Nhật ký của riêng chuyến đi này
  const tripJournals = useMemo(() => {
    return journals.filter((j) => j.tripId === trip.id);
  }, [journals, trip.id]);

  // Kho ảnh của riêng chuyến đi này (gồm ảnh đính kèm bài nhật ký + ảnh trong trip.media)
  const tripMediaList: UnifiedMediaItem[] = useMemo(() => {
    const list: UnifiedMediaItem[] = [];

    // Từ trip.media
    if (trip.media && trip.media.length > 0) {
      trip.media.forEach((m) => {
        list.push({
          id: m.id,
          url: m.url,
          caption: m.caption || trip.title,
          sourceType: 'trip',
          sourceId: trip.id,
          sourceTitle: trip.title,
          date: m.createdAt ? m.createdAt.split('T')[0] : trip.startDate,
          location: trip.destination,
        });
      });
    }

    // Từ bài nhật ký của chuyến này
    tripJournals.forEach((j) => {
      j.images.forEach((img) => {
        list.push({
          id: img.id,
          url: img.url,
          caption: img.caption || j.title,
          sourceType: 'journal',
          sourceId: j.id,
          sourceTitle: j.title,
          date: j.date,
          location: j.location,
        });
      });
    });

    return list;
  }, [trip, tripJournals]);

  // Chi tiêu của riêng chuyến đi này
  const tripExpenses = useMemo(() => {
    return expenses.filter((e) => e.tripId === trip.id);
  }, [expenses, trip.id]);

  const filteredTripExpenses = useMemo(() => {
    if (budgetCategoryFilter === 'all') return tripExpenses;
    return tripExpenses.filter((e) => e.category === budgetCategoryFilter);
  }, [tripExpenses, budgetCategoryFilter]);

  const tripTotalSpent = useMemo(() => {
    return tripExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [tripExpenses]);

  const tripRemaining = trip.budget - tripTotalSpent;
  const tripSpentPercent = trip.budget > 0 ? Math.min(Math.round((tripTotalSpent / trip.budget) * 100), 100) : 0;

  // Chi tiêu theo từng danh mục của chuyến này
  const tripCategoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      transport: 0,
      hotel: 0,
      food: 0,
      sightseeing: 0,
      shopping: 0,
      other: 0,
    };
    tripExpenses.forEach((e) => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.amount;
      } else {
        totals.other += e.amount;
      }
    });
    return totals;
  }, [tripExpenses]);

  // Hành lý & Giấy tờ của riêng chuyến đi này
  const tripChecklistItems = useMemo(() => {
    return allChecklistItems.filter((i) => i.tripId === trip.id);
  }, [allChecklistItems, trip.id]);

  const filteredTripChecklist = useMemo(() => {
    if (checklistCategoryFilter === 'all') return tripChecklistItems;
    return tripChecklistItems.filter((i) => i.category === checklistCategoryFilter);
  }, [tripChecklistItems, checklistCategoryFilter]);

  const tripChecklistDone = tripChecklistItems.filter((i) => i.completed).length;
  const tripChecklistPercent =
    tripChecklistItems.length > 0
      ? Math.round((tripChecklistDone / tripChecklistItems.length) * 100)
      : 0;

  const tripDocuments = useMemo(() => {
    return allDocuments.filter((d) => d.tripId === trip.id);
  }, [allDocuments, trip.id]);

  // Handlers for Itinerary Activity
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim()) return;

    onAddActivity(trip.id, selectedDayNumber, {
      time: newActivityTime,
      title: newActivityTitle.trim(),
      location: newActivityLocation.trim() || undefined,
      cost: newActivityCost ? parseFloat(newActivityCost) : undefined,
      category: newActivityCategory,
      notes: newActivityNotes.trim() || undefined,
      completed: false,
    });

    setNewActivityTitle('');
    setNewActivityLocation('');
    setNewActivityCost('');
    setNewActivityNotes('');
    setShowAddActivityModal(false);
  };

  // Handlers for Uploading Photo to this trip
  const handleUploadR2 = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingR2(true);
    setUploadProgress(0);

    const fileList = Array.from(files);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const res = await uploadFileToR2(file, {
          folder: 'travel',
          onProgress: (p) => {
            const overall = Math.round(((i + p.percentage / 100) / fileList.length) * 100);
            setUploadProgress(overall);
          },
        });
        if (res.publicUrl) {
          await addMedia(trip.id, {
            url: res.publicUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
      }
    }

    setIsUploadingR2(false);
    setShowUploadMediaModal(false);
  };

  const handleAddMediaUrl = async () => {
    if (!mediaUrlInput.trim()) return;
    await addMedia(trip.id, {
      url: mediaUrlInput.trim(),
      caption: mediaCaptionInput.trim() || undefined,
    });
    setMediaUrlInput('');
    setMediaCaptionInput('');
    setShowUploadMediaModal(false);
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const activeDay = trip.itinerary.find((d) => d.day === selectedDayNumber);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* Top Banner Navigation & Quick Status & Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-sm self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách chuyến đi</span>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          {onShare && (
            <button
              onClick={() => onShare(trip)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ với gia đình</span>
            </button>
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

          {/* Quick Stats Summary */}
          <div className="pt-2 flex items-center gap-6 text-xs flex-wrap">
            <div>
              <span className="text-slate-400">Ngân sách dự kiến: </span>
              <span className="font-bold text-amber-400">{formatVND(trip.budget)}</span>
            </div>
            <div>
              <span className="text-slate-400">Thực tế đã chi: </span>
              <span className="font-bold text-emerald-400">{formatVND(tripTotalSpent)}</span>
            </div>
            <div>
              <span className="text-slate-400">Ảnh / Video kỷ niệm: </span>
              <span className="font-bold text-cyan-400">{tripMediaList.length} tệp</span>
            </div>
            <div>
              <span className="text-slate-400">Hành lý sẵn sàng: </span>
              <span className="font-bold text-purple-400">
                {tripChecklistDone}/{tripChecklistItems.length} món ({tripChecklistPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 PHÂN HỆ QUẢN LÝ RIÊNG BIỆT CỦA CHUYẾN ĐI NÀY */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        {/* Tab 1: Lịch trình */}
        <button
          onClick={() => setMainTab('itinerary')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
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

        {/* Tab 2: Nhật ký & Album */}
        <button
          onClick={() => setMainTab('journal')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            mainTab === 'journal'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Nhật ký & Album</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {tripJournals.length} bài • {tripMediaList.length} ảnh
          </span>
        </button>

        {/* Tab 3: Ngân sách & Chi tiêu */}
        <button
          onClick={() => setMainTab('budget')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            mainTab === 'budget'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Ngân sách & Chi tiêu</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {tripExpenses.length} khoản chi
          </span>
        </button>

        {/* Tab 4: Hành lý & Giấy tờ */}
        <button
          onClick={() => setMainTab('checklist')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            mainTab === 'checklist'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Luggage className="w-4 h-4" />
          <span>Hành lý & Giấy tờ</span>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
            {tripChecklistItems.length} món • {tripDocuments.length} vé
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 1. NỘI DUNG TAB 1: LỊCH TRÌNH CHI TIẾT */}
      {/* ==================================================================== */}
      {mainTab === 'itinerary' && (
        <div className="space-y-6">
          {/* Day selection tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {trip.itinerary.map((d) => (
              <button
                key={d.day}
                onClick={() => setSelectedDayNumber(d.day)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  selectedDayNumber === d.day
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>Ngày {d.day}</span>
                <span className="text-[10px] opacity-75">({d.date})</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {d.activities.length}
                </span>
              </button>
            ))}
          </div>

          {/* Day header & add button */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Lịch trình Ngày {selectedDayNumber} ({activeDay?.date})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeDay?.title || 'Các hoạt động khám phá & trải nghiệm trong ngày'}
              </p>
            </div>

            <button
              onClick={() => setShowAddActivityModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm hoạt động</span>
            </button>
          </div>

          {/* Activities list */}
          {!activeDay || activeDay.activities.length === 0 ? (
            <div className="p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                Chưa có hoạt động nào trong Ngày {selectedDayNumber}
              </h4>
              <p className="text-xs text-slate-500">
                Bấm &quot;Thêm hoạt động&quot; để lên lịch các điểm tham quan, ăn uống và trải nghiệm.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDay.activities.map((act) => {
                const cat = CATEGORY_MAP[act.category] || CATEGORY_MAP.other;
                const CatIcon = cat.icon;

                return (
                  <div
                    key={act.id}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                      act.completed
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => onToggleActivity(trip.id, selectedDayNumber, act.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          act.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {act.time}
                          </span>
                          <span
                            className={`font-bold text-sm truncate ${
                              act.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {act.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                          {act.location && (
                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{act.location}</span>
                            </span>
                          )}
                          {act.cost && act.cost > 0 && (
                            <span className="font-bold text-amber-500">
                              Chi phí: {formatVND(act.cost)}
                            </span>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            💡 {act.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteActivity(trip.id, selectedDayNumber, act.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. NỘI DUNG TAB 2: NHẬT KÝ & ALBUM CỦA RIÊNG CHUYẾN ĐI NÀY */}
      {/* ==================================================================== */}
      {mainTab === 'journal' && (
        <div className="space-y-8">
          {/* Header Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-500" />
                <span>Nhật Ký & Kho Ảnh Của Chuyến Đi Này</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghi lại trải nghiệm và lưu giữ khoảnh khắc tại {trip.destination}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowUploadMediaModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-cyan-500" />
                <span>+ Thêm Ảnh / Video</span>
              </button>

              <button
                onClick={() => setShowCreateJournalModal(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Viết Nhật Ký Chuyến Đi</span>
              </button>
            </div>
          </div>

          {/* Phần 1: Các bài viết nhật ký */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-500" />
              <span>Bài viết nhật ký hành trình ({tripJournals.length})</span>
            </h4>

            {tripJournals.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-400">Chưa có bài viết nhật ký nào cho chuyến đi này.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateJournalModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold"
                >
                  + Viết bài đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tripJournals.map((j) => (
                  <JournalCard
                    key={j.id}
                    journal={j}
                    onSelect={(selected) => setSelectedJournal(selected)}
                    onDelete={(id) => deleteJournal(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Phần 2: Thư viện Album ảnh của chuyến đi */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-cyan-500" />
                <span>Thư viện kho ảnh chuyến đi ({tripMediaList.length})</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowUploadMediaModal(true)}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                + Tải thêm ảnh
              </button>
            </div>

            {tripMediaList.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-400">Chưa có hình ảnh nào trong album chuyến đi này.</p>
                <button
                  type="button"
                  onClick={() => setShowUploadMediaModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold"
                >
                  + Tải ảnh lên ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tripMediaList.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setPreviewMedia(m)}
                    className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-cyan-500 transition cursor-pointer"
                  >
                    <img src={m.url} alt={m.caption || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white">
                      {m.caption && <p className="text-xs font-semibold truncate">{m.caption}</p>}
                      <span className="text-[10px] text-cyan-300 flex items-center gap-1 mt-0.5">
                        <Maximize2 className="w-3 h-3" />
                        <span>Phóng to</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. NỘI DUNG TAB 3: NGÂN SÁCH & CHI TIÊU CỦA RIÊNG CHUYẾN ĐI NÀY */}
      {/* ==================================================================== */}
      {mainTab === 'budget' && (
        <div className="space-y-6">
          {/* Header Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <span>Ngân Sách & Hóa Đơn Chi Tiêu ({trip.title})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi chi phí thực tế so với hạn mức {formatVND(trip.budget)}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSplitterModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Chia tiền nhóm (Bill Splitter)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận khoản chi</span>
              </button>
            </div>
          </div>

          {/* KPI Cards cho chuyến này */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Hạn mức ngân sách</span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                {formatVND(trip.budget)}
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Đã chi thực tế</span>
              <h4 className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
                {formatVND(tripTotalSpent)}
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                {tripRemaining >= 0 ? 'Còn lại trong quỹ' : 'Vượt hạn mức'}
              </span>
              <h4
                className={`text-base sm:text-lg font-black mt-1 ${
                  tripRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatVND(Math.abs(tripRemaining))}
              </h4>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tiến độ chi</span>
                <span className="text-xs font-black text-amber-600">{tripSpentPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tripSpentPercent > 90 ? 'bg-rose-500' : tripSpentPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${tripSpentPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Phân bổ theo danh mục của chuyến này */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {Object.entries(CATEGORY_CONFIG).map(([k, cfg]) => {
              const Icon = cfg.icon;
              const catAmount = tripCategoryTotals[k as ExpenseCategory] || 0;
              const isSelected = budgetCategoryFilter === k;

              return (
                <div
                  key={k}
                  onClick={() => setBudgetCategoryFilter(isSelected ? 'all' : (k as ExpenseCategory))}
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} flex items-center justify-center`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {cfg.label.split('/')[0]}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {formatVND(catAmount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Danh sách khoản chi */}
          {filteredTripExpenses.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
              <p className="text-xs text-slate-400">Chưa có khoản chi tiêu nào cho chuyến đi này.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold"
              >
                + Ghi nhận khoản chi đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTripExpenses.map((expense) => {
                const cat = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                const CatIcon = cat.icon;

                return (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 transition shadow-sm gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center shrink-0`}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {expense.title}
                          </span>
                          <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Người chi: <strong>{expense.paidBy}</strong></span>
                          <span>•</span>
                          <span>Ngày: {expense.date}</span>
                          {expense.splitWith && expense.splitWith.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600">Chia {expense.splitWith.length} người</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                        {formatVND(expense.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpense(expense);
                          setShowExpenseModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa khoản chi "${expense.title}"?`)) {
                            deleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. NỘI DUNG TAB 4: HÀNH LÝ & GIẤY TỜ CỦA RIÊNG CHUYẾN ĐI NÀY */}
      {/* ==================================================================== */}
      {mainTab === 'checklist' && (
        <div className="space-y-6">
          {/* Header Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Luggage className="w-5 h-5 text-purple-500" />
                <span>Hành Lý & Két Giấy Tờ ({trip.title})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đã chuẩn bị {tripChecklistDone}/{tripChecklistItems.length} món đồ ({tripChecklistPercent}%)
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>+ Lưu Vé / Booking Code</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddChecklistModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Món Đồ</span>
              </button>
            </div>
          </div>

          {/* 1-Click Preset Template Bar cho chuyến đi này */}
          <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Gợi ý mẫu nhanh theo chủ đề chuyến đi:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPresetTemplate('beach', trip.id, user?.uid)}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-purple-400 transition"
              >
                🏖️ Đi biển
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('mountain', trip.id, user?.uid)}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-purple-400 transition"
              >
                🧗 Leo núi
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('international', trip.id, user?.uid)}
                className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:border-purple-400 transition"
              >
                ✈️ Quốc tế
              </button>
            </div>
          </div>

          {/* Danh sách hành lý */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-purple-500" />
              <span>Danh sách đồ đạc cần mang ({tripChecklistItems.length})</span>
            </h4>

            {filteredTripChecklist.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-400">Chưa có danh sách đồ chuẩn bị cho chuyến đi này.</p>
                <button
                  type="button"
                  onClick={() => setShowAddChecklistModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                >
                  + Thêm món đồ đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredTripChecklist.map((item) => {
                  const cat = CHECKLIST_CATEGORY_CONFIG[item.category] || CHECKLIST_CATEGORY_CONFIG.other;
                  const CatIcon = cat.icon;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                        item.completed
                          ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-400 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-700 group-hover:border-purple-500'
                          }`}
                        >
                          {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate block ${
                              item.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-white'
                            }`}
                          >
                            {item.text}
                          </span>
                          <span className={`text-[10px] inline-flex items-center gap-1 ${cat.color}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{cat.label}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChecklistItem(item.id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Két giấy tờ vé máy bay & booking code của chuyến đi */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Két vé máy bay, voucher phòng & mã booking ({tripDocuments.length})</span>
            </h4>

            {tripDocuments.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-400">Chưa lưu vé máy bay hoặc mã phòng nào cho chuyến này.</p>
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  + Lưu vé / Booking PNR
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tripDocuments.map((doc) => {
                  const docCfg = DOC_TYPE_CONFIG[doc.docType] || DOC_TYPE_CONFIG.other;
                  const DocIcon = docCfg.icon;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DocIcon className={`w-4 h-4 ${docCfg.color}`} />
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {docCfg.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteDocumentItem(doc.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {doc.title}
                      </h5>

                      {doc.bookingCode && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">MÃ BOOKING</span>
                            <span className="font-mono font-black text-xs tracking-wider text-indigo-600 dark:text-indigo-400">
                              {doc.bookingCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(doc.id, doc.bookingCode!)}
                            className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-500 hover:text-slate-800"
                          >
                            {copiedCodeId === doc.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {doc.notes && (
                        <p className="text-xs text-slate-400 italic">💡 {doc.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS CỦA CÁC PHÂN HỆ CON */}
      {/* ==================================================================== */}
      {/* Modal thêm hoạt động lịch trình */}
      {showAddActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Thêm Hoạt Động (Ngày {selectedDayNumber})
              </h3>
              <button
                onClick={() => setShowAddActivityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tên hoạt động *</label>
                <input
                  type="text"
                  required
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="Ví dụ: Tham quan Cầu Rồng & Chợ đêm..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời gian</label>
                  <input
                    type="time"
                    value={newActivityTime}
                    onChange={(e) => setNewActivityTime(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Danh mục</label>
                  <select
                    value={newActivityCategory}
                    onChange={(e) => setNewActivityCategory(e.target.value as ActivityCategory)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2"
                  >
                    {Object.entries(CATEGORY_MAP).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Địa điểm</label>
                  <input
                    type="text"
                    value={newActivityLocation}
                    onChange={(e) => setNewActivityLocation(e.target.value)}
                    placeholder="Bãi biển, Nhà hàng..."
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chi phí dự kiến</label>
                  <input
                    type="number"
                    value={newActivityCost}
                    onChange={(e) => setNewActivityCost(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ghi chú</label>
                <input
                  type="text"
                  value={newActivityNotes}
                  onChange={(e) => setNewActivityNotes(e.target.value)}
                  placeholder="Lưu ý đồ mang theo, trang phục..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddActivityModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Thêm hoạt động
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tải ảnh lên chuyến đi */}
      {showUploadMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-500" />
                <span>Thêm Ảnh Vào Album ({trip.title})</span>
              </h3>
              <button
                onClick={() => setShowUploadMediaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMediaUploadMode('r2')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  mediaUploadMode === 'r2' ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Tải từ thiết bị
              </button>
              <button
                type="button"
                onClick={() => setMediaUploadMode('url')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  mediaUploadMode === 'url' ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Nhập Link Ảnh URL
              </button>
            </div>

            {mediaUploadMode === 'r2' ? (
              <div className="rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 text-center space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="trip-media-file"
                  className="hidden"
                  onChange={(e) => handleUploadR2(e.target.files)}
                />
                <label htmlFor="trip-media-file" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center mb-2">
                    {isUploadingR2 ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold text-cyan-600 hover:underline">
                    {isUploadingR2 ? `Đang tải lên (${uploadProgress}%)...` : 'Chọn ảnh từ thiết bị để tải lên'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={mediaCaptionInput}
                  onChange={(e) => setMediaCaptionInput(e.target.value)}
                  placeholder="Mô tả bức ảnh..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleAddMediaUrl}
                  className="w-full py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition"
                >
                  Lưu ảnh vào album
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Viết bài nhật ký cho chuyến này */}
      <CreateJournalModal
        isOpen={showCreateJournalModal}
        defaultTripId={trip.id}
        onClose={() => setShowCreateJournalModal(false)}
        onSubmit={async (entry) => {
          await addJournal({ ...entry, tripId: trip.id, tripTitle: trip.title }, user?.uid);
        }}
      />

      {/* Modal Chi tiết bài nhật ký */}
      <JournalDetailModal
        journal={selectedJournal}
        onClose={() => setSelectedJournal(null)}
        onDelete={(id) => deleteJournal(id)}
        onPreviewPhoto={(m) => setPreviewMedia(m)}
      />

      {/* Modal Phóng to ảnh (Lightbox) */}
      <MediaLightboxModal
        media={previewMedia}
        allMedia={tripMediaList}
        onClose={() => setPreviewMedia(null)}
        onSelectMedia={(m) => setPreviewMedia(m)}
      />

      {/* Modal Ghi nhận chi tiêu cho chuyến này */}
      <ExpenseFormModal
        isOpen={showExpenseModal}
        defaultTripId={trip.id}
        onClose={() => {
          setShowExpenseModal(false);
          setEditingExpense(null);
        }}
        initialData={
          editingExpense || {
            id: '',
            tripId: trip.id,
            tripTitle: trip.title,
            title: '',
            amount: 0,
            category: 'food',
            paidBy: 'Tôi',
            date: new Date().toISOString().split('T')[0],
            splitWith: trip.members && trip.members.length > 0 ? trip.members : ['Tôi'],
            createdAt: '',
            updatedAt: '',
          }
        }
        onSubmit={async (data) => {
          if (editingExpense) {
            await updateExpense(editingExpense.id, data);
          } else {
            await addExpense({ ...data, tripId: trip.id, tripTitle: trip.title }, user?.uid);
          }
        }}
      />

      {/* Modal Chia tiền nhóm cho chuyến này */}
      <BillSplitterModal
        isOpen={showSplitterModal}
        onClose={() => setShowSplitterModal(false)}
      />

      {/* Modal Thêm món đồ hành lý */}
      <AddChecklistItemModal
        isOpen={showAddChecklistModal}
        defaultTripId={trip.id}
        onClose={() => setShowAddChecklistModal(false)}
        onSubmit={async (data) => {
          await addChecklistItem({ ...data, tripId: trip.id }, user?.uid);
        }}
      />

      {/* Modal Lưu vé máy bay & booking code */}
      <AddTravelDocModal
        isOpen={showAddDocModal}
        defaultTripId={trip.id}
        onClose={() => setShowAddDocModal(false)}
        onSubmit={async (data) => {
          await addDocument({ ...data, tripId: trip.id, tripTitle: trip.title }, user?.uid);
        }}
      />
    </div>
  );
};
