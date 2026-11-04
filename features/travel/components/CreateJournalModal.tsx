// features/travel/components/CreateJournalModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Star,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Trash2,
  Loader2,
  Compass,
} from 'lucide-react';
import { JournalEntry, MoodType, WeatherType, JournalImage } from '../types';
import { useTravelStore } from '../stores/useTravelStore';
import { uploadFileToR2 } from '@/core/cloudflare/client';
import { MOOD_CONFIG, WEATHER_CONFIG } from './JournalCard';

interface CreateJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<any>;
  defaultTripId?: string;
}

export const CreateJournalModal: React.FC<CreateJournalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTripId,
}) => {
  const { trips } = useTravelStore();

  const [tripId, setTripId] = useState<string>(defaultTripId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [mood, setMood] = useState<MoodType>('happy');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [rating, setRating] = useState<number>(5);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<JournalImage[]>([]);

  // Media add mode (upload R2 or URL)
  const [mediaTab, setMediaTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddUrlImage = () => {
    if (!urlInput.trim()) return;
    const newImg: JournalImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      url: urlInput.trim(),
      caption: captionInput.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setImages([...images, newImg]);
    setUrlInput('');
    setCaptionInput('');
  };

  const handleUploadR2Files = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedList: JournalImage[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const res = await uploadFileToR2(file, {
          folder: 'images',
          onProgress: (p) => {
            const overall = Math.round(((i + p.percentage / 100) / fileArray.length) * 100);
            setUploadProgress(overall);
          },
        });

        if (res.publicUrl) {
          uploadedList.push({
            id: `img-r2-${Date.now()}-${i}`,
            url: res.publicUrl,
            caption: file.name.replace(/\.[^/.]+$/, ''),
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error('Lỗi khi tải ảnh lên Cloudflare R2:', err);
      }
    }

    setImages((prev) => [...prev, ...uploadedList]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài nhật ký');
      return;
    }
    if (!content.trim()) {
      alert('Vui lòng viết đôi dòng cảm nghĩ/nội dung nhật ký');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTrip = trips.find((t) => t.id === tripId);
      await onSubmit({
        tripId: tripId || undefined,
        tripTitle: selectedTrip?.title || undefined,
        title: title.trim(),
        content: content.trim(),
        location: location.trim() || selectedTrip?.destination || undefined,
        date,
        time,
        mood,
        weather,
        rating,
        coverImage: images[0]?.url || undefined,
        images,
        tags,
      });
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu bài nhật ký:', err);
      alert('Có lỗi xảy ra khi lưu bài viết. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Viết Nhật Ký & Kỷ Niệm Chuyến Đi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ghi lại khoảnh khắc, cảm xúc và đính kèm album ảnh/video
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Trip Selector & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Thuộc chuyến đi
              </label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Nhật ký tự do (Không theo chuyến)</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.destination})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tiêu đề nhật ký <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Hoàng hôn buông trên bãi biển Mỹ Khê tuyệt đẹp..."
                className="w-full text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Date, Time & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ngày ghi</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời gian</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Địa điểm / Tọa độ check-in
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ví dụ: Bãi biển Mỹ Khê, Đà Nẵng"
                className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Mood, Weather & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            {/* Mood */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tâm trạng</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              >
                {Object.entries(MOOD_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.emoji} {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Weather */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thời tiết</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as WeatherType)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
              >
                {Object.entries(WEATHER_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Đánh giá trải nghiệm
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-500 ml-1">{rating}/5 sao</span>
              </div>
            </div>
          </div>

          {/* Journal Text Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Nội dung nhật ký / Trải nghiệm chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hôm nay bạn đã đi đâu, gặp ai, món ăn nào ngon và điều gì khiến bạn ấn tượng nhất? Hãy viết lại những cảm xúc chân thật nhất..."
              className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Thẻ chủ đề (Tags)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nhập thẻ (Check-in, Ẩm thực, Săn mây...) và ấn Enter"
                className="flex-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition cursor-pointer"
              >
                + Thêm
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attached Photos (Cloudflare R2 or URL) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ảnh / Video kỷ niệm đính kèm ({images.length})
              </label>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMediaTab('upload')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    mediaTab === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tải từ thiết bị
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab('url')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    mediaTab === 'url'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Nhập link URL
                </button>
              </div>
            </div>

            {mediaTab === 'upload' ? (
              <div className="rounded-2xl border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 text-center space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  id="journal-file-upload"
                  className="hidden"
                  onChange={(e) => handleUploadR2Files(e.target.files)}
                />
                <label
                  htmlFor="journal-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
                      {isUploading ? `Đang tải ảnh lên (${uploadProgress}%)...` : 'Chọn ảnh từ thiết bị để tải lên'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hỗ trợ JPG, PNG, WEBP, ảnh chất lượng cao không nén
                    </p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Dán link ảnh (https://images.unsplash.com/...)"
                  className="flex-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
                />
                <input
                  type="text"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Mô tả ảnh (Tùy chọn)"
                  className="sm:w-48 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleAddUrlImage}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-700 transition cursor-pointer"
                >
                  Thêm ảnh
                </button>
              </div>
            )}

            {/* Uploaded thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <img src={img.url} alt={img.caption || 'Thumbnail'} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-600 text-white">
                        Ảnh bìa
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 hover:from-cyan-700 hover:to-blue-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Đăng Bài Nhật Ký</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
