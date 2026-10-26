import { create } from 'zustand';
import { SchoolTimetable, DayOfWeek, TeachingScheduleViewMode } from '../types';
import {
  subscribeToSchoolTimetables,
  saveSchoolTimetable,
  deleteSchoolTimetable,
} from '../services/teachingScheduleService';

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
  allTimetables: SchoolTimetable[];
  selectedTeacher: string;
  selectedClass: string;
  selectedDay: DayOfWeek;
  viewMode: TeachingScheduleViewMode;
  searchQuery: string;
  isImportModalOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: string | null;

  // Actions
  setTimetable: (timetable: SchoolTimetable, userId?: string) => Promise<void>;
  clearTimetable: (userId?: string) => Promise<void>;
  setSelectedTeacher: (teacher: string) => void;
  setSelectedClass: (className: string) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setViewMode: (mode: TeachingScheduleViewMode) => void;
  setSearchQuery: (query: string) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setSelectedTimetable: (timetableId: string) => void;
  initStore: (userId?: string) => () => void;
}

export const useTeachingScheduleStore = create<TeachingScheduleState>((set, get) => ({
  timetable: null,
  allTimetables: [],
  selectedTeacher: '',
  selectedClass: '',
  selectedDay: getTodayDayOfWeek(),
  viewMode: 'teacher',
  searchQuery: '',
  isImportModalOpen: false,
  isLoading: false,
  isSaving: false,
  syncStatus: 'idle',
  lastSyncedAt: null,

  initStore: (userId?: string) => {
    if (typeof window === 'undefined') return () => {};

    // 1. Khởi tạo tức thì từ LocalStorage (giúp render siêu tốc, không nháy màn hình)
    try {
      const savedTimetable = localStorage.getItem(STORAGE_KEY);
      const savedPrefs = localStorage.getItem(PREFS_KEY);

      if (savedTimetable) {
        const parsedTimetable: SchoolTimetable = JSON.parse(savedTimetable);
        if (parsedTimetable && parsedTimetable.classes && parsedTimetable.entries) {
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
        }
      }
    } catch (e) {
      console.error('Failed to init local teaching schedule cache:', e);
    }

    // 2. Nếu có userId -> Lắng nghe Realtime từ Cloud Firestore
    if (userId) {
      set({ syncStatus: 'syncing', isLoading: !get().timetable });

      const unsubscribe = subscribeToSchoolTimetables(
        userId,
        (timetables) => {
          if (timetables && timetables.length > 0) {
            const activeTimetable = timetables[0];

            // Cập nhật bộ nhớ đệm LocalStorage
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(activeTimetable));
            } catch {}

            const savedPrefs = localStorage.getItem(PREFS_KEY);
            let teacher = activeTimetable.teachers.includes(get().selectedTeacher)
              ? get().selectedTeacher
              : activeTimetable.teachers[0] || '';
            let className = activeTimetable.classes.includes(get().selectedClass)
              ? get().selectedClass
              : activeTimetable.classes[0] || '';
            let mode = get().viewMode;

            if (savedPrefs) {
              try {
                const prefs = JSON.parse(savedPrefs);
                if (prefs.selectedTeacher && activeTimetable.teachers.includes(prefs.selectedTeacher)) {
                  teacher = prefs.selectedTeacher;
                }
                if (prefs.selectedClass && activeTimetable.classes.includes(prefs.selectedClass)) {
                  className = prefs.selectedClass;
                }
                if (prefs.viewMode) {
                  mode = prefs.viewMode;
                }
              } catch {}
            }

            set({
              timetable: activeTimetable,
              allTimetables: timetables,
              selectedTeacher: teacher,
              selectedClass: className,
              viewMode: mode,
              isLoading: false,
              isSaving: false,
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
            });
          } else {
            // Trường hợp Firebase chưa có TKB nào: Kiểm tra xem LocalStorage có TKB cũ không để tự động đưa lên Firebase
            const currentLocal = get().timetable;
            if (currentLocal && currentLocal.entries && currentLocal.entries.length > 0) {
              console.log('Tự động đồng bộ thời khóa biểu từ bộ nhớ cục bộ lên Firebase Cloud...');
              saveSchoolTimetable(currentLocal, userId)
                .then(() => {
                  set({ isLoading: false, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
                })
                .catch((err) => {
                  console.error('Lỗi tự động sao lưu TKB lên Firebase:', err);
                  set({ isLoading: false, syncStatus: 'error' });
                });
            } else {
              set({
                timetable: null,
                allTimetables: [],
                isLoading: false,
                syncStatus: 'synced',
              });
            }
          }
        },
        (err) => {
          console.error('Lỗi đồng bộ thời khóa biểu từ Firebase:', err);
          set({ isLoading: false, syncStatus: 'error' });
        }
      );

      return () => {
        unsubscribe();
      };
    }

    set({ isLoading: false });
    return () => {};
  },

  setTimetable: async (timetable: SchoolTimetable, userId?: string) => {
    set({ isSaving: true, syncStatus: 'syncing' });

    // 1. Lưu ngay vào LocalStorage để phản hồi tức thì
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

    // 2. Lưu lên Cloud Firestore nếu người dùng đã đăng nhập
    if (userId) {
      try {
        await saveSchoolTimetable(timetable, userId);
        set({
          isSaving: false,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Lỗi khi lưu thời khóa biểu lên Firebase:', err);
        set({ isSaving: false, syncStatus: 'error' });
        throw err;
      }
    } else {
      set({ isSaving: false, syncStatus: 'synced' });
    }
  },

  clearTimetable: async (userId?: string) => {
    const current = get().timetable;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREFS_KEY);
    }

    set({
      timetable: null,
      selectedTeacher: '',
      selectedClass: '',
      syncStatus: 'idle',
    });

    // Xóa trên Firestore nếu có userId và timetableId
    if (userId && current?.id) {
      try {
        await deleteSchoolTimetable(current.id, userId);
      } catch (err) {
        console.error('Lỗi khi xóa thời khóa biểu trên Firebase:', err);
      }
    }
  },

  setSelectedTimetable: (timetableId: string) => {
    const target = get().allTimetables.find((t) => t.id === timetableId);
    if (target) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
        } catch {}
      }
      const teacher = target.teachers.includes(get().selectedTeacher)
        ? get().selectedTeacher
        : target.teachers[0] || '';
      const className = target.classes.includes(get().selectedClass)
        ? get().selectedClass
        : target.classes[0] || '';

      set({
        timetable: target,
        selectedTeacher: teacher,
        selectedClass: className,
      });
    }
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
