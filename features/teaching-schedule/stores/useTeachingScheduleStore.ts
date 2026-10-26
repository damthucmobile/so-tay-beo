import { create } from 'zustand';
import { SchoolTimetable, DayOfWeek, TeachingScheduleViewMode } from '../types';

const STORAGE_KEY = 'so_tay_beo_teaching_schedule_v1';
const PREFS_KEY = 'so_tay_beo_teaching_prefs_v1';

// Xác định thứ hiện tại trong tuần (1 = Thứ 2 ... 5 = Thứ 6)
function getTodayDayOfWeek(): DayOfWeek {
  const day = new Date().getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
  switch (day) {
    case 1:
      return 'Hai';
    case 2:
      return 'Ba';
    case 3:
      return 'Tư';
    case 4:
      return 'Năm';
    case 5:
      return 'Sáu';
    default:
      return 'Hai'; // Cuối tuần mặc định hiển thị Thứ 2
  }
}

interface TeachingScheduleState {
  timetable: SchoolTimetable | null;
  selectedTeacher: string;
  selectedClass: string;
  selectedDay: DayOfWeek;
  viewMode: TeachingScheduleViewMode;
  searchQuery: string;
  isImportModalOpen: boolean;

  // Actions
  setTimetable: (timetable: SchoolTimetable) => void;
  clearTimetable: () => void;
  setSelectedTeacher: (teacher: string) => void;
  setSelectedClass: (className: string) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setViewMode: (mode: TeachingScheduleViewMode) => void;
  setSearchQuery: (query: string) => void;
  setIsImportModalOpen: (open: boolean) => void;
  initStore: () => void;
}

export const useTeachingScheduleStore = create<TeachingScheduleState>((set, get) => ({
  timetable: null,
  selectedTeacher: '',
  selectedClass: '',
  selectedDay: getTodayDayOfWeek(),
  viewMode: 'teacher',
  searchQuery: '',
  isImportModalOpen: false,

  initStore: () => {
    if (typeof window === 'undefined') return;

    try {
      const savedTimetable = localStorage.getItem(STORAGE_KEY);
      const savedPrefs = localStorage.getItem(PREFS_KEY);

      if (!savedTimetable) {
        set({
          timetable: null,
          selectedDay: getTodayDayOfWeek(),
        });
        return;
      }

      let parsedTimetable: SchoolTimetable | null = null;
      try {
        parsedTimetable = JSON.parse(savedTimetable);
      } catch (err) {
        console.error('Failed to parse saved timetable from localStorage:', err);
      }

      if (!parsedTimetable || !parsedTimetable.classes || !parsedTimetable.entries) {
        set({ timetable: null });
        return;
      }

      let teacher = parsedTimetable.teachers[0] || '';
      let className = parsedTimetable.classes[0] || '';
      let mode: TeachingScheduleViewMode = 'teacher';

      if (savedPrefs) {
        try {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.selectedTeacher && parsedTimetable.teachers.includes(prefs.selectedTeacher)) {
            teacher = prefs.selectedTeacher;
          }
          if (prefs.selectedClass && parsedTimetable.classes.includes(prefs.selectedClass)) {
            className = prefs.selectedClass;
          }
          if (prefs.viewMode) {
            mode = prefs.viewMode;
          }
        } catch (e) {
          console.error('Failed to parse saved prefs:', e);
        }
      }

      set({
        timetable: parsedTimetable,
        selectedTeacher: teacher,
        selectedClass: className,
        viewMode: mode,
        selectedDay: getTodayDayOfWeek(),
      });
    } catch (e) {
      console.error('Failed to init teaching schedule store:', e);
      set({ timetable: null });
    }
  },

  setTimetable: (timetable: SchoolTimetable) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
      } catch (e) {
        console.warn('Storage quota exceeded, storing in memory only', e);
      }
    }
    const teacher = timetable.teachers.includes(get().selectedTeacher)
      ? get().selectedTeacher
      : timetable.teachers[0] || '';
    const className = timetable.classes.includes(get().selectedClass)
      ? get().selectedClass
      : timetable.classes[0] || '';

    set({
      timetable,
      selectedTeacher: teacher,
      selectedClass: className,
      isImportModalOpen: false,
    });
  },

  clearTimetable: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREFS_KEY);
    }
    set({
      timetable: null,
      selectedTeacher: '',
      selectedClass: '',
    });
  },

  setSelectedTeacher: (teacher: string) => {
    set({ selectedTeacher: teacher });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: teacher,
          selectedClass: get().selectedClass,
          viewMode: get().viewMode,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setSelectedClass: (className: string) => {
    set({ selectedClass: className });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: get().selectedTeacher,
          selectedClass: className,
          viewMode: get().viewMode,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setSelectedDay: (day: DayOfWeek) => {
    set({ selectedDay: day });
  },

  setViewMode: (mode: TeachingScheduleViewMode) => {
    set({ viewMode: mode });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: get().selectedTeacher,
          selectedClass: get().selectedClass,
          viewMode: mode,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setIsImportModalOpen: (open: boolean) => set({ isImportModalOpen: open }),
}));
