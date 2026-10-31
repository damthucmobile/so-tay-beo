// features/travel/stores/useTravelStore.ts
'use client';

import { create } from 'zustand';
import {
  Trip,
  TripActivity,
  TripStatus,
  ShareConfig,
  SharedMember,
  TripMedia,
  TripChecklistItem,
} from '../types';
import {
  setDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
} from '@/core/firebase/db/firestoreService';
import { COLLECTIONS } from '@/core/firebase/db/constants';

interface TravelStore {
  trips: Trip[];
  isLoading: boolean;
  selectedTripId: string | null;
  searchQuery: string;
  statusFilter: TripStatus | 'all';
  userId: string | null;

  // Actions
  fetchTrips: (userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: TripStatus | 'all') => void;
  setSelectedTripId: (id: string | null) => void;

  addTrip: (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) => Promise<Trip>;
  updateTrip: (id: string, trip: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;

  addActivity: (tripId: string, dayNumber: number, activity: Omit<TripActivity, 'id'>) => Promise<void>;
  toggleActivityComplete: (tripId: string, dayNumber: number, activityId: string) => Promise<void>;
  deleteActivity: (tripId: string, dayNumber: number, activityId: string) => Promise<void>;

  // Sharing Actions
  updateShareConfig: (tripId: string, config: Partial<ShareConfig>) => Promise<void>;
  inviteMember: (tripId: string, email: string, role: 'viewer' | 'editor', name?: string) => Promise<void>;
  removeMember: (tripId: string, memberId: string) => Promise<void>;

  // Media Actions
  addMedia: (tripId: string, media: Omit<TripMedia, 'id' | 'createdAt'>) => Promise<void>;
  deleteMedia: (tripId: string, mediaId: string) => Promise<void>;

  // Checklist Actions
  addChecklistItem: (tripId: string, item: Omit<TripChecklistItem, 'id'>) => Promise<void>;
  toggleChecklistItem: (tripId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (tripId: string, itemId: string) => Promise<void>;
}

import { auth } from '@/core/firebase/auth/config';

// Hàm hỗ trợ lấy ID người dùng hiện tại an toàn nhất
function getEffectiveUserId(explicitUserId?: string, storeUserId?: string | null): string | null {
  if (explicitUserId) return explicitUserId;
  if (storeUserId) return storeUserId;
  if (auth?.currentUser?.uid) return auth.currentUser.uid;
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('app_auth_cached_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.uid) return parsed.uid;
      }
    } catch {}
  }
  return null;
}

export const useTravelStore = create<TravelStore>((set, get) => ({
  trips: [],
  isLoading: false,
  selectedTripId: null,
  searchQuery: '',
  statusFilter: 'all',
  userId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  setSelectedTripId: (id) => set({ selectedTripId: id }),

  // 1. Tải danh sách chuyến đi trực tiếp từ Firestore Database
  fetchTrips: async (userId?: string) => {
    const effectiveUid = getEffectiveUserId(userId, get().userId);
    if (!effectiveUid) return;
    set({ userId: effectiveUid, isLoading: true });

    try {
      // 1. Truy vấn các chuyến đi của người dùng
      const data = await getDocuments<Trip & { userId?: string }>(COLLECTIONS.TRAVEL_TRIPS, {
        filters: [{ field: 'userId', operator: '==', value: effectiveUid }],
      });

      // 2. Sắp xếp an toàn ở client theo ngày tạo giảm dần
      const sorted = (data || []).sort((a, b) => {
        const timeA = new Date(b.createdAt || 0).getTime();
        const timeB = new Date(a.createdAt || 0).getTime();
        return timeA - timeB;
      });

      set({ trips: sorted, isLoading: false });
    } catch (error) {
      console.error('Lỗi khi tải danh sách chuyến đi từ Firestore:', error);
      set({ trips: [], isLoading: false });
    }
  },

  // 2. Tạo chuyến đi mới trực tiếp trên Firestore Database
  addTrip: async (tripData, explicitUserId) => {
    const uid = getEffectiveUserId(explicitUserId, get().userId);
    const newId = `trip-${Date.now()}`;
    const now = new Date().toISOString();

    const newTrip: Trip = {
      ...tripData,
      id: newId,
      shareConfig: {
        isPublicLinkEnabled: true,
        shareToken: Math.random().toString(36).substring(2, 10),
        hideBudget: false,
        hideAlbum: false,
        hideChecklist: false,
      },
      sharedMembers: [],
      media: [],
      checklist: [],
      createdAt: now,
      updatedAt: now,
    };

    // Cập nhật UI trước (Optimistic UI)
    const currentTrips = get().trips;
    set({ trips: [newTrip, ...currentTrips], selectedTripId: newTrip.id, userId: uid || get().userId });

    // Ghi trực tiếp vào Firestore Database
    try {
      await setDocument(
        COLLECTIONS.TRAVEL_TRIPS,
        newId,
        {
          ...newTrip,
          userId: uid || 'anonymous',
        },
        true
      );
    } catch (error) {
      console.error('Lỗi khi tạo chuyến đi trên Firestore:', error);
    }

    return newTrip;
  },

  // 3. Cập nhật chuyến đi trực tiếp trên Firestore Database
  updateTrip: async (id, tripUpdate) => {
    const current = get().trips.find((t) => t.id === id);
    if (!current) return;

    const updatedTrip: Trip = {
      ...current,
      ...tripUpdate,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === id ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, id, updatedTrip);
    } catch (error) {
      console.error('Lỗi khi cập nhật chuyến đi trên Firestore:', error);
    }
  },

  // 4. Xóa chuyến đi trực tiếp khỏi Firestore Database
  deleteTrip: async (id) => {
    set({
      trips: get().trips.filter((t) => t.id !== id),
      selectedTripId: get().selectedTripId === id ? null : get().selectedTripId,
    });

    try {
      await deleteDocument(COLLECTIONS.TRAVEL_TRIPS, id);
    } catch (error) {
      console.error('Lỗi khi xóa chuyến đi trên Firestore:', error);
    }
  },

  // 5. Thêm hoạt động vào lịch trình ngày trên Firestore
  addActivity: async (tripId, dayNumber, activityData) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newActivity: TripActivity = {
      ...activityData,
      id: `act-${Date.now()}`,
      completed: false,
    };

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

    const additionalCost = activityData.cost || 0;
    const updatedTrip: Trip = {
      ...trip,
      itinerary: updatedItinerary,
      spent: trip.spent + additionalCost,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        itinerary: updatedTrip.itinerary,
        spent: updatedTrip.spent,
      });
    } catch (error) {
      console.error('Lỗi khi thêm hoạt động lên Firestore:', error);
    }
  },

  // 6. Đổi trạng thái hoàn thành hoạt động trên Firestore
  toggleActivityComplete: async (tripId, dayNumber, activityId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const updatedTrip: Trip = {
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
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        itinerary: updatedTrip.itinerary,
      });
    } catch (error) {
      console.error('Lỗi khi đổi trạng thái hoạt động trên Firestore:', error);
    }
  },

  // 7. Xóa hoạt động trên Firestore
  deleteActivity: async (tripId, dayNumber, activityId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const updatedTrip: Trip = {
      ...trip,
      itinerary: trip.itinerary.map((day) => {
        if (day.day !== dayNumber) return day;
        return {
          ...day,
          activities: day.activities.filter((act) => act.id !== activityId),
        };
      }),
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        itinerary: updatedTrip.itinerary,
      });
    } catch (error) {
      console.error('Lỗi khi xóa hoạt động trên Firestore:', error);
    }
  },

  // 8. Cập nhật cấu hình chia sẻ trên Firestore
  updateShareConfig: async (tripId, config) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const currentConfig = trip.shareConfig || {
      isPublicLinkEnabled: false,
      shareToken: Math.random().toString(36).substring(2, 10),
    };

    const newConfig = {
      ...currentConfig,
      ...config,
    };

    const updatedTrip: Trip = {
      ...trip,
      shareConfig: newConfig,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        shareConfig: newConfig,
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật cấu hình chia sẻ trên Firestore:', error);
    }
  },

  // 9. Mời thành viên gia đình trên Firestore
  inviteMember: async (tripId, email, role, name) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newMember: SharedMember = {
      id: `member-${Date.now()}`,
      email,
      role,
      name: name || email.split('@')[0],
      addedAt: new Date().toISOString(),
    };

    const currentMembers = trip.sharedMembers || [];
    const filtered = currentMembers.filter((m) => m.email.toLowerCase() !== email.toLowerCase());
    const newMembers = [...filtered, newMember];

    const updatedTrip: Trip = {
      ...trip,
      sharedMembers: newMembers,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        sharedMembers: newMembers,
      });
    } catch (error) {
      console.error('Lỗi khi thêm thành viên trên Firestore:', error);
    }
  },

  // 10. Hủy quyền thành viên trên Firestore
  removeMember: async (tripId, memberId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newMembers = (trip.sharedMembers || []).filter(
      (m) => m.id !== memberId && m.email !== memberId
    );

    const updatedTrip: Trip = {
      ...trip,
      sharedMembers: newMembers,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        sharedMembers: newMembers,
      });
    } catch (error) {
      console.error('Lỗi khi xóa thành viên trên Firestore:', error);
    }
  },

  // 11. Thêm ảnh kỷ niệm vào album trên Firestore
  addMedia: async (tripId, mediaData) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newMedia: TripMedia = {
      ...mediaData,
      id: `media-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const newMediaList = [newMedia, ...(trip.media || [])];
    const updatedTrip: Trip = {
      ...trip,
      media: newMediaList,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        media: newMediaList,
      });
    } catch (error) {
      console.error('Lỗi khi thêm ảnh vào album trên Firestore:', error);
    }
  },

  // 12. Xóa ảnh khỏi album trên Firestore
  deleteMedia: async (tripId, mediaId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newMediaList = (trip.media || []).filter((m) => m.id !== mediaId);
    const updatedTrip: Trip = {
      ...trip,
      media: newMediaList,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        media: newMediaList,
      });
    } catch (error) {
      console.error('Lỗi khi xóa ảnh khỏi album trên Firestore:', error);
    }
  },

  // 13. Thêm đồ dùng hành lý trên Firestore
  addChecklistItem: async (tripId, itemData) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newItem: TripChecklistItem = {
      ...itemData,
      id: `chk-${Date.now()}`,
    };

    const newChecklist = [...(trip.checklist || []), newItem];
    const updatedTrip: Trip = {
      ...trip,
      checklist: newChecklist,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        checklist: newChecklist,
      });
    } catch (error) {
      console.error('Lỗi khi thêm đồ dùng vào checklist trên Firestore:', error);
    }
  },

  // 14. Đổi trạng thái checklist trên Firestore
  toggleChecklistItem: async (tripId, itemId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newChecklist = (trip.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedTrip: Trip = {
      ...trip,
      checklist: newChecklist,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        checklist: newChecklist,
      });
    } catch (error) {
      console.error('Lỗi khi đổi trạng thái checklist trên Firestore:', error);
    }
  },

  // 15. Xóa đồ dùng checklist trên Firestore
  deleteChecklistItem: async (tripId, itemId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return;

    const newChecklist = (trip.checklist || []).filter((item) => item.id !== itemId);
    const updatedTrip: Trip = {
      ...trip,
      checklist: newChecklist,
      updatedAt: new Date().toISOString(),
    };

    set({
      trips: get().trips.map((t) => (t.id === tripId ? updatedTrip : t)),
    });

    try {
      await updateDocument(COLLECTIONS.TRAVEL_TRIPS, tripId, {
        checklist: newChecklist,
      });
    } catch (error) {
      console.error('Lỗi khi xóa đồ dùng khỏi checklist trên Firestore:', error);
    }
  },
}));
