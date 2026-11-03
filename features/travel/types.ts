// features/travel/types.ts

export type TripStatus = 'planning' | 'ongoing' | 'completed';

export type ActivityCategory = 'transport' | 'hotel' | 'food' | 'sightseeing' | 'relax' | 'other';

export interface TripActivity {
  id: string;
  time: string; // e.g. "08:30"
  title: string;
  location?: string;
  cost?: number;
  notes?: string;
  category: ActivityCategory;
  completed?: boolean;
}

export interface DayItinerary {
  day: number;
  date: string; // YYYY-MM-DD
  title?: string;
  activities: TripActivity[];
}

export interface ShareConfig {
  isPublicLinkEnabled: boolean;
  shareToken: string;
  hideBudget?: boolean;
  hideAlbum?: boolean;
  hideChecklist?: boolean;
  allowComments?: boolean;
}

export interface SharedMember {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'viewer' | 'editor';
  addedAt: string;
}

export interface TripMedia {
  id: string;
  url: string;
  caption?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface TripChecklistItem {
  id: string;
  text: string;
  category: 'clothes' | 'documents' | 'electronics' | 'medicine' | 'other';
  completed: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: TripStatus;
  coverImage?: string;
  budget: number;
  spent: number;
  notes?: string;
  members?: string[];
  tags?: string[];
  itinerary: DayItinerary[];
  shareConfig?: ShareConfig;
  sharedMembers?: SharedMember[];
  media?: TripMedia[];
  checklist?: TripChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TravelStats {
  totalTrips: number;
  upcomingTrips: number;
  completedTrips: number;
  totalBudget: number;
  totalSpent: number;
}

export type MoodType = 'excited' | 'peaceful' | 'happy' | 'relax' | 'adventure' | 'awed';
export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'breezy';

export interface JournalImage {
  id: string;
  url: string;
  caption?: string;
  createdAt?: string;
}

export interface JournalEntry {
  id: string;
  tripId?: string;
  tripTitle?: string;
  title: string;
  content: string;
  location?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  mood?: MoodType;
  weather?: WeatherType;
  rating?: number; // 1 - 5
  coverImage?: string;
  images: JournalImage[];
  tags?: string[];
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// NGÂN SÁCH & CHI TIÊU DU LỊCH (BUDGET & EXPENSES)
// ==============================================================================
export type ExpenseCategory =
  | 'transport'
  | 'hotel'
  | 'food'
  | 'sightseeing'
  | 'shopping'
  | 'other';

export interface TravelExpense {
  id: string;
  tripId: string;
  tripTitle?: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string; // e.g. "Tôi", "Nam", "Linh"
  date: string; // YYYY-MM-DD
  notes?: string;
  receiptUrl?: string;
  splitWith?: string[]; // Danh sách thành viên cùng chia sẻ khoản này
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SplitSettlement {
  from: string;
  to: string;
  amount: number;
}

// ==============================================================================
// HÀNH LÝ & CHECKLIST CHUẨN BỊ (LUGGAGE & CHECKLIST & DOCUMENTS)
// ==============================================================================
export type ChecklistCategory =
  | 'documents'
  | 'clothes'
  | 'electronics'
  | 'medicine'
  | 'toiletries'
  | 'other';

export interface ChecklistItem {
  id: string;
  tripId?: string;
  text: string;
  category: ChecklistCategory;
  completed: boolean;
  quantity?: number;
  notes?: string;
  userId?: string;
  createdAt: string;
}

export type TravelDocType = 'flight' | 'hotel' | 'passport' | 'ticket' | 'other';

export interface TravelDocument {
  id: string;
  tripId?: string;
  tripTitle?: string;
  title: string;
  docType: TravelDocType;
  bookingCode?: string;
  fileUrl?: string;
  notes?: string;
  expiryDate?: string;
  userId?: string;
  createdAt: string;
}


