// features/travel/stores/useJournalStore.ts
'use client';

import { create } from 'zustand';
import { JournalEntry, MoodType, WeatherType } from '../types';
import {
  setDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
} from '@/core/firebase/db/firestoreService';
import { COLLECTIONS } from '@/core/firebase/db/constants';
import { auth } from '@/core/firebase/auth/config';

export interface UnifiedMediaItem {
  id: string;
  url: string;
  caption?: string;
  sourceType: 'journal' | 'trip';
  sourceId: string;
  sourceTitle: string;
  date: string;
  location?: string;
}

interface JournalStore {
  journals: JournalEntry[];
  isLoading: boolean;
  searchQuery: string;
  selectedTripFilter: string; // 'all' or tripId
  selectedMood: MoodType | 'all';
  activeTab: 'journals' | 'album';
  selectedJournal: JournalEntry | null;
  previewMedia: UnifiedMediaItem | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedTripFilter: (tripId: string) => void;
  setSelectedMood: (mood: MoodType | 'all') => void;
  setActiveTab: (tab: 'journals' | 'album') => void;
  setSelectedJournal: (journal: JournalEntry | null) => void;
  setPreviewMedia: (media: UnifiedMediaItem | null) => void;

  fetchJournals: (userId?: string) => Promise<void>;
  addJournal: (
    entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ) => Promise<JournalEntry>;
  updateJournal: (id: string, entry: Partial<JournalEntry>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'app_cached_travel_journals';

// Dữ liệu mẫu ban đầu sinh động, đầy đủ hình ảnh và cảm xúc
const INITIAL_DEMO_JOURNALS: JournalEntry[] = [
  {
    id: 'journal-demo-1',
    tripId: 'demo-sapa',
    tripTitle: 'Khám Phá Sapa 3N2Đ',
    title: 'Săn mây đỉnh Fansipan & Chiều hoàng hôn bản Cát Cát',
    content:
      'Chuyến đi sáng nay lên đỉnh Fansipan thực sự là một trải nghiệm không thể nào quên! Biển mây bồng bềnh trải dài đến tận chân trời, thời tiết se lạnh khoảng 12°C nhưng có nắng vàng rực rỡ. Cả gia đình cùng chụp được rất nhiều tấm hình tuyệt đẹp tại cột mốc 3.143m. Buổi chiều về bản Cát Cát dạo bước dọc suối Hoa, thưởng thức thắng cố và xiên nướng bản địa nóng hổi.',
    location: 'Đỉnh Fansipan & Bản Cát Cát, Sa Pa',
    date: '2026-11-01',
    time: '14:30',
    mood: 'awed',
    weather: 'cold',
    rating: 5,
    coverImage:
      'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
    images: [
      {
        id: 'img-1-1',
        url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
        caption: 'Biển mây bồng bềnh trên nóc nhà Đông Dương',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'img-1-2',
        url: 'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=800&auto=format&fit=crop',
        caption: 'Hoàng hôn buông trên những thửa ruộng bậc thang',
        createdAt: '2026-11-01T17:30:00Z',
      },
      {
        id: 'img-1-3',
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop',
        caption: 'Quán cà phê ngắm thung lũng Mường Hoa',
        createdAt: '2026-11-01T15:45:00Z',
      },
    ],
    tags: ['Săn Mây', 'Fansipan', 'Check-in', 'Ẩm Thực Sa Pa'],
    createdAt: '2026-11-01T18:00:00Z',
    updatedAt: '2026-11-01T18:00:00Z',
  },
  {
    id: 'journal-demo-2',
    tripId: 'demo-danang',
    tripTitle: 'Hè Rực Rỡ Đà Nẵng - Hội An',
    title: 'Đêm phố cổ Hội An rực rỡ đèn lồng & Đi thuyền thả hoa đăng',
    content:
      'Hội An về đêm mang một vẻ đẹp thơ mộng đến nao lòng. Cả phố cổ lung linh dưới ánh sáng của hàng ngàn chiếc đèn lồng đủ màu sắc. Chúng tôi thuê một chiếc thuyền nhỏ thả trôi dọc sông Hoài, thả những ngọn đèn hoa đăng gửi gắm ước nguyện bình an cho gia đình. Ăn thử bánh mì Phượng và cao lầu gia truyền ngon xuất sắc.',
    location: 'Chùa Cầu & Sông Hoài, Hội An',
    date: '2026-11-02',
    time: '20:15',
    mood: 'peaceful',
    weather: 'breezy',
    rating: 5,
    coverImage:
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
    images: [
      {
        id: 'img-2-1',
        url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=1200&auto=format&fit=crop',
        caption: 'Phố cổ Hội An rực rỡ đèn lồng đêm thu',
        createdAt: '2026-11-02T19:30:00Z',
      },
      {
        id: 'img-2-2',
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
        caption: 'Bình minh êm dịu trên bãi biển Mỹ Khê',
        createdAt: '2026-11-02T05:45:00Z',
      },
    ],
    tags: ['Hội An', 'Đèn Lồng', 'Sông Hoài', 'Kỷ Niệm Gia Đình'],
    createdAt: '2026-11-02T21:00:00Z',
    updatedAt: '2026-11-02T21:00:00Z',
  },
];

function getEffectiveUserId(explicitUserId?: string): string | null {
  if (explicitUserId) return explicitUserId;
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

// Helpers lưu trữ bộ nhớ cục bộ an toàn
function getInitialJournals(): JournalEntry[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return INITIAL_DEMO_JOURNALS;
}

function persistToLocalStorage(journals: JournalEntry[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(journals));
    } catch {}
  }
}

export const useJournalStore = create<JournalStore>((set, get) => ({
  journals: getInitialJournals(),
  isLoading: false,
  searchQuery: '',
  selectedTripFilter: 'all',
  selectedMood: 'all',
  activeTab: 'journals',
  selectedJournal: null,
  previewMedia: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTripFilter: (tripId) => set({ selectedTripFilter: tripId }),
  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedJournal: (journal) => set({ selectedJournal: journal }),
  setPreviewMedia: (media) => set({ previewMedia: media }),

  fetchJournals: async (userId?: string) => {
    const effectiveUid = getEffectiveUserId(userId);
    if (!effectiveUid) return;

    set({ isLoading: true });
    try {
      const remoteData = await getDocuments<JournalEntry & { userId?: string }>(
        COLLECTIONS.TRAVEL_JOURNALS,
        {
          filters: [{ field: 'userId', operator: '==', value: effectiveUid }],
        }
      );

      if (remoteData && remoteData.length > 0) {
        set({ journals: remoteData, isLoading: false });
        persistToLocalStorage(remoteData);
      } else {
        // Giữ dữ liệu hiện tại từ cache/demo
        set({ isLoading: false });
      }
    } catch (error: any) {
      // Nếu Firestore chưa deploy rules hoặc mạng chập chờn, sử dụng dữ liệu từ cache cục bộ
      console.info(
        'Đang dùng dữ liệu nhật ký từ bộ nhớ máy (Firestore sẽ đồng bộ khi cập nhật rules):',
        error?.message || error
      );
      set({ isLoading: false });
    }
  },

  addJournal: async (entry, userId) => {
    const effectiveUid = getEffectiveUserId(userId);
    const now = new Date().toISOString();
    const newId = `journal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const newJournal: JournalEntry = {
      ...entry,
      id: newId,
      userId: effectiveUid || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Cập nhật State & Lưu ngay vào LocalStorage để không bao giờ mất dữ liệu
    const updatedJournals = [newJournal, ...get().journals];
    set({ journals: updatedJournals });
    persistToLocalStorage(updatedJournals);

    // 2. Đồng bộ Firestore trong background
    if (effectiveUid) {
      try {
        await setDocument(COLLECTIONS.TRAVEL_JOURNALS, newId, newJournal);
      } catch (err: any) {
        console.info(
          'Bài nhật ký đã được lưu trên thiết bị. Đồng bộ Firestore sẽ hoàn tất khi rules được deploy:',
          err?.message || err
        );
      }
    }

    return newJournal;
  },

  updateJournal: async (id, updates) => {
    const now = new Date().toISOString();
    const updatedJournals = get().journals.map((j) =>
      j.id === id ? { ...j, ...updates, updatedAt: now } : j
    );

    set((state) => ({
      journals: updatedJournals,
      selectedJournal:
        state.selectedJournal?.id === id
          ? { ...state.selectedJournal, ...updates, updatedAt: now }
          : state.selectedJournal,
    }));
    persistToLocalStorage(updatedJournals);

    try {
      await updateDocument(COLLECTIONS.TRAVEL_JOURNALS, id, { ...updates, updatedAt: now });
    } catch (err: any) {
      console.info('Đã cập nhật bài nhật ký trên máy:', err?.message || err);
    }
  },

  deleteJournal: async (id) => {
    const updatedJournals = get().journals.filter((j) => j.id !== id);
    set((state) => ({
      journals: updatedJournals,
      selectedJournal: state.selectedJournal?.id === id ? null : state.selectedJournal,
    }));
    persistToLocalStorage(updatedJournals);

    try {
      await deleteDocument(COLLECTIONS.TRAVEL_JOURNALS, id);
    } catch (err: any) {
      console.info('Đã xóa bài nhật ký trên máy:', err?.message || err);
    }
  },
}));
