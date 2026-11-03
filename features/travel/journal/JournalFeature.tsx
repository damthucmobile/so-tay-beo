// features/travel/journal/JournalFeature.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Camera,
  BookOpen,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  Filter,
  Image as ImageIcon,
  Compass,
  Star,
  CloudUpload,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useTravelStore } from '../stores/useTravelStore';
import { useJournalStore, UnifiedMediaItem } from '../stores/useJournalStore';
import { JournalCard, MOOD_CONFIG } from '../components/JournalCard';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { CreateJournalModal } from '../components/CreateJournalModal';
import { PhotoGalleryView } from '../components/PhotoGalleryView';
import { MediaLightboxModal } from '../components/MediaLightboxModal';
import { MoodType, JournalEntry } from '../types';

interface JournalFeatureProps {
  onNavigateTab?: (tab: any) => void;
}

export const JournalFeature: React.FC<JournalFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { trips, fetchTrips } = useTravelStore();
  const {
    journals,
    isLoading,
    searchQuery,
    selectedTripFilter,
    selectedMood,
    activeTab,
    selectedJournal,
    previewMedia,
    setSearchQuery,
    setSelectedTripFilter,
    setSelectedMood,
    setActiveTab,
    setSelectedJournal,
    setPreviewMedia,
    fetchJournals,
    addJournal,
    deleteJournal,
  } = useJournalStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tải dữ liệu từ Firestore
  useEffect(() => {
    if (user?.uid) {
      fetchTrips(user.uid);
      fetchJournals(user.uid);
    }
  }, [user?.uid, fetchTrips, fetchJournals]);

  // Gom toàn bộ ảnh từ các bài nhật ký & từ kho ảnh của từng chuyến đi
  const allMediaList: UnifiedMediaItem[] = useMemo(() => {
    const list: UnifiedMediaItem[] = [];

    // 1. Ảnh từ bài nhật ký
    journals.forEach((j) => {
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

    // 2. Ảnh từ thuộc tính media của từng chuyến đi
    trips.forEach((trip) => {
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
    });

    return list;
  }, [journals, trips]);

  // Lọc bài nhật ký theo search, trip, mood
  const filteredJournals = useMemo(() => {
    return journals.filter((j) => {
      const matchesSearch =
        !searchQuery.trim() ||
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (j.location && j.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (j.tags && j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesTrip = selectedTripFilter === 'all' || j.tripId === selectedTripFilter;
      const matchesMood = selectedMood === 'all' || j.mood === selectedMood;

      return matchesSearch && matchesTrip && matchesMood;
    });
  }, [journals, searchQuery, selectedTripFilter, selectedMood]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl shadow-cyan-500/15">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-cyan-100 border border-white/20">
                <Camera className="w-3.5 h-3.5 text-cyan-200" />
                <span>Nhật Ký & Album Kỷ Niệm</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 backdrop-blur-md text-[11px] font-semibold text-cyan-200 border border-cyan-400/30">
                <CloudUpload className="w-3 h-3 text-cyan-300" />
                <span>Cloudflare R2 Storage (Lưu trữ ảnh gốc không giới hạn)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Kỷ Niệm & Kho Báu Hành Trình
            </h1>
            <p className="text-xs sm:text-sm text-cyan-50/90 max-w-2xl leading-relaxed">
              Lưu giữ những xúc cảm chân thật, câu chuyện văn hóa, ẩm thực khó quên và thư viện ảnh
              độ phân giải cao sau mỗi chuyến đi cùng người thân yêu.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-cyan-800 hover:bg-cyan-50 shadow-lg font-bold text-xs sm:text-sm h-11 px-5 rounded-2xl shrink-0 cursor-pointer active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-cyan-800" />
              <span>Viết Nhật Ký Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Bài nhật ký</span>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {journals.length}
            </h4>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Kho ảnh & Video</span>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {allMediaList.length}
            </h4>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Chuyến đi gắn liền</span>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {trips.length}
            </h4>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Điểm hài lòng</span>
            <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              5.0 ★
            </h4>
          </div>
        </div>
      </div>

      {/* Main Mode Tabs: Dòng nhật ký vs Kho ảnh */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('journals')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'journals'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Bài Viết Nhật Ký ({journals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('album')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'album'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Thư Viện Album Ảnh ({allMediaList.length})</span>
          </button>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'journals' ? (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhật ký, địa danh, món ăn, cảm xúc..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Trip & Mood Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Trip selector filter */}
              <select
                value={selectedTripFilter}
                onChange={(e) => setSelectedTripFilter(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Tất cả chuyến đi</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              {/* Mood selector filter */}
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value as MoodType | 'all')}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Tất cả cảm xúc</option>
                {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Journals Grid */}
          {isLoading ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-card p-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Đang tải các trang nhật ký...</p>
            </div>
          ) : filteredJournals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">
                  {searchQuery || selectedTripFilter !== 'all' || selectedMood !== 'all'
                    ? 'Không tìm thấy bài nhật ký phù hợp'
                    : 'Bạn chưa có trang nhật ký nào'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery || selectedTripFilter !== 'all' || selectedMood !== 'all'
                    ? 'Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc tìm kiếm.'
                    : 'Hãy viết lại những câu chuyện, điểm đến tuyệt đẹp và cảm xúc đầu tiên của chuyến đi!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                + Bắt đầu viết ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJournals.map((journal) => (
                <JournalCard
                  key={journal.id}
                  journal={journal}
                  onSelect={(j) => setSelectedJournal(j)}
                  onDelete={(id) => deleteJournal(id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Photo Gallery View */
        <PhotoGalleryView
          mediaList={allMediaList}
          onSelectMedia={(m) => setPreviewMedia(m)}
        />
      )}

      {/* Modal View Journal Detail */}
      <JournalDetailModal
        journal={selectedJournal}
        onClose={() => setSelectedJournal(null)}
        onDelete={(id) => deleteJournal(id)}
        onPreviewPhoto={(media) => setPreviewMedia(media)}
      />

      {/* Modal Create Journal */}
      <CreateJournalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (entry) => {
          await addJournal(entry, user?.uid);
        }}
      />

      {/* Lightbox Modal for Photo viewing */}
      <MediaLightboxModal
        media={previewMedia}
        allMedia={allMediaList}
        onClose={() => setPreviewMedia(null)}
        onSelectMedia={(m) => setPreviewMedia(m)}
      />
    </div>
  );
};
