// features/health/components/GenerateWorkoutPlanModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Dumbbell,
  Flame,
  Clock,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
  Activity,
  User,
  Repeat,
  Building2,
  Trees,
} from 'lucide-react';
import {
  HealthMetricValue,
  HealthCheckupSession,
  WorkoutProfile,
  WorkoutGoal,
  FitnessLevel,
  EquipmentType,
  WorkoutPlan,
} from '../types';
import { WorkoutService } from '../services/workoutService';

interface GenerateWorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  metrics: HealthMetricValue[];
  checkupSessions: HealthCheckupSession[];
  profile: WorkoutProfile | null;
  onPlanCreated: (planId: string) => void;
}

const GOAL_OPTIONS: { id: WorkoutGoal; label: string; desc: string; icon: any; iconColor: string }[] = [
  {
    id: 'fat_loss',
    label: 'Giảm Mỡ & Hạ Mỡ Máu',
    desc: 'Ưu tiên Cardio Zone 2 kết hợp kháng lực đa khớp tiêu hao calo',
    icon: Flame,
    iconColor: 'text-amber-500 bg-amber-500/10',
  },
  {
    id: 'heart_health',
    label: 'Tim Mạch & Ổn Định Huyết Áp',
    desc: 'Bài tập hiếu khí nhịp nhàng, kiểm soát nhịp thở, không nín thở',
    icon: HeartPulse,
    iconColor: 'text-rose-500 bg-rose-500/10',
  },
  {
    id: 'muscle_gain',
    label: 'Tăng Cơ & Thể Lực Săn Chắc',
    desc: 'Kháng lực tăng tiến, kích thích cơ bắp phát triển và săn chắc',
    icon: Dumbbell,
    iconColor: 'text-indigo-500 bg-indigo-500/10',
  },
  {
    id: 'mobility',
    label: 'Dưỡng Sinh & Linh Hoạt Khớp',
    desc: 'Tác động thấp, tăng cường dịch khớp, dãn cơ và bảo vệ cột sống',
    icon: Activity,
    iconColor: 'text-teal-500 bg-teal-500/10',
  },
  {
    id: 'general_fitness',
    label: 'Duy Trì Năng Lượng Toàn Diện',
    desc: 'Cân bằng giữa sức bền, độ dẻo dai và sảng khoái tinh thần',
    icon: Zap,
    iconColor: 'text-sky-500 bg-sky-500/10',
  },
];

const EQUIPMENT_OPTIONS: { id: EquipmentType; label: string; icon: any }[] = [
  { id: 'bodyweight', label: 'Tay không (Bodyweight)', icon: User },
  { id: 'dumbbells', label: 'Tạ đơn tại nhà', icon: Dumbbell },
  { id: 'resistance_bands', label: 'Dây kháng lực', icon: Repeat },
  { id: 'gym_machines', label: 'Phòng Gym máy móc', icon: Building2 },
  { id: 'outdoors', label: 'Ngoài trời (Đi bộ/Chạy)', icon: Trees },
];

export const GenerateWorkoutPlanModal: React.FC<GenerateWorkoutPlanModalProps> = ({
  isOpen,
  onClose,
  userId,
  metrics,
  checkupSessions,
  profile,
  onPlanCreated,
}) => {
  const [goal, setGoal] = useState<WorkoutGoal>(profile?.primaryGoal || 'fat_loss');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(profile?.fitnessLevel || 'beginner');
  const [equipment, setEquipment] = useState<EquipmentType[]>(
    profile?.equipment || ['bodyweight']
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    profile?.sessionDurationMinutes || 45
  );
  const [preferredDaysPerWeek, setPreferredDaysPerWeek] = useState<number>(
    profile?.preferredDaysPerWeek || 4
  );
  const [customNotes, setCustomNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleEquipment = (eq: EquipmentType) => {
    if (equipment.includes(eq)) {
      if (equipment.length > 1) {
        setEquipment(equipment.filter((item) => item !== eq));
      }
    } else {
      setEquipment([...equipment, eq]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/health/generate-workout-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          checkupSessions,
          profile,
          workoutGoal: goal,
          fitnessLevel,
          equipment,
          durationMinutes,
          preferredDaysPerWeek,
          limitations: customNotes ? [customNotes] : [],
        }),
      });

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Không thể tạo lịch tập từ AI');
      }

      const generatedData = result.data;
      const planId = `wplan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newPlan: WorkoutPlan = {
        id: planId,
        userId,
        title: generatedData.title || 'Lịch tập thể chất cá nhân hóa 7 ngày',
        goal,
        fitnessLevel,
        equipment,
        weeklyTargetCalories: generatedData.weeklyTargetCalories || 1600,
        days: generatedData.days || [],
        aiAnalysisSummary: generatedData.aiAnalysisSummary || '',
        safetyPrecautions: generatedData.safetyPrecautions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await WorkoutService.saveWorkoutPlan(newPlan);
      onPlanCreated(planId);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi lập lịch tập AI:', err);
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi gọi AI. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                1-Click Lập Lịch Tập Thể Chất AI
              </h3>
              <p className="text-[11px] text-slate-400 font-normal">
                Tối ưu theo chỉ số sinh hóa, huyết áp và điều kiện tập luyện
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Chọn Mục Tiêu Tập Luyện */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              1. Mục Tiêu Ưu Tiên
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal === opt.id;
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${opt.iconColor}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {opt.label}
                      </span>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Cấp Độ Thể Lực & Dụng Cụ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                2. Cấp Độ Hiện Tại
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'beginner', label: 'Mới tập' },
                  { id: 'intermediate', label: 'Vừa phải' },
                  { id: 'advanced', label: 'Nâng cao' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setFitnessLevel(lvl.id as FitnessLevel)}
                    className={`py-2 px-1 rounded-xl text-xs text-center transition cursor-pointer border ${
                      fitnessLevel === lvl.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                3. Thời Gian / Buổi
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-xl text-xs text-center transition cursor-pointer border ${
                      durationMinutes === mins
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium'
                    }`}
                  >
                    {mins}p
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Dụng Cụ Sẵn Có */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              4. Dụng Cụ Sẵn Có (Có thể chọn nhiều)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const isSelected = equipment.includes(eq.id);
                const EqIcon = eq.icon;
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleEquipment(eq.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      isSelected
                        ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-normal hover:border-slate-400'
                    }`}
                  >
                    <EqIcon className="w-3.5 h-3.5" />
                    <span>{eq.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ghi Chú Đặc Biệt / Vấn Đề Khớp */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              5. Lưu ý cơ thể / Vấn đề xương khớp (Tùy chọn):
            </label>
            <input
              type="text"
              placeholder="VD: Thoái hóa khớp gối nhẹ, đau thắt lưng khi ngồi lâu..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI Đang Thiết Kế Lịch Tập...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bắt Đầu Tạo Lịch Tập</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
