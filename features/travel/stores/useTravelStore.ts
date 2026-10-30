// features/travel/stores/useTravelStore.ts
'use client';

import { create } from 'zustand';
import { Trip, TripActivity, DayItinerary, TripStatus } from '../types';

interface TravelStore {
  trips: Trip[];
  selectedTripId: string | null;
  searchQuery: string;
  statusFilter: TripStatus | 'all';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TripStatus | 'all') => void;
  setSelectedTripId: (id: string | null) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => Trip;
  updateTrip: (id: string, trip: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addActivity: (tripId: string, dayNumber: number, activity: Omit<TripActivity, 'id'>) => void;
  toggleActivityComplete: (tripId: string, dayNumber: number, activityId: string) => void;
  deleteActivity: (tripId: string, dayNumber: number, activityId: string) => void;
}

const SAMPLE_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    title: 'Khám Phá Cung Đường Hà Giang - Mùa Hoa Tam Giác Mạch',
    destination: 'Hà Giang, Việt Nam',
    startDate: '2026-11-15',
    endDate: '2026-11-18',
    status: 'planning',
    coverImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
    budget: 8500000,
    spent: 2400000,
    notes: 'Mang theo áo khoác ấm vì nhiệt độ ban đêm tại Đồng Văn xuống dưới 12°C. Đặt xe máy trước tại TP Hà Giang.',
    members: ['Bạn thân', 'Người yêu'],
    tags: ['Phượt', 'Núi rừng', 'Săn mây'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itinerary: [
      {
        day: 1,
        date: '2026-11-15',
        title: 'Hà Nội - TP Hà Giang - Quản Bạ - Yên Minh',
        activities: [
          {
            id: 'act-1-1',
            time: '06:00',
            title: 'Khởi hành xe Limousine từ Hà Nội đi TP Hà Giang',
            location: 'Bến xe Mỹ Đình',
            cost: 350000,
            category: 'transport',
            completed: false,
          },
          {
            id: 'act-1-2',
            time: '12:30',
            title: 'Ăn trưa bún vịt làng & nhận xe máy tại TP Hà Giang',
            location: 'Trung tâm TP Hà Giang',
            cost: 250000,
            category: 'food',
            completed: false,
          },
          {
            id: 'act-1-3',
            time: '15:30',
            title: 'Check-in Cổng Trời Quản Bạ & Núi Đôi Cô Tiên',
            location: 'Huyện Quản Bạ',
            cost: 0,
            category: 'sightseeing',
            completed: false,
          },
          {
            id: 'act-1-4',
            time: '18:30',
            title: 'Nghỉ đêm tại Homestay Yên Minh & ăn tối lẩu gà đen',
            location: 'Thị trấn Yên Minh',
            cost: 650000,
            category: 'hotel',
            completed: false,
          },
        ],
      },
      {
        day: 2,
        date: '2026-11-16',
        title: 'Yên Minh - Dốc Thẩm Mã - Dinh Vua Mèo - Cột Cờ Lũng Cú',
        activities: [
          {
            id: 'act-2-1',
            time: '08:00',
            title: 'Chinh phục Dốc Thẩm Mã & thung lũng Sủng Là',
            location: 'Đồng Văn',
            category: 'sightseeing',
            completed: false,
          },
          {
            id: 'act-2-2',
            time: '11:00',
            title: 'Thăm Dinh Thự Họ Vương (Vua Mèo)',
            location: 'Xã Sà Phìn',
            cost: 40000,
            category: 'sightseeing',
            completed: false,
          },
          {
            id: 'act-2-3',
            time: '15:00',
            title: 'Check-in Cột cờ Lũng Cú cực Bắc Tổ quốc',
            location: 'Đỉnh Lũng Cú',
            cost: 50000,
            category: 'sightseeing',
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: 'trip-2',
    title: 'Nghỉ Dưỡng Biển Đà Nẵng - Hội An 4N3Đ',
    destination: 'Đà Nẵng & Hội An',
    startDate: '2026-12-24',
    endDate: '2026-12-27',
    status: 'planning',
    coverImage: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
    budget: 14000000,
    spent: 6800000,
    notes: 'Đã book vé máy bay Vietjet & Resort 4 sao bãi biển Mỹ Khê. Nhớ book bàn ăn tối Noel sớm tại phố cổ Hội An.',
    members: ['Gia đình'],
    tags: ['Nghỉ dưỡng', 'Biển', 'Ẩm thực'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itinerary: [
      {
        day: 1,
        date: '2026-12-24',
        title: 'Check-in Đà Nẵng - Tắm biển Mỹ Khê - Đêm Noel',
        activities: [
          {
            id: 'act-dn-1',
            time: '09:15',
            title: 'Chuyến bay VJ-128 Hà Nội - Đà Nẵng',
            location: 'Sân bay Đà Nẵng',
            cost: 3200000,
            category: 'transport',
            completed: false,
          },
          {
            id: 'act-dn-2',
            time: '11:30',
            title: 'Ăn trưa bánh tráng cuốn thịt heo Đại Lộc',
            location: 'Đường 2/9, Đà Nẵng',
            cost: 420000,
            category: 'food',
            completed: false,
          },
          {
            id: 'act-dn-3',
            time: '14:00',
            title: 'Nhận phòng Resort & thư giãn hồ bơi',
            location: 'Bãi biển Mỹ Khê',
            cost: 3600000,
            category: 'hotel',
            completed: false,
          },
        ],
      },
    ],
  },
  {
    id: 'trip-3',
    title: 'Chữa Lành & Săn Mây Tà Xùa - Mộc Châu',
    destination: 'Sơn La, Việt Nam',
    startDate: '2026-10-10',
    endDate: '2026-10-12',
    status: 'completed',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    budget: 5200000,
    spent: 4950000,
    notes: 'Chuyến đi săn mây đại thành công. Homestay Lu Trế view biển mây đỉnh cao!',
    members: ['Nhóm bạn đại học'],
    tags: ['Săn mây', 'Chữa lành', 'Camping'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    itinerary: [],
  },
];

export const useTravelStore = create<TravelStore>((set, get) => ({
  trips: (() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sotaybeo_travel_trips');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return SAMPLE_TRIPS;
  })(),
  selectedTripId: null,
  searchQuery: '',
  statusFilter: 'all',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSelectedTripId: (id) => set({ selectedTripId: id }),

  addTrip: (tripData) => {
    const newTrip: Trip = {
      ...tripData,
      id: `trip-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTrip, ...get().trips];
    set({ trips: updated, selectedTripId: newTrip.id });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
    return newTrip;
  },

  updateTrip: (id, tripUpdate) => {
    const updated = get().trips.map((t) =>
      t.id === id ? { ...t, ...tripUpdate, updatedAt: new Date().toISOString() } : t
    );
    set({ trips: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  },

  deleteTrip: (id) => {
    const updated = get().trips.filter((t) => t.id !== id);
    set({ trips: updated, selectedTripId: get().selectedTripId === id ? null : get().selectedTripId });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  },

  addActivity: (tripId, dayNumber, activityData) => {
    const newActivity: TripActivity = {
      ...activityData,
      id: `act-${Date.now()}`,
      completed: false,
    };

    const updated = get().trips.map((trip) => {
      if (trip.id !== tripId) return trip;

      // Find or create day
      let dayFound = false;
      const updatedItinerary = trip.itinerary.map((day) => {
        if (day.day === dayNumber) {
          dayFound = true;
          return {
            ...day,
            activities: [...day.activities, newActivity],
          };
        }
        return day;
      });

      if (!dayFound) {
        updatedItinerary.push({
          day: dayNumber,
          date: trip.startDate,
          activities: [newActivity],
        });
        updatedItinerary.sort((a, b) => a.day - b.day);
      }

      // Add to spent if cost exists
      const additionalCost = activityData.cost || 0;

      return {
        ...trip,
        itinerary: updatedItinerary,
        spent: trip.spent + additionalCost,
        updatedAt: new Date().toISOString(),
      };
    });

    set({ trips: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  },

  toggleActivityComplete: (tripId, dayNumber, activityId) => {
    const updated = get().trips.map((trip) => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        itinerary: trip.itinerary.map((day) => {
          if (day.day !== dayNumber) return day;
          return {
            ...day,
            activities: day.activities.map((act) =>
              act.id === activityId ? { ...act, completed: !act.completed } : act
            ),
          };
        }),
      };
    });

    set({ trips: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  },

  deleteActivity: (tripId, dayNumber, activityId) => {
    const updated = get().trips.map((trip) => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        itinerary: trip.itinerary.map((day) => {
          if (day.day !== dayNumber) return day;
          return {
            ...day,
            activities: day.activities.filter((act) => act.id !== activityId),
          };
        }),
      };
    });

    set({ trips: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sotaybeo_travel_trips', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
    }
  },
}));
