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
