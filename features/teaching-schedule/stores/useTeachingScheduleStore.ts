import { create } from 'zustand';
import { SchoolTimetable, DayOfWeek, TeachingScheduleViewMode, TimetableEntry, Session } from '../types';
import {
  subscribeToSchoolTimetables,
  saveSchoolTimetable,
  deleteSchoolTimetable,
} from '../services/teachingScheduleService';

const STORAGE_KEY = 'so_tay_beo_teaching_schedule_v1';
const PREFS_KEY = 'so_tay_beo_teaching_prefs_v2';
const OLD_PREFS_KEY = 'so_tay_beo_teaching_prefs_v1';

// Tự động tính toán lại các danh sách tổng hợp (giáo viên, lớp, môn, tổng số tiết) khi có chỉnh sửa
function recomputeTimetableMetadata(timetable: SchoolTimetable): SchoolTimetable {
  const teachers = Array.from(new Set(timetable.entries.map((e) => e.teacher).filter(Boolean))).sort();
  const classes = Array.from(new Set(timetable.entries.map((e) => e.className).filter(Boolean))).sort();
  const subjects = Array.from(new Set(timetable.entries.map((e) => e.subject).filter(Boolean))).sort();
  return {
    ...timetable,
    teachers,
    classes,
    subjects,
    totalEntries: timetable.entries.length,
    updatedAt: new Date().toISOString(),
  };
}

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
    case 6:
      return 'Bảy';
    default:
      return 'Hai'; // Chủ nhật mặc định hiển thị Thứ 2
  }
}

export type ScheduleDisplayMode = 'grid' | 'agenda';

interface TeachingScheduleState {
  timetable: SchoolTimetable | null;
  allTimetables: SchoolTimetable[];
  selectedTeacher: string;
  myTeacher: string;
  selectedClass: string;
  selectedDay: DayOfWeek;
  viewMode: TeachingScheduleViewMode;
  displayMode: ScheduleDisplayMode;
  isCompactView: boolean;
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
  setMyTeacher: (teacher: string) => void;
  setSelectedClass: (className: string) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setViewMode: (mode: TeachingScheduleViewMode) => void;
  setDisplayMode: (mode: ScheduleDisplayMode) => void;
  setIsCompactView: (compact: boolean) => void;
  toggleCompactView: () => void;
  setSearchQuery: (query: string) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setSelectedTimetable: (timetableId: string) => void;
  initStore: (userId?: string) => () => void;

  // Mutation actions (Chỉnh sửa TKB trực tiếp hoặc qua AI Agent)
  updateTimetableEntry: (entryId: string, updates: Partial<TimetableEntry>, userId?: string) => Promise<boolean>;
  swapTimetableEntries: (entry1Id: string, entry2Id: string, userId?: string) => Promise<boolean>;
  moveTimetableEntry: (entryId: string, target: { dayOfWeek: DayOfWeek; session: Session; period: number }, userId?: string) => Promise<boolean>;
  deleteTimetableEntry: (entryId: string, userId?: string) => Promise<boolean>;
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>, userId?: string) => Promise<string | null>;
  saveUpdatedTimetable: (updatedTimetable: SchoolTimetable, userId?: string) => Promise<void>;
}

export const useTeachingScheduleStore = create<TeachingScheduleState>((set, get) => ({
  timetable: null,
  allTimetables: [],
  selectedTeacher: '',
  myTeacher: '',
  selectedClass: '',
  selectedDay: getTodayDayOfWeek(),
  viewMode: 'teacher',
  displayMode: 'agenda',
  isCompactView: true,
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
      let savedPrefs = localStorage.getItem(PREFS_KEY);

      if (!savedPrefs && typeof window !== 'undefined') {
        const oldPrefs = localStorage.getItem(OLD_PREFS_KEY);
        if (oldPrefs) {
          try {
            const parsedOld = JSON.parse(oldPrefs);
            const migrated = {
              ...parsedOld,
              displayMode: 'agenda',
            };
            savedPrefs = JSON.stringify(migrated);
            localStorage.setItem(PREFS_KEY, savedPrefs);
          } catch {}
        }
      }

      if (savedTimetable) {
        const parsedTimetable: SchoolTimetable = JSON.parse(savedTimetable);
        if (parsedTimetable && parsedTimetable.classes && parsedTimetable.entries) {
          let teacher = parsedTimetable.teachers[0] || '';
          let myTeacher = '';
          let className = parsedTimetable.classes[0] || '';
          let mode: TeachingScheduleViewMode = 'teacher';
          let displayMode: ScheduleDisplayMode = 'agenda';
          let compactView = true;

          if (savedPrefs) {
            try {
              const prefs = JSON.parse(savedPrefs);
              if (prefs.myTeacher && parsedTimetable.teachers.includes(prefs.myTeacher)) {
                myTeacher = prefs.myTeacher;
                teacher = prefs.myTeacher; // Mặc định mở luôn lịch của giáo viên này
              }
              if (prefs.selectedTeacher && parsedTimetable.teachers.includes(prefs.selectedTeacher)) {
                teacher = prefs.selectedTeacher;
              }
              if (prefs.selectedClass && parsedTimetable.classes.includes(prefs.selectedClass)) {
                className = prefs.selectedClass;
              }
              if (prefs.viewMode) {
                mode = prefs.viewMode;
              }
              if (prefs.displayMode) {
                displayMode = prefs.displayMode;
              }
              if (prefs.isCompactView !== undefined) {
                compactView = Boolean(prefs.isCompactView);
              }
            } catch (e) {
              console.error('Failed to parse saved prefs:', e);
            }
          }

          set({
            timetable: parsedTimetable,
            selectedTeacher: teacher,
            myTeacher: myTeacher,
            selectedClass: className,
            viewMode: mode,
            displayMode: displayMode,
            isCompactView: compactView,
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
            let myTeacher = get().myTeacher;
            let className = activeTimetable.classes.includes(get().selectedClass)
              ? get().selectedClass
              : activeTimetable.classes[0] || '';
            let mode = get().viewMode;
            let displayMode = get().displayMode;

            if (savedPrefs) {
              try {
                const prefs = JSON.parse(savedPrefs);
                if (prefs.myTeacher && activeTimetable.teachers.includes(prefs.myTeacher)) {
                  myTeacher = prefs.myTeacher;
                  if (!get().selectedTeacher) teacher = prefs.myTeacher;
                }
                if (prefs.selectedTeacher && activeTimetable.teachers.includes(prefs.selectedTeacher)) {
                  teacher = prefs.selectedTeacher;
                }
                if (prefs.selectedClass && activeTimetable.classes.includes(prefs.selectedClass)) {
                  className = prefs.selectedClass;
                }
                if (prefs.viewMode) {
                  mode = prefs.viewMode;
                }
                if (prefs.displayMode) {
                  displayMode = prefs.displayMode;
                }
              } catch {}
            }

            set({
              timetable: activeTimetable,
              allTimetables: timetables,
              selectedTeacher: teacher,
              myTeacher: myTeacher,
              selectedClass: className,
              viewMode: mode,
              displayMode: displayMode,
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
          myTeacher: get().myTeacher,
          selectedClass: get().selectedClass,
          viewMode: get().viewMode,
          displayMode: get().displayMode,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setMyTeacher: (teacher: string) => {
    set({ myTeacher: teacher });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: get().selectedTeacher,
          myTeacher: teacher,
          selectedClass: get().selectedClass,
          viewMode: get().viewMode,
          displayMode: get().displayMode,
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
          myTeacher: get().myTeacher,
          selectedClass: className,
          viewMode: get().viewMode,
          displayMode: get().displayMode,
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
          myTeacher: get().myTeacher,
          selectedClass: get().selectedClass,
          viewMode: mode,
          displayMode: get().displayMode,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setDisplayMode: (mode: ScheduleDisplayMode) => {
    set({ displayMode: mode });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: get().selectedTeacher,
          myTeacher: get().myTeacher,
          selectedClass: get().selectedClass,
          viewMode: get().viewMode,
          displayMode: mode,
          isCompactView: get().isCompactView,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  setIsCompactView: (compact: boolean) => {
    set({ isCompactView: compact });
    if (typeof window !== 'undefined') {
      try {
        const prefs = {
          selectedTeacher: get().selectedTeacher,
          myTeacher: get().myTeacher,
          selectedClass: get().selectedClass,
          viewMode: get().viewMode,
          displayMode: get().displayMode,
          isCompactView: compact,
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {}
    }
  },

  toggleCompactView: () => {
    const nextState = !get().isCompactView;
    get().setIsCompactView(nextState);
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setIsImportModalOpen: (open: boolean) => set({ isImportModalOpen: open }),

  // ---------------------------------------------------------------------------
  // THAO TÁC CẬP NHẬT & CHỈNH SỬA THỜI KHÓA BIỂU
  // ---------------------------------------------------------------------------
  saveUpdatedTimetable: async (updatedTimetable: SchoolTimetable, userId?: string) => {
    set({ timetable: updatedTimetable });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTimetable));
      } catch (e) {
        console.warn('Lỗi lưu TKB vào localStorage:', e);
      }
    }
    const targetUserId = userId || updatedTimetable.userId;
    if (targetUserId) {
      try {
        await saveSchoolTimetable(updatedTimetable, targetUserId);
      } catch (e) {
        console.error('Lỗi lưu TKB cập nhật lên Firebase:', e);
      }
    }
  },

  updateTimetableEntry: async (entryId: string, updates: Partial<TimetableEntry>, userId?: string): Promise<boolean> => {
    const current = get().timetable;
    if (!current) return false;
    const index = current.entries.findIndex((e) => e.id === entryId);
    if (index === -1) return false;

    const newEntries = [...current.entries];
    newEntries[index] = { ...newEntries[index], ...updates };

    const updatedTimetable = recomputeTimetableMetadata({
      ...current,
      entries: newEntries,
    });

    await get().saveUpdatedTimetable(updatedTimetable, userId);
    return true;
  },

  swapTimetableEntries: async (entry1Id: string, entry2Id: string, userId?: string): Promise<boolean> => {
    const current = get().timetable;
    if (!current) return false;
    const idx1 = current.entries.findIndex((e) => e.id === entry1Id);
    const idx2 = current.entries.findIndex((e) => e.id === entry2Id);
    if (idx1 === -1 || idx2 === -1) return false;

    const newEntries = [...current.entries];
    const e1 = newEntries[idx1];
    const e2 = newEntries[idx2];

    newEntries[idx1] = {
      ...e1,
      dayOfWeek: e2.dayOfWeek,
      session: e2.session,
      period: e2.period,
    };
    newEntries[idx2] = {
      ...e2,
      dayOfWeek: e1.dayOfWeek,
      session: e1.session,
      period: e1.period,
    };

    const updatedTimetable = recomputeTimetableMetadata({
      ...current,
      entries: newEntries,
    });

    await get().saveUpdatedTimetable(updatedTimetable, userId);
    return true;
  },

  moveTimetableEntry: async (
    entryId: string,
    target: { dayOfWeek: DayOfWeek; session: Session; period: number },
    userId?: string
  ): Promise<boolean> => {
    const current = get().timetable;
    if (!current) return false;
    const idx = current.entries.findIndex((e) => e.id === entryId);
    if (idx === -1) return false;

    const newEntries = [...current.entries];
    // Nếu tại ô đích đã có tiết học của cùng lớp hoặc cùng giáo viên -> hoán đổi vị trí
    const targetConflictIdx = newEntries.findIndex(
      (e, i) =>
        i !== idx &&
        e.dayOfWeek === target.dayOfWeek &&
        e.session === target.session &&
        e.period === target.period &&
        (e.className === newEntries[idx].className || e.teacher.toLowerCase() === newEntries[idx].teacher.toLowerCase())
    );

    if (targetConflictIdx !== -1) {
      const conflictEntry = newEntries[targetConflictIdx];
      newEntries[targetConflictIdx] = {
        ...conflictEntry,
        dayOfWeek: newEntries[idx].dayOfWeek,
        session: newEntries[idx].session,
        period: newEntries[idx].period,
      };
    }

    newEntries[idx] = {
      ...newEntries[idx],
      dayOfWeek: target.dayOfWeek,
      session: target.session,
      period: target.period,
    };

    const updatedTimetable = recomputeTimetableMetadata({
      ...current,
      entries: newEntries,
    });

    await get().saveUpdatedTimetable(updatedTimetable, userId);
    return true;
  },

  deleteTimetableEntry: async (entryId: string, userId?: string): Promise<boolean> => {
    const current = get().timetable;
    if (!current) return false;
    const newEntries = current.entries.filter((e) => e.id !== entryId);
    if (newEntries.length === current.entries.length) return false;

    const updatedTimetable = recomputeTimetableMetadata({
      ...current,
      entries: newEntries,
    });

    await get().saveUpdatedTimetable(updatedTimetable, userId);
    return true;
  },

  addTimetableEntry: async (
    entryData: Omit<TimetableEntry, 'id'>,
    userId?: string
  ): Promise<string | null> => {
    const current = get().timetable;
    if (!current) return null;

    const newId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newEntry: TimetableEntry = {
      ...entryData,
      id: newId,
    };

    const newEntries = [...current.entries, newEntry];
    const updatedTimetable = recomputeTimetableMetadata({
      ...current,
      entries: newEntries,
    });

    await get().saveUpdatedTimetable(updatedTimetable, userId);
    return newId;
  },
}));
