// features/travel/components/SharedTripView.tsx
'use client';

import React, { useState } from 'react';
import { Trip, TripActivity, DayItinerary } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Utensils,
  Hotel,
  Camera,
  HeartHandshake,
  Share2,
  ExternalLink,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  DollarSign,
  CheckSquare,
  Image as ImageIcon,
  Users,
} from 'lucide-react';

interface SharedTripViewProps {
  trip: Trip;
  onExit?: () => void;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  transport: { label: 'Di chuyển', icon: Car, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  hotel: { label: 'Lưu trú', icon: Hotel, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  food: { label: 'Ẩm thực', icon: Utensils, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  sightseeing: { label: 'Tham quan', icon: Camera, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  relax: { label: 'Nghỉ dưỡng', icon: HeartHandshake, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  other: { label: 'Khác', icon: Sparkles, color: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20' },
};

export const SharedTripView: React.FC<SharedTripViewProps> = ({ trip, onExit }) => {
  const [selectedDay, setSelectedDay] = useState<number>(trip.itinerary[0]?.day || 1);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const shareConfig = trip.shareConfig || {
    isPublicLinkEnabled: true,
    shareToken: '',
    hideBudget: false,
    hideAlbum: false,
    hideChecklist: false,
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const currentDayData = trip.itinerary.find((d) => d.day === selectedDay);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onExit && (
              <Button variant="ghost" size="sm" onClick={onExit} className="gap-1 text-xs">
                <ChevronLeft className="h-4 w-4" />
                Quay lại ứng dụng
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent text-sm md:text-base">
                Sổ Tay Béo
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/30 text-primary">
                Chia sẻ gia đình
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                if (navigator?.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã sao chép liên kết chuyến đi!');
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sao chép link</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 bg-neutral-900 overflow-hidden">
        <img
          src={trip.coverImage || 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200'}
          alt={trip.title}
          className="w-full h-full object-cover object-center opacity-85 scale-105 transition-transform duration-700 hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="default" className="bg-primary/90 text-white font-medium">
              {trip.status === 'planning' ? 'Sắp khởi hành' : trip.status === 'ongoing' ? 'Đang diễn ra' : 'Đã hoàn thành'}
            </Badge>
            <span className="flex items-center text-white/90 text-xs font-medium gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              {trip.destination}
            </span>
            <span className="flex items-center text-white/90 text-xs font-medium gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
            {trip.title}
          </h1>

          {trip.notes && (
            <p className="text-sm text-neutral-200 mt-2 max-w-2xl line-clamp-2 drop-shadow">
              {trip.notes}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Quick Highlights / Budget Bar (If not hidden) */}
        {!shareConfig.hideBudget && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                Ngân sách dự kiến
              </div>
              <div className="text-xl font-bold text-foreground">{formatCurrency(trip.budget)}</div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                Đã thanh toán
              </div>
              <div className="text-xl font-bold text-blue-500">{formatCurrency(trip.spent)}</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border bg-card shadow-sm">
              <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                Đoàn tham gia
              </div>
              <div className="text-sm font-semibold text-foreground truncate">
                {(trip.members && trip.members.length > 0) ? trip.members.join(', ') : 'Gia đình & Người thân'}
              </div>
            </div>
          </div>
        )}

        {/* Itinerary Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Lịch Trình Chi Tiết</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Theo dõi kế hoạch di chuyển, ăn uống và nghỉ ngơi từng ngày
              </p>
            </div>
          </div>

          {/* Day Tabs */}
          {trip.itinerary.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {trip.itinerary.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                      selectedDay === day.day
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    Ngày {day.day} ({formatDate(day.date)})
                  </button>
                ))}
              </div>

              {/* Selected Day Activities Timeline */}
              {currentDayData && (
                <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
                  {currentDayData.title && (
                    <div className="pb-3 border-b border-border font-bold text-base text-foreground">
                      {currentDayData.title}
                    </div>
                  )}

                  {currentDayData.activities.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      Chưa có hoạt động nào được ghi nhận cho ngày này.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                      {currentDayData.activities.map((act) => {
                        const cat = CATEGORY_MAP[act.category] || CATEGORY_MAP.other;
                        const Icon = cat.icon;

                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot */}
                            <div className="absolute -left-[27px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />

                            <div className="p-4 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/30 transition-all space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1 font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                    <Clock className="h-3 w-3" />
                                    {act.time}
                                  </span>
                                  <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${cat.color}`}>
                                    <Icon className="h-2.5 w-2.5 mr-1 inline" />
                                    {cat.label}
                                  </Badge>
                                </div>

                                {!shareConfig.hideBudget && act.cost && act.cost > 0 ? (
                                  <span className="text-xs font-semibold text-emerald-500 font-mono">
                                    {formatCurrency(act.cost)}
                                  </span>
                                ) : null}
                              </div>

                              <div className="font-semibold text-foreground text-sm sm:text-base">
                                {act.title}
                              </div>

                              {act.location && (
                                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                    {act.location}
                                  </span>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline shrink-0"
                                  >
                                    Xem Google Maps
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </div>
                              )}

                              {act.notes && (
                                <div className="p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                                  💡 {act.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
              Lịch trình đang được cập nhật thêm...
            </div>
          )}
        </section>

        {/* Photo Album Section (If not hidden) */}
        {!shareConfig.hideAlbum && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-primary" />
                  Album Kỷ Niệm Chuyến Đi
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Những bức ảnh ghi lại từng khoảnh khắc đáng nhớ
                </p>
              </div>
            </div>

            {(!trip.media || trip.media.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-border rounded-2xl text-muted-foreground text-sm bg-card">
                <Camera className="h-10 w-10 mx-auto mb-2 opacity-30 text-primary" />
                <p className="font-medium">Chưa có ảnh nào được tải lên cho chuyến đi này</p>
                <p className="text-xs text-muted-foreground mt-0.5">Các khoảnh khắc mới nhất sẽ xuất hiện tại đây khi bạn hoặc gia đình tải lên</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {trip.media.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxImage(img.url)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-neutral-900 cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || 'Ảnh chuyến đi'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {img.caption && (
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-[11px] text-white line-clamp-1 font-medium">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Personal Checklist (If not hidden) */}
        {!shareConfig.hideChecklist && trip.checklist && trip.checklist.length > 0 && (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-500" />
                Danh Sách Chuẩn Bị Hành Lý
              </h2>
              <p className="text-xs text-muted-foreground">
                Những vật dụng cần mang theo cho cả đoàn
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {trip.checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`h-4 w-4 ${item.completed ? 'text-emerald-500' : 'text-neutral-400'}`}
                    />
                    <span className={item.completed ? 'line-through text-muted-foreground font-normal' : 'text-foreground font-medium'}>
                      {item.text}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {item.category}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-border py-8 text-center text-xs text-muted-foreground bg-muted/20">
        <p className="font-semibold text-foreground">Sổ Tay Béo - Quản Lý Chuyến Đi & Kỳ Nghỉ Gia Đình</p>
        <p className="mt-1">Được chia sẻ an toàn với sự bảo vệ mã hóa</p>
      </footer>
    </div>
  );
};
