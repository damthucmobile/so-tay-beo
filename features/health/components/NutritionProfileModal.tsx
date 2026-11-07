// features/health/components/NutritionProfileModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Scale,
  Droplets,
  Flame,
  CheckCircle2,
  Calculator,
  Activity,
} from 'lucide-react';
import { NutritionProfile, NutritionGoal, DietaryPreference } from '../types';
import { NutritionService } from '../services/nutritionService';

interface NutritionProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialProfile: NutritionProfile | null;
  onProfileUpdated: (profile: NutritionProfile) => void;
}

export const NutritionProfileModal: React.FC<NutritionProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  initialProfile,
  onProfileUpdated,
}) => {
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.heightCm || 168);
  const [weightKg, setWeightKg] = useState<number>(initialProfile?.weightKg || 68);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(32);
  const [activityLevel, setActivityLevel] = useState<number>(1.375); // 1.2: Ít vận động, 1.375: Nhẹ, 1.55: Vừa
  const [primaryGoal, setPrimaryGoal] = useState<NutritionGoal>(initialProfile?.primaryGoal || 'maintain');
  const [preference, setPreference] = useState<DietaryPreference>(initialProfile?.preference || 'traditional_vn');
  const [targetCalories, setTargetCalories] = useState<number>(initialProfile?.targetCalories || 1800);
  const [targetWaterMl, setTargetWaterMl] = useState<number>(initialProfile?.targetWaterMl || 2500);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      if (initialProfile.heightCm) setHeightCm(initialProfile.heightCm);
      if (initialProfile.weightKg) setWeightKg(initialProfile.weightKg);
      if (initialProfile.targetCalories) setTargetCalories(initialProfile.targetCalories);
      if (initialProfile.targetWaterMl) setTargetWaterMl(initialProfile.targetWaterMl);
      if (initialProfile.primaryGoal) setPrimaryGoal(initialProfile.primaryGoal);
      if (initialProfile.preference) setPreference(initialProfile.preference);
    }
  }, [initialProfile]);

  // Tính toán BMI
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? parseFloat((weightKg / (heightM * heightM)).toFixed(1)) : 22;

  // Tính BMR (Mifflin-St Jeor)
  const bmr = Math.round(
    gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  );

  // Tính TDEE
  const tdee = Math.round(bmr * activityLevel);

  // Tự động tính nước khuyến nghị (40ml/kg cân nặng)
  const autoWater = Math.round((weightKg * 40) / 100) * 100;

  const handleApplyAutoCalculations = () => {
    setTargetCalories(primaryGoal === 'weight_loss' ? Math.max(1300, tdee - 400) : tdee);
    setTargetWaterMl(autoWater);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated: NutritionProfile = {
        userId,
        heightCm,
        weightKg,
        bmi,
        bmr,
        tdee,
        primaryGoal,
        preference,
        targetCalories,
        targetWaterMl,
        updatedAt: new Date().toISOString(),
      };

      await NutritionService.saveNutritionProfile(updated);
      onProfileUpdated(updated);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu profile dinh dưỡng:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Hồ Sơ Thể Trạng & Chỉ Số Năng Lượng
              </h3>
              <p className="text-[11px] text-slate-400">
                Thiết lập mục tiêu calo, lượng nước và chuyển hóa cơ bản
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Chỉ số thể chất cơ bản */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Chiều cao (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Cân nặng (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Tuổi</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Thẻ chỉ số tính toán tự động */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200/60 dark:border-teal-900/40 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">BMI Thể trạng</span>
              <span className="text-base font-black text-teal-700 dark:text-teal-300">{bmi}</span>
              <span className="text-[9px] text-slate-400 block">
                {bmi < 18.5 ? 'Gầy' : bmi < 23 ? 'Bình thường' : bmi < 25 ? 'Tiền béo phì' : 'Béo phì'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">BMR Cơ bản</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-200">{bmr}</span>
              <span className="text-[9px] text-slate-400 block">kcal/ngày</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">TDEE Tiêu hao</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{tdee}</span>
              <span className="text-[9px] text-slate-400 block">kcal/ngày</span>
            </div>
          </div>

          {/* Mức độ vận động */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Mức độ vận động thể chất:
            </label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value={1.2}>Ít vận động (chủ yếu ngồi bàn giấy, không tập thể thao)</option>
              <option value={1.375}>Vận động nhẹ (đi bộ, tập nhẹ 1-3 ngày/tuần)</option>
              <option value={1.55}>Vận động vừa (chạy bộ, tập gym 3-5 ngày/tuần)</option>
              <option value={1.725}>Vận động nhiều (cường độ cao 6-7 ngày/tuần)</option>
            </select>
          </div>

          {/* Nút tính toán nhanh */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApplyAutoCalculations}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Gợi ý tự động Calo & Lượng nước tối ưu</span>
            </button>
          </div>

          {/* Mục tiêu Calo & Nước uống hàng ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Mục tiêu Calo nạp vào (kcal/ngày):</span>
              </label>
              <input
                type="number"
                step="50"
                value={targetCalories}
                onChange={(e) => setTargetCalories(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 space-y-1">
              <label className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span>Mục tiêu Nước uống (ml/ngày):</span>
              </label>
              <input
                type="number"
                step="100"
                value={targetWaterMl}
                onChange={(e) => setTargetWaterMl(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Hồ Sơ Thể Trạng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
