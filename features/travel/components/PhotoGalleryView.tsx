// features/travel/components/PhotoGalleryView.tsx
'use client';

import React, { useState } from 'react';
import {
  Camera,
  Plus,
  Search,
  Filter,
  Maximize2,
  Calendar,
  MapPin,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Compass,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { UnifiedMediaItem } from '../stores/useJournalStore';
import { useTravelStore } from '../stores/useTravelStore';
import { uploadFileToR2 } from '@/core/cloudflare/client';

interface PhotoGalleryViewProps {
  mediaList: UnifiedMediaItem[];
  onSelectMedia: (media: UnifiedMediaItem) => void;
  onRefreshMedia?: () => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  mediaList,
  onSelectMedia,
}) => {
  const { trips, addMedia } = useTravelStore();

  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Quick upload modal state
  const [targetTripId, setTargetTripId] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'r2' | 'url'>('r2');
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filter media
  const filteredMedia = mediaList.filter((item) => {
    const matchesTrip =
      selectedTripFilter === 'all' ||
      item.sourceId === selectedTripFilter ||
      item.sourceTitle.toLowerCase().includes(selectedTripFilter.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      (item.caption && item.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTrip && matchesSearch;
  });

  const handleUploadR2 = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!targetTripId && trips.length > 0) {
      alert('Vui lòng chọn chuyến đi để gán ảnh vào album');
      return;
    }

    const tripId = targetTripId || trips[0]?.id;
    if (!tripId) return;

    setIsUploading(true);
    setProgress(0);

    const fileList = Array.from(files);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const res = await uploadFileToR2(file, {
          folder: 'images',
          onProgress: (p) => {
            const overall = Math.round(((i + p.percentage / 100) / fileList.length) * 100);
            setProgress(overall);
          },
        });

        if (res.publicUrl) {
          await addMedia(tripId, {
            url: res.publicUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải ảnh:', err);
      }
    }

    setIsUploading(false);
    setShowUploadModal(false);
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    const tripId = targetTripId || trips[0]?.id;
    if (!tripId) {
      alert('Vui lòng chọn chuyến đi để thêm ảnh');
      return;
    }

    await addMedia(tripId, {
      url: urlInput.trim(),
      caption: captionInput.trim() || undefined,
    });

    setUrlInput('');
    setCaptionInput('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mô tả ảnh, điểm đến, chuyến đi..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Trip filter & Upload button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTripFilter}
              onChange={(e) => setSelectedTripFilter(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Tất cả chuyến đi ({mediaList.length} ảnh)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ảnh vào kho</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      {filteredMedia.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-white">
            {searchQuery || selectedTripFilter !== 'all'
              ? 'Không tìm thấy ảnh phù hợp'
              : 'Kho ảnh & Video hiện đang trống'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery || selectedTripFilter !== 'all'
              ? 'Hãy thử thay đổi từ khóa hoặc chọn hiển thị tất cả chuyến đi.'
              : 'Tải lên những tấm hình đẹp nhất hoặc viết nhật ký để lưu giữ khoảnh khắc tại đây.'}
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition cursor-pointer"
          >
            + Tải ảnh lên ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectMedia(item)}
              className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              <img
                src={item.url}
                alt={item.caption || item.sourceTitle}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                {item.caption && (
                  <p className="text-xs font-semibold line-clamp-1 drop-shadow-md">{item.caption}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                  <span className="truncate max-w-[120px]">{item.sourceTitle}</span>
                  <Maximize2 className="w-3 h-3 text-cyan-400 shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Quick Upload Photo */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-500" />
                <span>Thêm ảnh vào Album</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Target Trip */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Gán vào chuyến đi:
              </label>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('r2')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  uploadMode === 'r2'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Tải lên Cloudflare R2
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  uploadMode === 'url'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Nhập Link Ảnh URL
              </button>
            </div>

            {uploadMode === 'r2' ? (
              <div className="rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 text-center space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="album-file-input"
                  className="hidden"
                  onChange={(e) => handleUploadR2(e.target.files)}
                />
                <label htmlFor="album-file-input" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center mb-2">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-cyan-600 hover:underline">
                    {isUploading ? `Đang tải lên (${progress}%)...` : 'Chọn ảnh để tải lên R2'}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Mô tả bức ảnh..."
                  className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleAddUrl}
                  className="w-full py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition cursor-pointer"
                >
                  Lưu ảnh vào album
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
