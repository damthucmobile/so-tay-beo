// features/travel/TravelFeature.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Compass,
  Plus,
  Search,
  Filter,
  Palmtree,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useTravelStore } from './stores/useTravelStore';
import { TripStats } from './components/TripStats';
import { TripCard } from './components/TripCard';
import { TripDetailView } from './components/TripDetailView';
import { CreateTripModal } from './components/CreateTripModal';
import { TripStatus } from './types';

interface TravelFeatureProps {
  onNavigateTab?: (tab: any) => void;
}

export const TravelFeature: React.FC<TravelFeatureProps> = ({ onNavigateTab }) => {
  const {
    trips,
    selectedTripId,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    setSelectedTripId,
    addTrip,
    updateTrip,
    deleteTrip,
    addActivity,
    toggleActivityComplete,
    deleteActivity,
  } = useTravelStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // If a trip is selected, show its full detail & itinerary view
  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  if (selectedTrip) {
    return (
      <TripDetailView
        trip={selectedTrip}
        onBack={() => setSelectedTripId(null)}
        onUpdateStatus={(id, status) => updateTrip(id, { status })}
        onAddActivity={addActivity}
        onToggleActivity={toggleActivityComplete}
        onDeleteActivity={deleteActivity}
      />
    );
  }

  // Filter trips by search query and status filter
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      !searchQuery.trim() ||
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.notes && trip.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-7xl mx-auto">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/15">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-emerald-100 border border-white/20">
              <Palmtree className="w-3.5 h-3.5 text-emerald-200" />
              <span>Phân hệ Du lịch & Nghỉ dưỡng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Lịch Trình & Kế Hoạch Chuyến Đi
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50/90 max-w-2xl leading-relaxed">
              Thiết kế lịch trình du lịch chi tiết từng ngày, theo dõi ngân sách chi tiêu thực tế và lưu
              giữ những cung đường đáng nhớ cùng người thân.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg font-bold text-xs sm:text-sm h-11 px-6 rounded-2xl shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2 text-emerald-700" />
            <span>Tạo Chuyến Đi Mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <TripStats trips={trips} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên chuyến đi, điểm đến (Hà Giang, Đà Nẵng...)"
            className="pl-9 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-800/50"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'planning', label: 'Đang lên lịch' },
            { id: 'ongoing', label: 'Đang diễn ra' },
            { id: 'completed', label: 'Đã hoàn thành' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as TripStatus | 'all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid View */}
      {filteredTrips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center">
            <Compass className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">
              {searchQuery || statusFilter !== 'all'
                ? 'Không tìm thấy chuyến đi phù hợp'
                : 'Bạn chưa có kế hoạch chuyến đi nào'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
                : 'Bắt đầu lên lịch cho hành trình sắp tới: địa điểm, ngày giờ, danh sách các điểm check-in và dự toán chi phí.'}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Tạo chuyến đi đầu tiên ngay</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onSelect={(id) => setSelectedTripId(id)}
              onDelete={(id) => deleteTrip(id)}
            />
          ))}
        </div>
      )}

      {/* Modal create trip */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={addTrip}
      />
    </div>
  );
};
