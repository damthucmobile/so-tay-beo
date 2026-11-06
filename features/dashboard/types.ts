export interface UnifiedTimelineEvent {
  id: string;
  title: string;
  subtitle?: string;
  timeStart: string; // 'HH:mm'
  timeEnd?: string; // 'HH:mm'
  type: 'school' | 'class' | 'appointment';
  status: 'upcoming' | 'ongoing' | 'completed';
  location?: string;
  rawDate: string; // 'YYYY-MM-DD'
}

export interface ExecutiveStats {
  todayEventsCount: number;
  totalClassesCount: number;
  totalStudentsCount: number;
  estimatedRemuneration: number;
  monthlyExpense: number;
  monthlyIncome: number;
}
