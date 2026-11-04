// features/travel/checklist/ChecklistFeature.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  ShieldCheck,
  Luggage,
  Sparkles,
  Plane,
  Hotel,
  Ticket,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Palmtree,
  Mountain,
  Globe,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useTravelStore } from '../stores/useTravelStore';
import { useChecklistStore } from '../stores/useChecklistStore';
import {
  AddChecklistItemModal,
  CHECKLIST_CATEGORY_CONFIG,
} from './components/AddChecklistItemModal';
import { AddTravelDocModal, DOC_TYPE_CONFIG } from './components/AddTravelDocModal';
import { ChecklistCategory, TravelDocType } from '../types';

interface ChecklistFeatureProps {
  onNavigateTab?: (tab: any) => void;
}

export const ChecklistFeature: React.FC<ChecklistFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { trips, fetchTrips } = useTravelStore();
  const {
    items,
    documents,
    selectedTripId,
    categoryFilter,
    activeTab,
    setSelectedTripId,
    setCategoryFilter,
    setActiveTab,
    fetchData,
    addItem,
    toggleItem,
    deleteItem,
    applyPresetTemplate,
    addDocument,
    deleteDocumentItem,
  } = useChecklistStore();

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchTrips(user.uid);
      fetchData(user.uid);
    }
  }, [user?.uid, fetchTrips, fetchData]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTrip =
        selectedTripId === 'all' || item.tripId === selectedTripId || item.tripId === 'general';
      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;

      return matchesTrip && matchesCategory;
    });
  }, [items, selectedTripId, categoryFilter]);

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      return selectedTripId === 'all' || doc.tripId === selectedTripId || doc.tripId === 'general';
    });
  }, [documents, selectedTripId]);

  // KPI
  const totalItems = filteredItems.length;
  const completedCount = filteredItems.filter((i) => i.completed).length;
  const remainingCount = totalItems - completedCount;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-800 p-6 sm:p-8 text-white shadow-xl shadow-purple-500/15">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-purple-100 border border-white/20">
                <Luggage className="w-3.5 h-3.5 text-purple-200" />
                <span>Hành Lý & Két Chuẩn Bị</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 backdrop-blur-md text-[11px] font-semibold text-purple-200 border border-purple-400/30">
                <ShieldCheck className="w-3 h-3 text-purple-300" />
                <span>Bảo mật vé & giấy tờ tùy thân</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Chuẩn Bị Hành Trang & Giấy Tờ
            </h1>
            <p className="text-xs sm:text-sm text-purple-50/90 max-w-2xl leading-relaxed">
              Checklist đồ dùng thông minh theo chủ đề chuyến đi, két an toàn tra cứu nhanh mã đặt
              vé máy bay, phòng khách sạn và vé tham quan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsAddDocOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>+ Thêm Vé / Giấy Tờ</span>
            </button>

            <button
              onClick={() => setIsAddItemOpen(true)}
              className="bg-white text-purple-900 hover:bg-purple-50 shadow-lg font-bold text-xs sm:text-sm h-11 px-5 rounded-2xl shrink-0 cursor-pointer active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-purple-900" />
              <span>Thêm Món Đồ</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tổng đồ đạc</span>
          <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {totalItems} món đồ
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">Trong danh sách hành lý</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Đã sắp vào vali</span>
          <h4 className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {completedCount} món
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">Đã đánh dấu hoàn thành</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Còn thiếu</span>
          <h4 className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {remainingCount} món
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">Cần chuẩn bị trước khi đi</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Sẵn sàng khởi hành</span>
            <span className="text-xs font-black text-purple-600">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-purple-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block">
            {progressPercent === 100 ? 'Đã chuẩn bị đầy đủ 100%!' : `Còn ${remainingCount} đồ cần mang`}
          </span>
        </div>
      </div>

      {/* Preset Templates Quick Bar */}
      <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            Bộ gợi ý mẫu 1-Click (Tự động thêm danh sách đồ chuẩn bị theo chủ đề):
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              applyPresetTemplate('beach', selectedTripId, user?.uid);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Palmtree className="w-3.5 h-3.5 text-cyan-500" />
            <span>Đi biển 🏖️</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applyPresetTemplate('mountain', selectedTripId, user?.uid);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-500" />
            <span>Leo núi / Trekking 🧗</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applyPresetTemplate('international', selectedTripId, user?.uid);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Du lịch nước ngoài ✈️</span>
          </button>

          <button
            type="button"
            onClick={() => {
              applyPresetTemplate('business', selectedTripId, user?.uid);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-purple-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5 text-amber-500" />
            <span>Chuyến công tác 💼</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs: Checklist vs Vault */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Danh Sách Hành Lý ({filteredItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Két Giấy Tờ & Mã Đặt Vé ({filteredDocs.length})</span>
          </button>
        </div>

        {/* Trip Filter */}
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 focus:outline-none"
        >
          <option value="all">Tất cả chuyến đi</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'checklist' ? (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Tất cả ({items.length})
            </button>
            {Object.entries(CHECKLIST_CATEGORY_CONFIG).map(([k, cfg]) => {
              const count = items.filter((i) => i.category === k).length;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategoryFilter(k as ChecklistCategory)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                    categoryFilter === k
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Checklist Items */}
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <CheckSquare className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                Chưa có đồ dùng nào trong danh mục này
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Bấm &quot;Thêm Món Đồ&quot; hoặc chọn các bộ gợi ý mẫu 1-Click phía trên để tự động lên đồ nhanh chóng.
              </p>
              <button
                type="button"
                onClick={() => setIsAddItemOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition cursor-pointer shadow-md shadow-purple-500/20"
              >
                + Thêm món đồ đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const cat = CHECKLIST_CATEGORY_CONFIG[item.category] || CHECKLIST_CATEGORY_CONFIG.other;
                const CatIcon = cat.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`group flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                      item.completed
                        ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-70'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
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
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              item.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-white'
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              x{item.quantity}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className={`inline-flex items-center gap-1 ${cat.color}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{cat.label}</span>
                          </span>
                          {item.notes && <span>• {item.notes}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 cursor-pointer ml-2"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Document Vault View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span>Két lưu trữ vé & giấy tờ quan trọng ({filteredDocs.length})</span>
            </h3>

            <button
              type="button"
              onClick={() => setIsAddDocOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lưu vé / Giấy tờ mới</span>
            </button>
          </div>

          {filteredDocs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                Két giấy tờ hiện đang trống
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Lưu lại mã đặt vé máy bay, voucher phòng khách sạn, căn cước công dân để dễ dàng tra cứu khi làm thủ tục check-in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map((doc) => {
                const docCfg = DOC_TYPE_CONFIG[doc.docType] || DOC_TYPE_CONFIG.other;
                const DocIcon = docCfg.icon;

                return (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <DocIcon className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {docCfg.label}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa "${doc.title}"?`)) {
                              deleteDocumentItem(doc.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        {doc.title}
                      </h4>

                      {doc.bookingCode && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Mã Booking / PNR</span>
                            <span className="font-mono font-black text-sm tracking-widest text-indigo-600 dark:text-indigo-400">
                              {doc.bookingCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(doc.id, doc.bookingCode!)}
                            className="p-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Sao chép mã"
                          >
                            {copiedCodeId === doc.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </div>
                      )}

                      {doc.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          💡 {doc.notes}
                        </p>
                      )}
                    </div>

                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <span>Xem ảnh vé / File đính kèm</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddChecklistItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onSubmit={async (data) => {
          await addItem(data, user?.uid);
        }}
      />

      <AddTravelDocModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
        onSubmit={async (data) => {
          await addDocument(data, user?.uid);
        }}
      />
    </div>
  );
};
