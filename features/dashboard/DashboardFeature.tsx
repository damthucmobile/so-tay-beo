'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/core/firebase';
import { useClassManager } from '@/features/class/hooks/useClassManager';
import { useTeachingScheduleStore } from '@/features/teaching-schedule/stores/useTeachingScheduleStore';
import { getEntryTime, DayOfWeek } from '@/features/teaching-schedule/types';
import { useScheduleManager } from '@/features/schedule/hooks/useScheduleManager';
import { useIncomeManager } from '@/features/income/hooks/useIncomeManager';
import { useSpendingStore } from '@/features/spending/stores/useSpendingStore';
import { HeroGreeting } from './components/HeroGreeting';
import { ExecutiveKpiCards } from './components/ExecutiveKpiCards';
import { DashboardChartsSection } from './components/DashboardChartsSection';
import { TodayUnifiedTimeline } from './components/TodayUnifiedTimeline';
import { QuickLaunchpad } from './components/QuickLaunchpad';
import { LifeBalanceWidget } from './components/LifeBalanceWidget';
import { DashboardTripsShowcase } from './components/DashboardTripsShowcase';
import { useTravelStore } from '@/features/travel/stores/useTravelStore';
import { UnifiedTimelineEvent, ExecutiveStats } from './types';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

interface DashboardFeatureProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardFeature: React.FC<DashboardFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const userId = user?.uid;

  // 1. Quản lý lớp học
  const { classes, students, sessions } = useClassManager(userId);

  // 2. Thời khóa biểu nhà trường
  const timetable = useTeachingScheduleStore((state) => state.timetable);
  const myTeacher = useTeachingScheduleStore((state) => state.myTeacher);
  const selectedTeacher = useTeachingScheduleStore((state) => state.selectedTeacher);
  const setMyTeacher = useTeachingScheduleStore((state) => state.setMyTeacher);
  const setSelectedTeacher = useTeachingScheduleStore((state) => state.setSelectedTeacher);
  const initTeachingStore = useTeachingScheduleStore((state) => state.initStore);

  // 3. Lịch tự do & Khách hàng
  const { appointments } = useScheduleManager(userId);

  // 4. Thu nhập & Thù lao
  const { transactions: incomeTransactions } = useIncomeManager(userId);

  // 5. Chi tiêu & Ngân sách
  const expenses = useSpendingStore((state) => state.expenses);
  const monthlyBudget = useSpendingStore((state) => state.monthlyBudget);
  const initSpendingStore = useSpendingStore((state) => state.initStore);

  // 6. Chuyến đi sắp tới
  const trips = useTravelStore((state) => state.trips);
  const fetchTrips = useTravelStore((state) => state.fetchTrips);

  useEffect(() => {
    if (!userId) return;
    const unsubSpending = initSpendingStore(userId);
    const unsubTeaching = initTeachingStore(userId);
    fetchTrips(userId);
    return () => {
      unsubSpending();
      if (typeof unsubTeaching === 'function') {
        unsubTeaching();
      }
    };
  }, [userId, initSpendingStore, initTeachingStore, fetchTrips]);

  const nearestUpcomingTrip = useMemo(() => {
    if (!trips || trips.length === 0) return null;
    const now = new Date();
    const sorted = [...trips]
      .filter((t) => {
        try {
          const start = parseISO(t.startDate);
          const end = parseISO(t.endDate);
          return start >= now || differenceInCalendarDays(start, now) >= 0 || (start <= now && end >= now);
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    return sorted.length > 0 ? sorted[0] : null;
  }, [trips]);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  // Ngày đang được chọn để xem lịch (mặc định là hôm nay, có thể bấm vào ngày khác trong Weekly Strip)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Xác định giáo viên hiện tại một cách thông minh và nhất quán
  const activeTeacher = useMemo(() => {
    if (!timetable || !timetable.teachers || timetable.teachers.length === 0) return '';

    // 1. Ưu tiên giáo viên đã ghim làm "Giáo viên của tôi"
    if (myTeacher && myTeacher.trim() && timetable.teachers.includes(myTeacher.trim())) {
      return myTeacher.trim();
    }

    // 2. Giáo viên đang chọn xem trong phân hệ TKB
    if (selectedTeacher && selectedTeacher.trim() && timetable.teachers.includes(selectedTeacher.trim())) {
      return selectedTeacher.trim();
    }

    // 3. Khớp tự động theo tên hiển thị của tài khoản (VD: "Cô Phương" -> "Phương")
    if (user?.displayName) {
      const cleanUser = user.displayName.toLowerCase().replace(/^(cô|thầy)\s+/i, '').trim();
      const matched = timetable.teachers.find((t) => {
        const tClean = t.toLowerCase().trim();
        return tClean.includes(cleanUser) || cleanUser.includes(tClean);
      });
      if (matched) return matched;
    }

    // 4. Mặc định là giáo viên đầu tiên trong danh sách TKB
    return timetable.teachers[0] || '';
  }, [timetable, myTeacher, selectedTeacher, user?.displayName]);

  // Chuyển đổi ngày YYYY-MM-DD thành DayOfWeek trong tuần
  const getDayOfWeekFromDate = (dateString: string): DayOfWeek | null => {
    try {
      const d = parseISO(dateString);
      const day = d.getDay();
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
          return null; // Chủ nhật
      }
    } catch {
      return null;
    }
  };

  // Hợp nhất timeline cho ngày đang chọn (selectedDate)
  const selectedDateEvents = useMemo<UnifiedTimelineEvent[]>(() => {
    const list: UnifiedTimelineEvent[] = [];
    const targetDayOfWeek = getDayOfWeekFromDate(selectedDate);
    const nowTimeStr = format(new Date(), 'HH:mm');
    const isViewingToday = selectedDate === todayStr;

    // Nguồn 1: Tiết dạy nhà trường trong ngày (BẮT BUỘC CHỈ LỌC THEO GIÁO VIÊN HIỆN TẠI)
    if (timetable && targetDayOfWeek && activeTeacher) {
      const activeTeacherClean = activeTeacher.trim().toLowerCase();
      const schoolEntries = timetable.entries.filter((entry) => {
        if (entry.dayOfWeek !== targetDayOfWeek) return false;
        const entryTeacherClean = (entry.teacher || '').trim().toLowerCase();
        return (
          entryTeacherClean === activeTeacherClean ||
          entryTeacherClean.includes(activeTeacherClean)
        );
      });

      schoolEntries.forEach((entry) => {
        const time = getEntryTime(entry);

        // Tính toán trạng thái động theo thời gian thực
        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
        if (isViewingToday && time.start) {
          const start = time.start;
          const end = time.end || '23:59';
          if (nowTimeStr >= start && nowTimeStr <= end) {
            status = 'ongoing';
          } else if (nowTimeStr > end) {
            status = 'completed';
          }
        }

        list.push({
          id: `school_${entry.id}`,
          title: `Tiết ${entry.period}: ${entry.subject || 'Dạy học'} - ${entry.className}`,
          subtitle: entry.teacher ? `GV: ${entry.teacher}` : undefined,
          timeStart: time.start,
          timeEnd: time.end,
          type: 'school',
          status,
          location: entry.room ? `Phòng ${entry.room}` : undefined,
          rawDate: selectedDate,
        });
      });
    }

    // Nguồn 2: Buổi học của lớp dạy thêm (ClassSession)
    if (sessions && sessions.length > 0) {
      const matchedSessions = sessions.filter((s) => s.sessionDate === selectedDate);
      matchedSessions.forEach((s) => {
        const matchingClass = classes.find((c) => c.id === s.classId);
        list.push({
          id: `class_${s.id}`,
          title: matchingClass ? matchingClass.className : (s.lessonTopic || 'Buổi dạy học'),
          subtitle: matchingClass?.centerName || 'Lớp ngoài',
          timeStart: s.startTime || '18:00',
          timeEnd: s.endTime,
          type: 'class',
          status: s.status === 'COMPLETED' ? 'completed' : 'upcoming',
          location: matchingClass?.centerName,
          rawDate: selectedDate,
        });
      });
    }

    // Nguồn 3: Lịch hẹn tự do (Appointments)
    if (appointments && appointments.length > 0) {
      const matchedApps = appointments.filter((a) => a.date && a.date.startsWith(selectedDate));
      matchedApps.forEach((a) => {
        const timePart = a.date.includes('T') ? a.date.split('T')[1].substring(0, 5) : '09:00';
        list.push({
          id: `app_${a.id}`,
          title: a.title,
          subtitle: a.customerName ? `Khách: ${a.customerName}` : undefined,
          timeStart: timePart,
          type: 'appointment',
          status: a.status === 'Đã hoàn thành' ? 'completed' : 'upcoming',
          location: a.location,
          rawDate: selectedDate,
        });
      });
    }

    // Sắp xếp theo giờ bắt đầu tăng dần
    return list.sort((a, b) => a.timeStart.localeCompare(b.timeStart));
  }, [timetable, selectedDate, activeTeacher, sessions, classes, appointments]);

  // Tổng hợp chỉ số KPI điều hành
  const stats = useMemo<ExecutiveStats>(() => {
    const totalClassesCount = classes.length;
    const totalStudentsCount = students.filter((st) => st.status === 'ACTIVE').length;

    // Thù lao tháng
    const monthSessions = sessions.filter(
      (s) => s.sessionDate && s.sessionDate.startsWith(currentMonthStr) && s.status === 'COMPLETED'
    );
    const classSalaryTotal = monthSessions.reduce((sum, s) => sum + (s.calculatedSalary || 0), 0);

    const monthlyIncomeTx = incomeTransactions.filter(
      (tx) => tx.date && tx.date.startsWith(currentMonthStr)
    );
    const freelanceSalaryTotal = monthlyIncomeTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const estimatedRemuneration = classSalaryTotal + freelanceSalaryTotal;

    // Chi tiêu tháng
    const monthlyExpensesList = expenses.filter(
      (e) => e.date && e.date.startsWith(currentMonthStr)
    );
    const monthlyExpense = monthlyExpensesList
      .filter((e) => e.type === 'expense' || !e.type)
      .reduce((sum, e) => sum + e.amount, 0);
    const monthlyIncome = monthlyExpensesList
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      todayEventsCount: selectedDateEvents.length,
      totalClassesCount,
      totalStudentsCount,
      estimatedRemuneration,
      monthlyExpense,
      monthlyIncome,
    };
  }, [
    classes,
    students,
    sessions,
    incomeTransactions,
    currentMonthStr,
    expenses,
    selectedDateEvents.length,
  ]);

  return (
    <div className="w-full space-y-6 sm:space-y-7 pb-16 animate-fadeIn">
      {/* 1. Hero Greeting Banner kèm Dải lịch 7 ngày trong tuần */}
      <HeroGreeting
        userName={user?.displayName || 'Cô Phương'}
        todayCount={selectedDateEvents.length}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. Executive KPI Cards có Sparklines và Tỷ lệ */}
      <ExecutiveKpiCards stats={stats} onNavigateTab={onNavigateTab} />

      {/* 3. TRUNG TÂM BIỂU ĐỒ TRỰC QUAN (CHARTS SECTION) */}
      <DashboardChartsSection
        expenses={expenses}
        incomeTransactions={incomeTransactions}
        sessions={sessions}
        timetable={timetable}
        myTeacher={activeTeacher}
        selectedMonth={currentMonthStr}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Split Section: Timeline Lịch Trình (Trái) & Phím tắt + Cân bằng đời sống (Phải) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* Cột trái (2 cột trên desktop, full width trên mobile): Timeline */}
        <div className="lg:col-span-2">
          <TodayUnifiedTimeline
            events={selectedDateEvents}
            selectedDate={selectedDate}
            activeTeacher={activeTeacher}
            teachers={timetable?.teachers || []}
            isMyTeacher={Boolean(myTeacher && myTeacher === activeTeacher)}
            onSelectTeacher={(t) => setSelectedTeacher(t)}
            onToggleMyTeacher={() => {
              if (myTeacher === activeTeacher) {
                setMyTeacher('');
              } else {
                setMyTeacher(activeTeacher);
              }
            }}
            onNavigateTab={onNavigateTab}
          />
        </div>

        {/* Cột phải (1 cột): Phím tắt nhanh & Cân bằng đời sống */}
        <div className="space-y-5 sm:space-y-6">
          <QuickLaunchpad onNavigateTab={onNavigateTab} />

          <LifeBalanceWidget
            monthlyBudget={monthlyBudget?.totalBudget || 0}
            monthlyExpense={stats.monthlyExpense}
            hideTrip={Boolean(nearestUpcomingTrip)}
            onNavigateTab={onNavigateTab}
          />
        </div>
      </div>

      {/* 5. Bộ sưu tập Hành trình & Chuyến đi nghỉ dưỡng (có ảnh và thông tin chi tiết) */}
      <DashboardTripsShowcase
        trips={trips || []}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
