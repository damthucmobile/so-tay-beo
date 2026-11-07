// features/health/components/WorkoutView.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Dumbbell,
  Play,
  Plus,
  Flame,
  Clock,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Edit3,
  Calendar,
  ShieldCheck,
  Activity,
  Layers,
  Sliders,
  Award,
  Zap,
  Target,
  Lightbulb,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useHealthStore } from '../stores/useHealthStore';
import {
  WorkoutPlan,
  DailyWorkoutPlan,
  ExerciseItem,
  WorkoutProfile,
  DailyWorkoutLog,
  ExerciseCategory,
} from '../types';
import { WorkoutService } from '../services/workoutService';
import { GenerateWorkoutPlanModal } from './GenerateWorkoutPlanModal';
import { EditExerciseModal } from './EditExerciseModal';
import { EditWorkoutPlanMetaModal } from './EditWorkoutPlanMetaModal';
import { LiveWorkoutSessionModal } from './LiveWorkoutSessionModal';
import { HealthReminderModal } from './HealthReminderModal';

interface WorkoutViewProps {
  onBackToOverview: () => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ onBackToOverview }) => {
  const { user } = useAuth();
  const metrics = useHealthStore((state) => state.metrics);
  const checkupSessions = useHealthStore((state) => state.checkupSessions);

  // Local state & subscriptions
  // 0 = Thứ Hai, ..., 5 = Thứ Bảy, 6 = Chủ Nhật
  const getTodayDayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  };

  const [profile, setProfile] = useState<WorkoutProfile | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(getTodayDayIndex);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Logs
  const todayStr = new Date().toISOString().split('T')[0];
  const [todayLog, setTodayLog] = useState<DailyWorkoutLog | null>(null);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isEditPlanMetaOpen, setIsEditPlanMetaOpen] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [editingExerciseTarget, setEditingExerciseTarget] = useState<{
    dayIndex: number;
    item: ExerciseItem | null;
  } | null>(null);

  // Subscriptions & Local Cache
  useEffect(() => {
    if (!user?.uid) return;

    // Load local cache first
    const cache = WorkoutService.getLocalCache();
    if (cache.profile) setProfile(cache.profile);
    if (cache.plans.length > 0) {
      setPlans(cache.plans);
      setSelectedPlanId(cache.plans[0].id);
    }
    if (cache.logs[todayStr]) {
      setTodayLog(cache.logs[todayStr]);
    }

    // Subscribe to Firestore
    const unsubProfile = WorkoutService.subscribeWorkoutProfile(user.uid, (p) => {
      setProfile(p);
    });

    const unsubPlans = WorkoutService.subscribeWorkoutPlans(user.uid, (planList) => {
      setPlans(planList);
      if (planList.length > 0 && (!selectedPlanId || !planList.some((p) => p.id === selectedPlanId))) {
        setSelectedPlanId(planList[0].id);
      }
    });

    const unsubLog = WorkoutService.subscribeDailyWorkoutLog(user.uid, todayStr, (l) => {
      setTodayLog(l);
    });

    return () => {
      unsubProfile();
      unsubPlans();
      unsubLog();
    };
  }, [user?.uid, todayStr]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  const activeDay: DailyWorkoutPlan | null =
    activePlan?.days?.[activeDayIndex] || activePlan?.days?.[0] || null;

  // Tự động cuộn tab ngày đang chọn (hoặc ngày hôm nay) vào giữa màn hình trên mobile
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [activeDayIndex, activePlan?.id]);

  // Căn cứ y tế & chỉ định an toàn tim mạch / khớp từ chỉ số xét nghiệm
  const medicalSafetyAlerts = useMemo(() => {
    const alerts: { id: string; label: string; value: string; rule: string; type: 'warning' | 'info' }[] = [];
    const seen = new Set<string>();

    metrics.forEach((m) => {
      const code = (m.metricCode || '').toUpperCase();
      const val = parseFloat(String(m.value).replace(',', '.'));

      // Huyết áp cao
      if (code.includes('BP') || m.metricName.toLowerCase().includes('huyết áp')) {
        if (!seen.has('BP') && (m.status === 'high' || val > 135)) {
          seen.add('BP');
          alerts.push({
            id: 'BP',
            label: 'Huyết Áp Cần Kiểm Soát',
            value: `${m.value} ${m.unit || 'mmHg'}`,
            rule: 'Tuyệt đối thở đều, không nín thở gồng bụng (Valsalva). Ưu tiên Cardio Zone 2 nhịp tim 60-70% max.',
            type: 'warning',
          });
        }
      }
      // Axit Uric
      else if (code === 'URIC_ACID' || m.metricName.toLowerCase().includes('uric')) {
        if (!seen.has('URIC') && (m.status === 'high' || val > 420)) {
          seen.add('URIC');
          alerts.push({
            id: 'URIC',
            label: 'Axit Uric Cao',
            value: `${m.value} ${m.unit || 'µmol/L'}`,
            rule: 'Tránh tập tạ kiệt sức gây tích lũy axit lactic cạnh tranh đào thải uric; bổ sung 500ml nước ấm sau tập.',
            type: 'warning',
          });
        }
      }
      // Mỡ máu
      else if (code.includes('TRIGLYCERIDE') || code.includes('CHOLESTEROL')) {
        if (!seen.has('LIPID') && m.status === 'high') {
          seen.add('LIPID');
          alerts.push({
            id: 'LIPID',
            label: `Mỡ máu (${m.metricName})`,
            value: `${m.value} ${m.unit || 'mmol/L'}`,
            rule: 'Tập kháng lực nhóm cơ lớn (Chân, Mông, Lưng) kết hợp 30-40p cardio để kích thích tiêu thụ axit béo tự do.',
            type: 'warning',
          });
        }
      }
      // BMI cao
      else if (code === 'BMI' || m.metricName.toLowerCase().includes('bmi')) {
        if (!seen.has('BMI') && (m.status === 'high' || val > 25)) {
          seen.add('BMI');
          alerts.push({
            id: 'BMI',
            label: 'Chỉ số BMI Thừa Cân',
            value: `${m.value}`,
            rule: 'Ưu tiên bài tập ít va đập (Low-impact) như Đi bộ dốc, Đạp xe, Squat có điểm tựa để bảo vệ khớp gối & cột sống.',
            type: 'warning',
          });
        }
      }
    });

    return alerts;
  }, [metrics]);

  // Xóa kế hoạch
  const handleDeletePlan = async (planId: string) => {
    if (confirm('Bạn có chắc muốn xóa kế hoạch lịch tập này?')) {
      await WorkoutService.deleteWorkoutPlan(planId);
      const remaining = plans.filter((p) => p.id !== planId);
      setPlans(remaining);
      if (remaining.length > 0) setSelectedPlanId(remaining[0].id);
    }
  };

  // Lưu hoặc Cập nhật động tác
  const handleSaveExercise = async (savedItem: ExerciseItem) => {
    if (!activePlan || !editingExerciseTarget) return;
    const { dayIndex } = editingExerciseTarget;

    const updatedDays = [...(activePlan.days || [])];
    const targetDay = { ...updatedDays[dayIndex] };
    const currentExercises = [...(targetDay.exercises || [])];

    const existingIdx = currentExercises.findIndex((e) => e.id === savedItem.id);
    if (existingIdx >= 0) {
      currentExercises[existingIdx] = savedItem;
    } else {
      currentExercises.push(savedItem);
    }

    targetDay.exercises = currentExercises;
    targetDay.estimatedMinutes = currentExercises.reduce(
      (acc, e) => acc + Math.round((e.sets * ((e.durationSeconds || 40) + e.restSeconds)) / 60),
      0
    );
    targetDay.estimatedCalories = Math.round(targetDay.estimatedMinutes * 6.5);

    updatedDays[dayIndex] = targetDay;

    await WorkoutService.updateWorkoutPlan(activePlan.id, { days: updatedDays });
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, days: updatedDays } : p))
    );
  };

  // Xóa động tác
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!activePlan || !editingExerciseTarget) return;
    const { dayIndex } = editingExerciseTarget;

    const updatedDays = [...(activePlan.days || [])];
    const targetDay = { ...updatedDays[dayIndex] };
    targetDay.exercises = (targetDay.exercises || []).filter((e) => e.id !== exerciseId);

    targetDay.estimatedMinutes = targetDay.exercises.reduce(
      (acc, e) => acc + Math.round((e.sets * ((e.durationSeconds || 40) + e.restSeconds)) / 60),
      0
    );
    targetDay.estimatedCalories = Math.round(targetDay.estimatedMinutes * 6.5);

    updatedDays[dayIndex] = targetDay;

    await WorkoutService.updateWorkoutPlan(activePlan.id, { days: updatedDays });
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, days: updatedDays } : p))
    );
  };

  // Cập nhật thông tin chung lịch tập
  const handleUpdatePlanMeta = async (updates: Partial<WorkoutPlan>) => {
    if (!activePlan) return;
    await WorkoutService.updateWorkoutPlan(activePlan.id, updates);
    setPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, ...updates } : p))
    );
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-fadeIn pb-24 sm:pb-16">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Quay lại trang Sức Khỏe & Thể Chất</span>
          <span className="sm:hidden">Quay lại Sức Khỏe</span>
        </button>

        <div className="flex items-center gap-2">
          {todayLog && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Đã tập hôm nay ({todayLog.caloriesBurned} kcal)</span>
              <span className="sm:hidden">Đã tập</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsReminderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-500 transition cursor-pointer shadow-xs shrink-0"
            title="Cài đặt nhắc nhở lịch tập & uống nước"
          >
            <Bell className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Nhắc nhở</span>
          </button>
        </div>
      </div>

      {/* Top Banner Dashboard (Mobile-first, Aesthetic & Vibrant) */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 p-4 sm:p-7 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
              <Dumbbell className="w-3.5 h-3.5 shrink-0" />
              <span>Y Học Thể Thao & Lịch Tập</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Tập Luyện An Toàn Chuẩn Hóa Theo Chỉ Số Cơ Thể
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Cá nhân hóa theo nhịp tim, huyết áp, mỡ máu và tình trạng cơ xương khớp. Tối ưu tiêu hao mỡ thừa và bảo vệ hệ tuần hoàn.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            {activeDay && !activeDay.isRestDay && (
              <button
                type="button"
                onClick={() => setIsLiveSessionOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-semibold text-xs hover:bg-rose-100 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-current" />
                <span className="truncate">Tập trực tiếp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition active:scale-95 cursor-pointer text-center"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">1-Click Lập Lịch Tập</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row Widgets: Cảnh báo An Toàn Thể Chất & Thống Kê Tiêu Hao Calo Tuần */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Widget 1: Căn Cứ Y Học Thể Thao Từ Chỉ Số Sức Khỏe */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
              <span>Chỉ Định Y Học Thể Thao Từ Chỉ Số</span>
            </h4>
            <span className="text-[11px] font-medium text-slate-400">
              {medicalSafetyAlerts.length > 0 ? `${medicalSafetyAlerts.length} lưu ý` : 'Thể trạng tốt'}
            </span>
          </div>

          {medicalSafetyAlerts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {medicalSafetyAlerts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{item.value}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug font-normal">
                    {item.rule}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold block">Hệ vận động & Tim mạch sẵn sàng!</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Bạn có thể áp dụng chế độ tập luyện kháng lực tăng tiến và cardio rèn luyện sức bền.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Widget 2: Mục Tiêu Calo Tuần & Trạng Thái Hoàn Thành */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-white dark:to-slate-900 border border-rose-200/80 dark:border-rose-900/40 space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <span>Năng Lượng Tiêu Hao Tuần</span>
            </h4>
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              {activePlan?.weeklyTargetCalories || 1600} kcal
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: todayLog ? '35%' : '15%' }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-rose-700 dark:text-rose-300 font-semibold">
                {todayLog ? `Đã đốt ${todayLog.caloriesBurned} kcal hôm nay` : 'Chưa có buổi tập hôm nay'}
              </span>
              <span className="text-slate-400">Mục tiêu: {activePlan?.weeklyTargetCalories || 1600} kcal</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLiveSessionOpen(true)}
            disabled={!activeDay || activeDay.isRestDay}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-40"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{activeDay?.isRestDay ? 'Hôm Nay Nghỉ Phục Hồi' : 'Vào Chế Độ Tập Luyện'}</span>
          </button>
        </div>
      </div>

      {/* MAIN: 7-DAY WORKOUT SCHEDULE */}
      {activePlan ? (
        <div className="space-y-4 sm:space-y-5">
          {/* Plan Info Bar & Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug break-words">
                    {activePlan.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 shrink-0">
                    {activePlan.weeklyTargetCalories} kcal/tuần
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight font-normal">
                  Cấp độ: {activePlan.fitnessLevel === 'beginner' ? 'Cơ bản' : activePlan.fitnessLevel === 'intermediate' ? 'Vừa phải' : 'Nâng cao'} • Dụng cụ: {activePlan.equipment?.join(', ') || 'Tay không'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto min-w-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
              {plans.length > 1 && (
                <div className="flex-1 sm:flex-initial min-w-0 sm:w-64 max-w-full">
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer truncate"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => setIsEditPlanMetaOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  title="Sửa thông tin lịch tập"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeletePlan(activePlan.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  title="Xóa lịch tập này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Analysis Summary */}
          {activePlan.aiAnalysisSummary && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-rose-800 dark:text-rose-300 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chiến Lược Y Học Thể Thao Từ Trợ Lý AI:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPlanMetaOpen(true)}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs font-normal">
                {activePlan.aiAnalysisSummary}
              </p>
            </div>
          )}

          {/* 7-DAY TABS (Thứ Hai ➔ Chủ Nhật - Mobile Snap Scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-1 px-1 no-scrollbar snap-x snap-mandatory">
            {activePlan.days?.map((day, idx) => {
              const isActive = activeDayIndex === idx;
              const isToday = getTodayDayIndex() === idx;
              return (
                <button
                  key={day.dayOfWeek || idx}
                  ref={isActive ? activeTabRef : null}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-3.5 py-2 rounded-2xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border snap-start ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-500 shadow-md shadow-rose-500/25 ring-2 ring-rose-500/20 font-semibold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 font-medium'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.dayName || `Ngày ${idx + 1}`}</span>
                  {isToday && (
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      Hôm nay
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-medium ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {day.isRestDay ? 'Nghỉ' : `${day.estimatedCalories || 200}k`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CHI TIẾT BUỔI TẬP CỦA NGÀY ĐANG CHỌN */}
          {activeDay && (
            <div className="space-y-4">
              {activeDay.isRestDay ? (
                /* Rest Day Card */
                <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                    {activeDay.sessionTitle || 'Ngày Nghỉ Phục Hồi Tích Cực (Active Recovery)'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-normal leading-relaxed">
                    {activeDay.recoveryTips ||
                      'Hôm nay hãy dành thời gian dãn cơ nhẹ, đi dạo 15-20 phút, ngủ đủ giấc và uống đủ nước để cơ bắp và hệ thần kinh tái tạo tối ưu.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingExerciseTarget({
                        dayIndex: activeDayIndex,
                        item: null,
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm bài tập nhẹ vào ngày này</span>
                  </button>
                </div>
              ) : (
                /* Workout Day Card */
                <div className="p-4 sm:p-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                  {/* Session Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 shrink-0">
                          {activeDay.dayName}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white break-words">
                          {activeDay.sessionTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal">
                        Mục tiêu cơ: {activeDay.focusMuscle} • Cường độ:{' '}
                        {activeDay.intensity === 'high' ? 'Cao' : activeDay.intensity === 'moderate' ? 'Vừa phải' : 'Nhẹ nhàng'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto flex-wrap">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {activeDay.estimatedMinutes} phút
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
                          <Flame className="w-3.5 h-3.5" />
                          ~{activeDay.estimatedCalories} kcal
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingExerciseTarget({
                              dayIndex: activeDayIndex,
                              item: null,
                            })
                          }
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          title="Thêm bài tập"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsLiveSessionOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tập ngay</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exercises List */}
                  <div className="space-y-2.5">
                    {activeDay.exercises && activeDay.exercises.length > 0 ? (
                      activeDay.exercises.map((ex, exIdx) => {
                        const isWarmup = ex.category === 'warmup';
                        const isCooldown = ex.category === 'cooldown';

                        return (
                          <div
                            key={ex.id || exIdx}
                            className={`p-3.5 rounded-2xl border transition space-y-2 ${
                              isWarmup
                                ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30'
                                : isCooldown
                                ? 'bg-teal-50/30 dark:bg-teal-950/10 border-teal-200/50 dark:border-teal-900/30'
                                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase shrink-0 ${
                                      isWarmup
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : isCooldown
                                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}
                                  >
                                    {isWarmup ? 'Khởi động' : isCooldown ? 'Hạ nhiệt' : 'Bài chính'}
                                  </span>
                                  <h5 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug break-words">
                                    {ex.name}
                                  </h5>
                                </div>
                              </div>

                              {/* Action buttons (Touch-friendly on mobile) */}
                              <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-800 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingExerciseTarget({
                                      dayIndex: activeDayIndex,
                                      item: ex,
                                    })
                                  }
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-600 transition cursor-pointer"
                                  title="Chỉnh sửa động tác"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingExerciseTarget({
                                      dayIndex: activeDayIndex,
                                      item: ex,
                                    });
                                    handleDeleteExercise(ex.id);
                                  }}
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-600 transition cursor-pointer"
                                  title="Xóa động tác"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Sets / Reps / Target Muscle */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
                              <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200/60 dark:border-slate-700">
                                {ex.sets} hiệp {ex.reps ? `× ${ex.reps} lần` : ex.durationSeconds ? `× ${Math.round(ex.durationSeconds / 60)} phút` : ''}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                <Clock className="w-3 h-3 text-rose-500" />
                                <span>Nghỉ {ex.restSeconds || 60}s</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                <Target className="w-3 h-3 text-slate-500" />
                                <span>{ex.targetMuscle}</span>
                              </span>
                              {ex.weightKg ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                  <Dumbbell className="w-3 h-3 text-amber-500" />
                                  <span>{ex.weightKg} kg</span>
                                </span>
                              ) : null}
                            </div>

                            {/* Form cues & Medical notice */}
                            {ex.formCues && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug flex items-start gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span>{ex.formCues}</span>
                              </p>
                            )}

                            {ex.medicalNotice && (
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-[10px] text-emerald-900 dark:text-emerald-200 border border-emerald-500/20 flex items-start gap-1.5 leading-snug font-normal">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <span>{ex.medicalNotice}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-xs text-slate-400 italic">Chưa có bài tập nào trong buổi này</p>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingExerciseTarget({
                              dayIndex: activeDayIndex,
                              item: null,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm bài tập đầu tiên</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Safety Precautions Box (Lưu ý y tế quan trọng) */}
          {activePlan.safetyPrecautions && activePlan.safetyPrecautions.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Chỉ Định An Toàn Y Học Thể Thao:</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 font-normal">
                {activePlan.safetyPrecautions.map((item, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-1.5 leading-relaxed">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4 bg-white dark:bg-slate-900">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-500/20">
            <Dumbbell className="w-7 sm:w-8 h-7 sm:h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Bạn Chưa Có Lịch Tập Thể Chất Nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Hãy để Trợ lý AI phân tích các chỉ số xét nghiệm và xây dựng một lịch tập 7 ngày cá nhân hóa, vừa an toàn cho tim mạch, vừa tối ưu đốt mỡ và bảo vệ khớp.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-lg shadow-rose-500/25 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo Lịch Tập 7 Ngày Bằng AI Ngay</span>
          </button>
        </div>
      )}

      {/* MODALS */}
      {user?.uid && (
        <>
          <GenerateWorkoutPlanModal
            isOpen={isGenerateModalOpen}
            onClose={() => setIsGenerateModalOpen(false)}
            userId={user.uid}
            metrics={metrics}
            checkupSessions={checkupSessions}
            profile={profile}
            onPlanCreated={(planId) => {
              setSelectedPlanId(planId);
              setActiveDayIndex(getTodayDayIndex());
            }}
          />

          {editingExerciseTarget && (
            <EditExerciseModal
              isOpen={!!editingExerciseTarget}
              onClose={() => setEditingExerciseTarget(null)}
              dayName={activeDay?.dayName || `Ngày ${editingExerciseTarget.dayIndex + 1}`}
              item={editingExerciseTarget.item}
              onSave={handleSaveExercise}
              onDelete={handleDeleteExercise}
            />
          )}

          <HealthReminderModal
            isOpen={isReminderModalOpen}
            onClose={() => setIsReminderModalOpen(false)}
            userId={user.uid}
          />

          <EditWorkoutPlanMetaModal
            isOpen={isEditPlanMetaOpen}
            onClose={() => setIsEditPlanMetaOpen(false)}
            plan={activePlan}
            onSave={handleUpdatePlanMeta}
          />

          {isLiveSessionOpen && activeDay && (
            <LiveWorkoutSessionModal
              isOpen={isLiveSessionOpen}
              onClose={() => setIsLiveSessionOpen(false)}
              userId={user.uid}
              planId={activePlan?.id || ''}
              dayIndex={activeDayIndex}
              dayPlan={activeDay}
              onSessionCompleted={() => {
                // Refresh log state
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
