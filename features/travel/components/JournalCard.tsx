// features/travel/components/JournalCard.tsx
'use client';

import React from 'react';
import {
  Calendar,
  MapPin,
  Star,
  Camera,
  Trash2,
  Edit3,
  ArrowRight,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Smile,
  Heart,
  Sparkles,
  Compass,
} from 'lucide-react';
import { JournalEntry, MoodType, WeatherType } from '../types';

interface JournalCardProps {
  journal: JournalEntry;
  onSelect: (journal: JournalEntry) => void;
  onDelete: (id: string) => void;
}

export const MOOD_CONFIG: Record<
  MoodType,
  { label: string; emoji: string; color: string; bg: string }
> = {
  excited: { label: 'Hào hứng', emoji: '🤩', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  peaceful: { label: 'Yên bình', emoji: '🌿', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  happy: { label: 'Hạnh phúc', emoji: '🥰', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  relax: { label: 'Thư giãn', emoji: '☕', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  adventure: { label: 'Phiêu lưu', emoji: '🧗', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  awed: { label: 'Choáng ngợp', emoji: '✨', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
};

export const WEATHER_CONFIG: Record<
  WeatherType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  sunny: { label: 'Nắng đẹp', icon: Sun, color: 'text-amber-500' },
  cloudy: { label: 'Nhiều mây', icon: Wind, color: 'text-slate-400' },
  rainy: { label: 'Mưa lãng mạn', icon: CloudRain, color: 'text-blue-400' },
  cold: { label: 'Se lạnh', icon: Snowflake, color: 'text-cyan-400' },
  breezy: { label: 'Gió mát', icon: Wind, color: 'text-teal-400' },
};

export const JournalCard: React.FC<JournalCardProps> = ({ journal, onSelect, onDelete }) => {
  const mood = journal.mood ? MOOD_CONFIG[journal.mood] : null;
  const weather = journal.weather ? WEATHER_CONFIG[journal.weather] : null;
  const WeatherIcon = weather?.icon;

  return (
    <div
      onClick={() => onSelect(journal)}
      className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Cover Image & Overlays */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
        <img
          src={
            journal.coverImage ||
            journal.images[0]?.url ||
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop'
          }
          alt={journal.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

        {/* Top badges (Trip Name & Photos Count) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {journal.tripTitle ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/70 text-cyan-300 backdrop-blur-md border border-cyan-500/30 truncate max-w-[200px]">
              <Compass className="w-3 h-3 inline mr-1" />
              {journal.tripTitle}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/70 text-slate-300 backdrop-blur-md border border-white/10">
              Nhật ký tự do
            </span>
          )}

          <div className="flex items-center gap-1.5">
            {journal.images && journal.images.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md flex items-center gap-1 border border-white/10">
                <Camera className="w-3 h-3 text-cyan-400" />
                {journal.images.length}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Bạn có chắc muốn xóa bài nhật ký "${journal.title}"?`)) {
                  onDelete(journal.id);
                }
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-white/80 hover:text-white backdrop-blur-md transition cursor-pointer"
              title="Xóa bài viết"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom meta over image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/90 text-xs">
          <div className="flex items-center gap-2">
            {mood && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-md border flex items-center gap-1 ${mood.bg} ${mood.color}`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </span>
            )}

            {weather && WeatherIcon && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/50 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <WeatherIcon className={`w-3 h-3 ${weather.color}`} />
                <span>{weather.label}</span>
              </span>
            )}
          </div>

          {/* Rating stars */}
          {journal.rating && journal.rating > 0 && (
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < journal.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate-500'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Date & Location */}
          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {journal.date} {journal.time && `• ${journal.time}`}
            </span>
            {journal.location && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">{journal.location}</span>
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
            {journal.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {journal.content}
          </p>
        </div>

        {/* Tags and read more link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden flex-1">
            {journal.tags && journal.tags.length > 0 ? (
              journal.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 truncate max-w-[100px]"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">Xem câu chuyện đầy đủ</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform shrink-0">
            <span>Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
