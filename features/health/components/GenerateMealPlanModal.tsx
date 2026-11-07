// features/health/components/GenerateMealPlanModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  HeartPulse,
  Apple,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Salad,
  Info,
  Droplets,
  Activity,
} from 'lucide-react';
import {
  HealthMetricValue,
  HealthCheckupSession,
  NutritionGoal,
  DietaryPreference,
  MealPlan,
  NutritionProfile,
} from '../types';
import { NutritionService } from '../services/nutritionService';

interface GenerateMealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  metrics: HealthMetricValue[];
  checkupSessions: HealthCheckupSession[];
  profile: NutritionProfile | null;
  onPlanCreated: (planId: string) => void;
}

const GOAL_OPTIONS: { id: NutritionGoal; label: string; desc: string; icon: any; iconColor: string }[] = [
  {
    id: 'lower_uric_acid',
    label: 'Hạ Axit Uric / Phòng ngừa Gout',
    desc: 'Ưu tiên đạm trắng (ức gà, cá quả), nhiều rau xanh, hạn chế purin và thịt đỏ',
    icon: Droplets,
    iconColor: 'text-sky-500 bg-sky-500/10',
  },
  {
    id: 'lower_cholesterol',
    label: 'Hạ Mỡ Máu (Cholesterol & Triglyceride)',
    desc: 'Bổ sung omega-3, chất xơ hòa tan, triệt tiêu mỡ bão hòa và đồ chiên rán',
    icon: HeartPulse,
    iconColor: 'text-rose-500 bg-rose-500/10',
  },
  {
    id: 'lower_glucose',
    label: 'Kiểm Soát Đường Huyết (Low-GI)',
    desc: 'Tinh bột chuyển hóa chậm (gạo lứt, yến mạch), không đường tinh luyện',
    icon: Activity,
    iconColor: 'text-indigo-500 bg-indigo-500/10',
  },
  {
    id: 'liver_detox',
    label: 'Thanh Lọc Gan & Hạ Men Gan',
    desc: 'Giảm tải cho gan, giàu chất chống oxy hóa (bông cải xanh, atiso, trà xanh)',
    icon: ShieldCheck,
    iconColor: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    id: 'weight_loss',
    label: 'Giảm Cân & Thon Gọn Lành Mạnh',
    desc: 'Thâm hụt 300-500 kcal, tăng cường đạm nạc và rau củ tạo cảm giác no lâu',
    icon: Flame,
    iconColor: 'text-amber-500 bg-amber-500/10',
  },
  {
    id: 'heart_health',
    label: 'Tốt Cho Tim Mạch & Huyết Áp (DASH)',
    desc: 'Chế độ ăn giảm muối (<5g/ngày), giàu Kali và Magie từ rau củ tự nhiên',
    icon: HeartPulse,
    iconColor: 'text-red-500 bg-red-500/10',
  },
  {
    id: 'maintain',
    label: 'Duy Trì Vóc Dáng & Sức Khỏe Toàn Diện',
    desc: 'Cân bằng vi chất, năng lượng vừa đủ và tăng cường đề kháng',
    icon: Apple,
    iconColor: 'text-teal-500 bg-teal-500/10',
  },
];

const PREFERENCE_OPTIONS: { id: DietaryPreference; label: string; desc: string }[] = [
  {
    id: 'traditional_vn',
    label: 'Cơm Gia Đình Việt Nam',
    desc: 'Món quen thuộc: cơm, canh rau, món luộc/hấp/kho nhạt, dễ nấu',
  },
  {
    id: 'eat_clean',
    label: 'Eat Clean Hiện Đại',
    desc: 'Thực phẩm nguyên bản, hấp luộc, ít dầu mỡ, nhiều xà lách & hạt',
  },
  {
    id: 'low_carb',
    label: 'Low-Carb / Giảm Tinh Bột',
    desc: 'Giảm lượng cơm/bánh, tăng rau xanh và đạm lành mạnh',
  },
  {
    id: 'vegetarian',
    label: 'Ăn Chay Linh Hoạt (Rau & Đậu)',
    desc: 'Thực đơn thuần thực vật, đậu phụ, nấm, hạt dinh dưỡng',
  },
];

export const GenerateMealPlanModal: React.FC<GenerateMealPlanModalProps> = ({
  isOpen,
  onClose,
  userId,
  metrics,
  checkupSessions,
  profile,
  onPlanCreated,
}) => {
  const [selectedCheckupId, setSelectedCheckupId] = useState<string>('all');
  const [goal, setGoal] = useState<NutritionGoal>('maintain');
  const [preference, setPreference] = useState<DietaryPreference>('traditional_vn');
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [excludedFoodsText, setExcludedFoodsText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Tự động nhận diện gợi ý mục tiêu dựa vào các chỉ số bất thường
  useEffect(() => {
    if (!isOpen) return;

    // Tìm các chỉ số cảnh báo cao
    const hasHighUric = metrics.some(
      (m) =>
        (m.metricCode === 'URIC_ACID' || m.metricName.toLowerCase().includes('uric')) &&
        (m.status === 'high' || m.status === 'abnormal' || (m.numericValue && m.numericValue > 420))
    );
    const hasHighCholesterol = metrics.some(
      (m) =>
        (m.metricCode === 'CHOLESTEROL' || m.metricCode === 'TRIGLYCERIDE' || m.metricCode === 'LDL_C') &&
        (m.status === 'high' || m.status === 'abnormal')
    );
    const hasHighGlucose = metrics.some(
      (m) =>
        (m.metricCode === 'GLUCOSE' || m.metricCode === 'HBA1C') &&
        (m.status === 'high' || m.status === 'abnormal' || (m.numericValue && m.numericValue > 6.1))
    );
    const hasHighLiver = metrics.some(
      (m) =>
        (m.metricCode === 'AST_GOT' || m.metricCode === 'ALT_GPT' || m.metricCode === 'GGT') &&
        (m.status === 'high' || m.status === 'abnormal')
    );

    if (hasHighUric) {
      setGoal('lower_uric_acid');
    } else if (hasHighCholesterol) {
      setGoal('lower_cholesterol');
    } else if (hasHighGlucose) {
      setGoal('lower_glucose');
    } else if (hasHighLiver) {
      setGoal('liver_detox');
    } else if (profile?.primaryGoal) {
      setGoal(profile.primaryGoal);
    }
  }, [isOpen, metrics, profile]);

  if (!isOpen) return null;

  // Lọc chỉ số theo đợt khám đã chọn
  const filteredMetrics =
    selectedCheckupId === 'all'
      ? metrics
      : metrics.filter((m) => m.checkupSessionId === selectedCheckupId);

  // Danh sách các chỉ số vượt ngưỡng cảnh báo
  const abnormalMetrics = filteredMetrics.filter(
    (m) => m.status === 'high' || m.status === 'low' || m.status === 'abnormal'
  );

  const selectedSession = checkupSessions.find((s) => s.id === selectedCheckupId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const excludedFoods = excludedFoodsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        metrics: filteredMetrics,
        checkupTitle: selectedSession ? `${selectedSession.title} (${selectedSession.hospitalName})` : '',
        clinicalConclusion: selectedSession?.clinicalConclusion || '',
        goal,
        preference,
        allergies,
        excludedFoods,
        userStats: {
          heightCm: profile?.heightCm,
          weightKg: profile?.weightKg,
          bmi: profile?.bmi,
        },
      };

      const res = await fetch('/api/health/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'AI không thể tạo thực đơn vào lúc này.');
      }

      // Lưu thực đơn mới vào Firestore
      const planId = await NutritionService.saveMealPlan(userId, {
        title: json.data.title || `Thực đơn 7 ngày cá nhân hóa`,
        checkupSessionId: selectedCheckupId !== 'all' ? selectedCheckupId : undefined,
        goal,
        preference,
        targetCalories: json.data.targetCalories || 1800,
        targetWaterMl: json.data.targetWaterMl || 2200,
        macroRatio: json.data.macroRatio || { carbsPct: 50, proteinPct: 25, fatPct: 25 },
        days: json.data.days || [],
        dosAndDonts: json.data.dosAndDonts || {
          recommendedFoods: [],
          avoidFoods: [],
          medicalAdvice: [],
        },
        aiAnalysisSummary: json.data.aiAnalysisSummary || '',
      });

      onPlanCreated(planId);
      onClose();
    } catch (err: any) {
      console.error('Lỗi sinh thực đơn:', err);
      setErrorMsg(err?.message || 'Có lỗi khi kết nối với Trợ lý AI Dinh dưỡng.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                1-Click Lập Thực Đơn Cá Nhân Hóa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Phân tích chỉ số xét nghiệm thực tế và chế độ ăn y khoa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Chọn Đợt khám làm căn cứ y khoa */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Nguồn dữ liệu y tế căn cứ:</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {abnormalMetrics.length > 0 ? `${abnormalMetrics.length} chỉ số cần chú ý` : 'Thể trạng bình thường'}
              </span>
            </label>

            <select
              value={selectedCheckupId}
              onChange={(e) => setSelectedCheckupId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Toàn bộ chỉ số xét nghiệm gần nhất ({metrics.length} chỉ số)</option>
              {checkupSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.checkupDate} • {s.hospitalName})
                </option>
              ))}
            </select>

            {/* Thẻ hiển thị các chỉ số báo động được AI nhận diện */}
            {abnormalMetrics.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>AI đã phát hiện {abnormalMetrics.length} chỉ số bất thường để tinh chỉnh dinh dưỡng:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {abnormalMetrics.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/80 shadow-xs"
                    >
                      <span>{m.metricName}:</span>
                      <span className="text-rose-600 dark:text-rose-400 font-black">{m.value} {m.unit}</span>
                      <span className="text-[10px] text-slate-400">({m.status === 'high' ? 'Cao' : 'Thấp'})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Chọn Mục tiêu Dinh dưỡng cốt lõi */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Mục tiêu dinh dưỡng ưu tiên:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${opt.iconColor}`}>
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Phong cách ẩm thực */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Salad className="w-3.5 h-3.5 text-teal-500" />
              <span>Phong cách ẩm thực mong muốn:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PREFERENCE_OPTIONS.map((pref) => {
                const isSelected = preference === pref.id;
                return (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => setPreference(pref.id)}
                    className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {pref.label}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {pref.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Dị ứng & Món không ăn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Dị ứng thực phẩm (nếu có):
              </label>
              <input
                type="text"
                placeholder="VD: Tôm cua, đậu phộng, sữa bò..."
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Món không muốn ăn:
              </label>
              <input
                type="text"
                placeholder="VD: Mướp đắng, hành sống, thịt mỡ..."
                value={excludedFoodsText}
                onChange={(e) => setExcludedFoodsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Thực đơn được tối ưu khoa học theo tiêu chuẩn dinh dưỡng Việt Nam</span>
          </div>

          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50 text-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Đang tạo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Tạo Thực Đơn AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
