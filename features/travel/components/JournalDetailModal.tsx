// features/travel/components/JournalDetailModal.tsx
'use client';

import React from 'react';
import {
  X,
  Calendar,
  MapPin,
  Star,
  Share2,
  Trash2,
  Compass,
  Sparkles,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { MOOD_CONFIG, WEATHER_CONFIG } from './JournalCard';
import { UnifiedMediaItem } from '../stores/useJournalStore';

interface JournalDetailModalProps {
  journal: JournalEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onPreviewPhoto: (media: UnifiedMediaItem) => void;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  journal,
  onClose,
  onDelete,
  onPreviewPhoto,
}) => {
  if (!journal) return null;

  const mood = journal.mood ? MOOD_CONFIG[journal.mood] : null;
  const weather = journal.weather ? WEATHER_CONFIG[journal.weather] : null;
  const WeatherIcon = weather?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Cover Hero */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950 shrink-0">
          <img
            src={
              journal.coverImage ||
              journal.images[0]?.url ||
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop'
            }
            alt={journal.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trip pill on top */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {journal.tripTitle && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-600/80 text-white backdrop-blur-md border border-cyan-400/40 flex items-center gap-1.5 shadow-md">
                <Compass className="w-3.5 h-3.5" />
                {journal.tripTitle}
              </span>
            )}
          </div>

          {/* Title & Metadata over Hero */}
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {mood && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border flex items-center gap-1.5 ${mood.bg} ${mood.color}`}
                >
                  <span>{mood.emoji}</span>
                  <span>Tâm trạng: {mood.label}</span>
                </span>
              )}

              {weather && WeatherIcon && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                  <WeatherIcon className={`w-3.5 h-3.5 ${weather.color}`} />
                  <span>{weather.label}</span>
                </span>
              )}

              {journal.rating && journal.rating > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 text-xs">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < journal.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-amber-400 ml-1">{journal.rating}/5</span>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {journal.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {journal.date} {journal.time && `lúc ${journal.time}`}
              </span>
              {journal.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {journal.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Story Body & Photo Gallery */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">
          {/* Text Story */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Dòng nhật ký & Câu chuyện</span>
            </h2>

            <div className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-sans">
              {journal.content}
            </div>
          </div>

          {/* Attached Gallery */}
          {journal.images && journal.images.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Kho ảnh kỷ niệm đính kèm ({journal.images.length})
                </h2>
                <span className="text-xs text-slate-400">Bấm vào ảnh để phóng to</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {journal.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() =>
                      onPreviewPhoto({
                        id: img.id,
                        url: img.url,
                        caption: img.caption,
                        sourceType: 'journal',
                        sourceId: journal.id,
                        sourceTitle: journal.title,
                        date: journal.date,
                        location: journal.location,
                      })
                    }
                    className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 aspect-video sm:aspect-4/3 cursor-pointer shadow-sm hover:shadow-md transition"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || journal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      {img.caption && (
                        <p className="text-xs text-white font-medium truncate">{img.caption}</p>
                      )}
                      <span className="text-[10px] text-cyan-300 flex items-center gap-1 mt-1">
                        <Maximize2 className="w-3 h-3" />
                        <span>Xem kích thước đầy đủ</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {journal.tags && journal.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400">Thẻ chủ đề:</span>
              {journal.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa bài nhật ký "${journal.title}"?`)) {
                onDelete(journal.id);
                onClose();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa bài này</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
