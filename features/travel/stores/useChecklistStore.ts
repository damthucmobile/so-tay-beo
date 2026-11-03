// features/travel/stores/useChecklistStore.ts
'use client';

import { create } from 'zustand';
import {
  ChecklistItem,
  ChecklistCategory,
  TravelDocument,
  TravelDocType,
} from '../types';
import {
  setDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
} from '@/core/firebase/db/firestoreService';
import { COLLECTIONS } from '@/core/firebase/db/constants';
import { auth } from '@/core/firebase/auth/config';

interface ChecklistStore {
  items: ChecklistItem[];
  documents: TravelDocument[];
  isLoading: boolean;
  selectedTripId: string;
  categoryFilter: ChecklistCategory | 'all';
  activeTab: 'checklist' | 'vault';

  setSelectedTripId: (tripId: string) => void;
  setCategoryFilter: (category: ChecklistCategory | 'all') => void;
  setActiveTab: (tab: 'checklist' | 'vault') => void;

  fetchData: (userId?: string) => Promise<void>;
  addItem: (
    data: Omit<ChecklistItem, 'id' | 'createdAt'>,
    userId?: string
  ) => Promise<ChecklistItem>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  applyPresetTemplate: (
    templateType: 'beach' | 'mountain' | 'international' | 'business',
    tripId?: string,
    userId?: string
  ) => Promise<void>;

  addDocument: (
    data: Omit<TravelDocument, 'id' | 'createdAt'>,
    userId?: string
  ) => Promise<TravelDocument>;
  deleteDocumentItem: (id: string) => Promise<void>;
}

const LOCAL_STORAGE_ITEMS_KEY = 'app_cached_travel_checklist_items';
const LOCAL_STORAGE_DOCS_KEY = 'app_cached_travel_documents';

const INITIAL_DEMO_ITEMS: ChecklistItem[] = [
  {
    id: 'item-1',
    tripId: 'demo-sapa',
    text: 'Căn cước công dân (CCCD) & Giấy phép lái xe',
    category: 'documents',
    completed: true,
    quantity: 1,
    createdAt: '2026-10-30T08:00:00Z',
  },
  {
    id: 'item-2',
    tripId: 'demo-sapa',
    text: 'Áo khoác gió giữ nhiệt & khăn quàng ấm leo Fansipan',
    category: 'clothes',
    completed: true,
    quantity: 2,
    createdAt: '2026-10-30T08:05:00Z',
  },
  {
    id: 'item-3',
    tripId: 'demo-sapa',
    text: 'Giày thể thao êm chân chống trơn trượt',
    category: 'clothes',
    completed: true,
    quantity: 1,
    createdAt: '2026-10-30T08:10:00Z',
  },
  {
    id: 'item-4',
    tripId: 'demo-sapa',
    text: 'Sạc điện thoại & Pin sạc dự phòng 20.000mAh',
    category: 'electronics',
    completed: false,
    quantity: 1,
    createdAt: '2026-10-30T08:15:00Z',
  },
  {
    id: 'item-5',
    tripId: 'demo-sapa',
    text: 'Thuốc say xe, cảm sốt Panadol & Băng dán Urgo',
    category: 'medicine',
    completed: false,
    quantity: 1,
    createdAt: '2026-10-30T08:20:00Z',
  },
  {
    id: 'item-6',
    tripId: 'demo-danang',
    text: 'Vé máy bay điện tử Vietnam Airlines VN123',
    category: 'documents',
    completed: true,
    quantity: 1,
    createdAt: '2026-11-01T09:00:00Z',
  },
  {
    id: 'item-7',
    tripId: 'demo-danang',
    text: 'Kem chống nắng SPF50+ & Kính râm phân cực',
    category: 'toiletries',
    completed: false,
    quantity: 1,
    createdAt: '2026-11-01T09:10:00Z',
  },
  {
    id: 'item-8',
    tripId: 'demo-danang',
    text: 'Đồ bơi & Khăn tắm biển đi bãi Mỹ Khê',
    category: 'clothes',
    completed: false,
    quantity: 2,
    createdAt: '2026-11-01T09:15:00Z',
  },
];

const INITIAL_DEMO_DOCS: TravelDocument[] = [
  {
    id: 'doc-1',
    tripId: 'demo-danang',
    tripTitle: 'Hè Rực Rỡ Đà Nẵng - Hội An',
    title: 'Vé máy bay Vietnam Airlines HAN ⇄ DAD',
    docType: 'flight',
    bookingCode: 'VN-DAD-8899X',
    notes: 'Chuyến bay VN167 lúc 07:15, Cổng 4 sân bay Nội Bài',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'doc-2',
    tripId: 'demo-sapa',
    tripTitle: 'Khám Phá Sapa 3N2Đ',
    title: 'Xác nhận đặt phòng Silk Path Grand Sapa Resort',
    docType: 'hotel',
    bookingCode: 'AGODA-SP-77124',
    notes: 'Check-in 14:00, bao gồm buffet sáng miễn phí cho 2 người',
    createdAt: '2026-10-31T11:00:00Z',
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

function getInitialItems(): ChecklistItem[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return INITIAL_DEMO_ITEMS;
}

function getInitialDocs(): TravelDocument[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_DOCS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return INITIAL_DEMO_DOCS;
}

function persistItems(items: ChecklistItem[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(items));
    } catch {}
  }
}

function persistDocs(docs: TravelDocument[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_DOCS_KEY, JSON.stringify(docs));
    } catch {}
  }
}

export const useChecklistStore = create<ChecklistStore>((set, get) => ({
  items: getInitialItems(),
  documents: getInitialDocs(),
  isLoading: false,
  selectedTripId: 'all',
  categoryFilter: 'all',
  activeTab: 'checklist',

  setSelectedTripId: (tripId) => set({ selectedTripId: tripId }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchData: async (userId?: string) => {
    const effectiveUid = getEffectiveUserId(userId);
    if (!effectiveUid) return;

    set({ isLoading: true });
    try {
      const [remoteItems, remoteDocs] = await Promise.all([
        getDocuments<ChecklistItem & { userId?: string }>(COLLECTIONS.TRAVEL_CHECKLISTS, {
          filters: [{ field: 'userId', operator: '==', value: effectiveUid }],
        }),
        getDocuments<TravelDocument & { userId?: string }>(COLLECTIONS.TRAVEL_DOCUMENTS, {
          filters: [{ field: 'userId', operator: '==', value: effectiveUid }],
        }),
      ]);

      if (remoteItems && remoteItems.length > 0) {
        set({ items: remoteItems });
        persistItems(remoteItems);
      }
      if (remoteDocs && remoteDocs.length > 0) {
        set({ documents: remoteDocs });
        persistDocs(remoteDocs);
      }
      set({ isLoading: false });
    } catch (err: any) {
      console.info('Sử dụng dữ liệu hành lý từ bộ nhớ máy:', err?.message || err);
      set({ isLoading: false });
    }
  },

  addItem: async (data, userId) => {
    const effectiveUid = getEffectiveUserId(userId);
    const newId = `chk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newItem: ChecklistItem = {
      ...data,
      id: newId,
      userId: effectiveUid || undefined,
      createdAt: now,
    };

    const updated = [newItem, ...get().items];
    set({ items: updated });
    persistItems(updated);

    if (effectiveUid) {
      try {
        await setDocument(COLLECTIONS.TRAVEL_CHECKLISTS, newId, newItem);
      } catch (err) {
        console.info('Mục hành lý đã được lưu trên máy:', err);
      }
    }

    return newItem;
  },

  toggleItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const newCompleted = !item.completed;
    const updated = get().items.map((i) =>
      i.id === id ? { ...i, completed: newCompleted } : i
    );

    set({ items: updated });
    persistItems(updated);

    try {
      await updateDocument(COLLECTIONS.TRAVEL_CHECKLISTS, id, { completed: newCompleted });
    } catch (err) {
      console.info('Đã cập nhật trạng thái mục hành lý trên máy:', err);
    }
  },

  deleteItem: async (id) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    persistItems(updated);

    try {
      await deleteDocument(COLLECTIONS.TRAVEL_CHECKLISTS, id);
    } catch (err) {
      console.info('Đã xóa mục hành lý trên máy:', err);
    }
  },

  applyPresetTemplate: async (templateType, tripId, userId) => {
    const presets: Record<
      'beach' | 'mountain' | 'international' | 'business',
      Array<{ text: string; category: ChecklistCategory }>
    > = {
      beach: [
        { text: 'Đồ bơi & Khăn tắm biển lớn', category: 'clothes' },
        { text: 'Kem chống nắng SPF 50+ & Kính râm', category: 'toiletries' },
        { text: 'Túi chống nước điện thoại', category: 'electronics' },
        { text: 'Dép xỏ ngón / Sandal đi biển', category: 'clothes' },
        { text: 'Nón rộng vành che nắng', category: 'clothes' },
      ],
      mountain: [
        { text: 'Áo khoác gió chống nước / Áo ấm', category: 'clothes' },
        { text: 'Giày trekking chuyên dụng chống trơn', category: 'clothes' },
        { text: 'Gậy leo núi & Găng tay bảo hộ', category: 'other' },
        { text: 'Đèn pin đội đầu & Bật lửa sinh tồn', category: 'electronics' },
        { text: 'Thuốc chống côn trùng & Băng dán cơ', category: 'medicine' },
      ],
      international: [
        { text: 'Hộ chiếu (còn hạn trên 6 tháng) & Visa', category: 'documents' },
        { text: 'Bảo hiểm du lịch quốc tế', category: 'documents' },
        { text: 'Đầu chuyển đổi chân cắm điện đa năng (Adapter)', category: 'electronics' },
        { text: 'Sim 4G du lịch hoặc kích hoạt eSim', category: 'electronics' },
        { text: 'Thẻ tín dụng Visa/Mastercard & Tiền ngoại tệ mặt', category: 'documents' },
      ],
      business: [
        { text: 'Laptop & Dây sạc công suất cao', category: 'electronics' },
        { text: 'Áo sơ mi là phẳng & Trang phục công sở', category: 'clothes' },
        { text: 'Tài liệu hợp đồng & Danh thiếp đối tác', category: 'documents' },
        { text: 'Bút ký & Sổ tay ghi chép', category: 'other' },
      ],
    };

    const targetList = presets[templateType] || [];
    for (const p of targetList) {
      await get().addItem(
        {
          tripId: tripId || 'general',
          text: p.text,
          category: p.category,
          completed: false,
          quantity: 1,
        },
        userId
      );
    }
  },

  addDocument: async (data, userId) => {
    const effectiveUid = getEffectiveUserId(userId);
    const newId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newDoc: TravelDocument = {
      ...data,
      id: newId,
      userId: effectiveUid || undefined,
      createdAt: now,
    };

    const updated = [newDoc, ...get().documents];
    set({ documents: updated });
    persistDocs(updated);

    if (effectiveUid) {
      try {
        await setDocument(COLLECTIONS.TRAVEL_DOCUMENTS, newId, newDoc);
      } catch (err) {
        console.info('Giấy tờ đã được lưu trên máy:', err);
      }
    }

    return newDoc;
  },

  deleteDocumentItem: async (id) => {
    const updated = get().documents.filter((d) => d.id !== id);
    set({ documents: updated });
    persistDocs(updated);

    try {
      await deleteDocument(COLLECTIONS.TRAVEL_DOCUMENTS, id);
    } catch (err) {
      console.info('Đã xóa giấy tờ trên máy:', err);
    }
  },
}));
