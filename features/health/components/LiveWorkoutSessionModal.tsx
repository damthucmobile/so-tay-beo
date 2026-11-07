// features/health/components/LiveWorkoutSessionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Check,
  Flame,
  Clock,
  Award,
  Sparkles,
  Target,
  Dumbbell,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { DailyWorkoutPlan, DailyWorkoutLog, ExerciseItem } from '../types';
import { WorkoutService } from '../services/workoutService';

interface LiveWorkoutSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  planId: string;
  dayIndex: number;
  dayPlan: DailyWorkoutPlan;
  onSessionCompleted?: () => void;
}

export const LiveWorkoutSessionModal: React.FC<LiveWorkoutSessionModalProps> = ({
  isOpen,
  onClose,
  userId,
  planId,
  dayIndex,
  dayPlan,
  onSessionCompleted,
}) => {
  // Trạng thái hoàn thành bài tập (exercise id -> boolean)
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Đồng hồ đếm ngược nghỉ ngơi (Rest Timer)
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMaxSeconds, setTimerMaxSeconds] = useState<number>(60);

  // Thời gian tập thực tế (bấm giờ tổng)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Trạng thái hoàn thành
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showFinishedSuccess, setShowFinishedSuccess] = useState<boolean>(false);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isOpen) {
      // Đếm giờ tổng buổi tập
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  // Rest Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && restSecondsLeft > 0) {
      timer = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restSecondsLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, restSecondsLeft]);

  if (!isOpen) return null;

  const toggleExerciseCheck = (exId: string, defaultRest: number = 60) => {
    const isNowChecked = !completedMap[exId];
    setCompletedMap((prev) => ({ ...prev, [exId]: isNowChecked }));

    if (isNowChecked && defaultRest > 0) {
      // Kích hoạt đồng hồ nghỉ
      setTimerMaxSeconds(defaultRest);
      setRestSecondsLeft(defaultRest);
      setIsTimerRunning(true);
    }
  };

  const startRestTimer = (seconds: number) => {
    setTimerMaxSeconds(seconds);
    setRestSecondsLeft(seconds);
    setIsTimerRunning(true);
  };

  const handleFinishWorkout = async () => {
    setIsSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const completedList = Object.keys(completedMap).filter((k) => completedMap[k]);
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const caloriesBurned = Math.round(
      (dayPlan.estimatedCalories || 250) * Math.max(0.3, completedList.length / Math.max(1, dayPlan.exercises.length))
    );

    const log: DailyWorkoutLog = {
      id: `wlog_${userId}_${todayStr}`,
      userId,
      date: todayStr,
      planId,
      dayIndex,
      durationMinutes: durationMins,
      caloriesBurned,
      completedExercises: completedList,
      rpe: 7,
      updatedAt: new Date().toISOString(),
    };

    try {
      await WorkoutService.saveDailyWorkoutLog(log);
      setShowFinishedSuccess(true);
      setTimeout(() => {
        if (onSessionCompleted) onSessionCompleted();
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Lỗi lưu nhật ký buổi tập:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalCompleted = Object.values(completedMap).filter(Boolean).length;
  const totalExercises = dayPlan.exercises?.length || 0;
  const progressPercent = totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                LIVE WORKOUT
              </span>
              <span className="text-xs font-mono font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-500" />
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate mt-0.5">
              {dayPlan.sessionTitle || dayPlan.dayName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Rest Timer Widget (Đồng hồ đếm ngược nghỉ ngơi) */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 flex items-center justify-center font-mono font-bold text-xs sm:text-sm text-rose-400 shrink-0">
              {restSecondsLeft > 0 ? restSecondsLeft : '00'}s
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-300 block truncate">
                {isTimerRunning ? 'Đang đếm thời gian nghỉ...' : 'Nghỉ ngơi giữa hiệp'}
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5">
                {[30, 45, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => startRestTimer(sec)}
                    className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
                  >
                    +{sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              disabled={restSecondsLeft === 0}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white disabled:opacity-30 cursor-pointer"
              title={isTimerRunning ? 'Tạm dừng' : 'Tiếp tục'}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTimerRunning(false);
                setRestSecondsLeft(0);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-300 cursor-pointer"
              title="Đặt lại đồng hồ"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Exercise Checklist Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Tiến độ bài tập:</span>
            <span>
              {totalCompleted} / {totalExercises} động tác ({progressPercent}%)
            </span>
          </div>

          {dayPlan.exercises?.map((ex, idx) => {
            const isDone = !!completedMap[ex.id];
            return (
              <div
                key={ex.id || idx}
                onClick={() => toggleExerciseCheck(ex.id, ex.restSeconds || 60)}
                className={`p-3.5 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                  isDone
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 opacity-90'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-rose-300 shadow-xs'
                }`}
              >
                {/* Checkbox Icon */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5
                      className={`text-xs font-semibold leading-snug ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {ex.name}
                    </h5>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 font-medium">
                      {ex.sets} hiệp {ex.reps ? `× ${ex.reps} lần` : ex.durationSeconds ? `× ${Math.round(ex.durationSeconds / 60)}p` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-normal">
                      <Target className="w-3 h-3 text-slate-500" />
                      <span>{ex.targetMuscle}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-normal">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>Nghỉ {ex.restSeconds || 60}s</span>
                    </span>
                    {ex.weightKg ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-normal">
                        <Dumbbell className="w-3 h-3 text-amber-500" />
                        <span>{ex.weightKg}kg</span>
                      </span>
                    ) : null}
                  </div>

                  {ex.formCues && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-snug pt-0.5 flex items-start gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{ex.formCues}</span>
                    </p>
                  )}

                  {ex.medicalNotice && (
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-normal">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{ex.medicalNotice}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ~{dayPlan.estimatedCalories || 250} kcal
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinishWorkout}
            disabled={isSubmitting || showFinishedSuccess}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {showFinishedSuccess ? (
              <>
                <Award className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>Hoàn Thành Xuất Sắc!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Hoàn Thành Buổi Tập</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
