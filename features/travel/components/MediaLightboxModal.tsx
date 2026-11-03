// features/travel/components/MediaLightboxModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  Check,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { UnifiedMediaItem } from '../stores/useJournalStore';

interface MediaLightboxModalProps {
  media: UnifiedMediaItem | null;
  allMedia: UnifiedMediaItem[];
  onClose: () => void;
  onSelectMedia: (media: UnifiedMediaItem) => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  media,
  allMedia,
  onClose,
  onSelectMedia,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!media) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [media, allMedia]);

  if (!media) return null;

  const currentIndex = allMedia.findIndex((m) => m.id === media.id);

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < allMedia.length - 1) {
      onSelectMedia(allMedia[currentIndex + 1]);
    } else if (allMedia.length > 0) {
      onSelectMedia(allMedia[0]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectMedia(allMedia[currentIndex - 1]);
    } else if (allMedia.length > 0) {
      onSelectMedia(allMedia[allMedia.length - 1]);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(media.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fadeIn select-none">
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 px-4 sm:px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 text-white">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
            {currentIndex + 1} / {allMedia.length}
          </span>
          <span className="text-xs text-slate-300 font-medium truncate max-w-[250px] sm:max-w-md">
            {media.sourceTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Sao chép link ảnh"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Copy Link'}</span>
          </button>

          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Mở trong tab mới"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Mở ảnh gốc</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-red-600 text-white backdrop-blur-md transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev / Next Arrows */}
      {allMedia.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition cursor-pointer z-20 group"
            title="Ảnh trước (Mũi tên trái)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition cursor-pointer z-20 group"
            title="Ảnh tiếp theo (Mũi tên phải)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Main Image Display */}
      <div className="relative max-w-[92vw] max-h-[82vh] flex items-center justify-center p-2">
        <img
          src={media.url}
          alt={media.caption || 'Photo'}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all"
        />
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 text-center">
        {media.caption && (
          <h3 className="text-sm sm:text-base font-bold text-white max-w-xl mx-auto drop-shadow-md">
            {media.caption}
          </h3>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-slate-300 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {media.date}
          </span>
          {media.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              {media.location}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 text-[10px] font-bold">
            {media.sourceType === 'journal' ? 'Từ bài nhật ký' : 'Từ chuyến đi'}
          </span>
        </div>
      </div>
    </div>
  );
};
