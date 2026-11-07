// features/health/components/NutritionView.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Sliders,
  Droplets,
  Plus,
  Minus,
  Apple,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Edit3,
  Flame,
  Wheat,
  Fish,
  Droplet,
  HeartPulse,
  ShieldCheck,
  Salad,
  XCircle,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useHealthStore } from '../stores/useHealthStore';
import {
  MealPlan,
  MealItem,
  NutritionProfile,
  DailyWaterLog,
} from '../types';
import { NutritionService } from '../services/nutritionService';
import { HealthReminderService } from '../services/healthReminderService';
import { GenerateMealPlanModal } from './GenerateMealPlanModal';
import { NutritionProfileModal } from './NutritionProfileModal';
import { GroceryListModal } from './GroceryListModal';
import { EditMealItemModal } from './EditMealItemModal';
import { HealthReminderModal } from './HealthReminderModal';
import { EditMealPlanMetaModal } from './EditMealPlanMetaModal';

interface NutritionViewProps {
  onBackToOverview: () => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({ onBackToOverview }) => {
  const { user } = useAuth();
  const metrics = useHealthStore((state) => state.metrics);
  const checkupSessions = useHealthStore((state) => state.checkupSessions);

  // 0 = Thứ Hai, ..., 5 = Thứ Bảy, 6 = Chủ Nhật
  const getTodayDayIndex = (): number => {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1;
  };

  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(getTodayDayIndex);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Water tracking for today
  const todayStr = new Date().toISOString().split('T')[0];
  const [waterLog, setWaterLog] = useState<DailyWaterLog | null>(null);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroceryModalOpen, setIsGroceryModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // Edit Dish Modal state
  const [editingMealTarget, setEditingMealTarget] = useState<{
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    dayIndex: number;
    item: MealItem | null;
  } | null>(null);

  // Edit Plan Meta state
  const [isEditPlanMetaOpen, setIsEditPlanMetaOpen] = useState(false);

  // Subscriptions
  useEffect(() => {
    if (!user?.uid) return;

    // Load local cache first
    const cache = NutritionService.getLocalCache();
    if (cache.profile) setProfile(cache.profile);
    if (cache.mealPlans.length > 0) {
      setMealPlans(cache.mealPlans);
      setSelectedPlanId(cache.mealPlans[0].id);
    }
    if (cache.waterLogs[todayStr]) {
      setWaterLog(cache.waterLogs[todayStr]);
    }

    // Subscribe to Firestore
    const unsubProfile = NutritionService.subscribeNutritionProfile(user.uid, (p) => {
      setProfile(p);
    });

    const unsubPlans = NutritionService.subscribeMealPlans(user.uid, (plans) => {
      setMealPlans(plans);
      if (plans.length > 0 && (!selectedPlanId || !plans.some((p) => p.id === selectedPlanId))) {
        setSelectedPlanId(plans[0].id);
      }
    });

    const unsubWater = NutritionService.subscribeDailyWaterLog(user.uid, todayStr, (w) => {
      if (w) setWaterLog(w);
    });

    return () => {
      unsubProfile();
      unsubPlans();
      unsubWater();
    };
  }, [user?.uid, todayStr]);

  // Current active plan
  const activePlan = mealPlans.find((p) => p.id === selectedPlanId) || mealPlans[0] || null;

  // Current active day of meals
  const activeDay = activePlan?.days?.[activeDayIndex] || activePlan?.days?.[0] || null;

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

  // Thống kê các chỉ số sức khỏe quan trọng liên quan đến dinh dưỡng (loại trừ trùng lặp)
  const healthAlerts = React.useMemo(() => {
    const alerts: { id: string; label: string; value: string; rule: string; type: 'warning' | 'info' | 'normal' }[] = [];
    const seenCategories = new Set<string>();

    metrics.forEach((m) => {
      const code = (m.metricCode || '').toUpperCase();
      const val = parseFloat(String(m.value).replace(',', '.'));

      if (code === 'URIC_ACID' || m.metricName.toLowerCase().includes('uric')) {
        if (!seenCategories.has('URIC') && (m.status === 'high' || val > 420)) {
          seenCategories.add('URIC');
          alerts.push({
            id: 'URIC',
            label: 'Axit Uric Cao',
            value: `${m.value} ${m.unit || 'µmol/L'}`,
            rule: 'Chế độ ăn Low-Purine: Hạn chế thịt đỏ, hải sản vỏ cứng, bia rượu; ưu tiên đạm trắng & uống nhiều nước.',
            type: 'warning',
          });
        }
      } else if (code === 'CHOLESTEROL' || code === 'TRIGLYCERIDE' || code === 'LDL_C' || m.metricName.toLowerCase().includes('triglyceride') || m.metricName.toLowerCase().includes('cholesterol')) {
        const lipidKey = code.includes('TRIGLYCERIDE') || m.metricName.toLowerCase().includes('triglyceride') ? 'TRIGLYCERIDE' : 'CHOLESTEROL';
        if (!seenCategories.has(lipidKey) && m.status === 'high') {
          seenCategories.add(lipidKey);
          alerts.push({
            id: lipidKey,
            label: `Mỡ máu (${m.metricName})`,
            value: `${m.value} ${m.unit || 'mmol/L'}`,
            rule: 'Tăng cường chất xơ hòa tan (đậu bắp, mồng tơi, yến mạch) & Omega-3, hạn chế mỡ bão hòa và đồ chiên rán.',
            type: 'warning',
          });
        }
      } else if (code === 'GLUCOSE' || code === 'HBA1C' || m.metricName.toLowerCase().includes('đường huyết') || m.metricName.toLowerCase().includes('glucose')) {
        if (!seenCategories.has('GLUCOSE') && (m.status === 'high' || val > 6.1)) {
          seenCategories.add('GLUCOSE');
          alerts.push({
            id: 'GLUCOSE',
            label: 'Đường huyết cao',
            value: `${m.value} ${m.unit || 'mmol/L'}`,
            rule: 'Chế độ ăn Low-GI: Chuyển sang gạo lứt, khoai lang, rau xanh, tránh nước ngọt có ga và bánh kẹo.',
            type: 'warning',
          });
        }
      } else if (code === 'AST_GOT' || code === 'ALT_GPT' || code === 'GGT' || m.metricName.toLowerCase().includes('men gan')) {
        if (!seenCategories.has('LIVER') && m.status === 'high') {
          seenCategories.add('LIVER');
          alerts.push({
            id: 'LIVER',
            label: `Men gan tăng (${m.metricCode || m.metricName})`,
            value: `${m.value} ${m.unit || 'U/L'}`,
            rule: 'Hỗ trợ thải độc tế bào gan: Thức ăn luộc hấp nhẹ, trà atiso, bông cải xanh, tuyệt đối không dùng cồn.',
            type: 'warning',
          });
        }
      }
    });

    return alerts;
  }, [metrics]);

  // Xử lý tăng/giảm lượng nước uống
  const handleWaterDelta = async (deltaMl: number) => {
    if (!user?.uid) return;
    const target = profile?.targetWaterMl || activePlan?.targetWaterMl || 2500;
    try {
      const updated = await NutritionService.addWaterIntake(user.uid, todayStr, deltaMl, target);
      setWaterLog(updated);
      if (deltaMl > 0) {
        HealthReminderService.recordWaterIntakeAction();
      }
    } catch (err) {
      console.error('Lỗi cập nhật nước uống:', err);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thực đơn này không?')) return;
    try {
      await NutritionService.deleteMealPlan(planId);
    } catch (err) {
      console.error('Lỗi xóa thực đơn:', err);
    }
  };

  // Xử lý lưu hoặc cập nhật món ăn
  const handleSaveMealItem = async (savedItem: MealItem) => {
    if (!activePlan || !editingMealTarget) return;
    const { mealType, dayIndex, item } = editingMealTarget;

    const updatedDays = [...(activePlan.days || [])];
    const targetDay = { ...updatedDays[dayIndex] };

    const mealList = [...(targetDay[mealType] || [])];
    if (item) {
      // Sửa món hiện có
      const itemIdx = mealList.findIndex((m) => m.id === item.id);
      if (itemIdx !== -1) {
        mealList[itemIdx] = savedItem;
      }
    } else {
      // Thêm món mới
      mealList.push(savedItem);
    }

    targetDay[mealType] = mealList;

    // Tính lại tổng calo ngày
    const allDayMeals = [
      ...(targetDay.breakfast || []),
      ...(targetDay.lunch || []),
      ...(targetDay.dinner || []),
      ...(targetDay.snacks || []),
    ];
    targetDay.dayCalories = allDayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

    updatedDays[dayIndex] = targetDay;

    // Cập nhật lên Firestore & local state
    await NutritionService.updateMealPlan(activePlan.id, { days: updatedDays });
    setMealPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, days: updatedDays } : p))
    );
  };

  // Xử lý xóa món ăn
  const handleDeleteMealItem = async (itemId: string) => {
    if (!activePlan || !editingMealTarget) return;
    const { mealType, dayIndex } = editingMealTarget;

    const updatedDays = [...(activePlan.days || [])];
    const targetDay = { ...updatedDays[dayIndex] };

    targetDay[mealType] = (targetDay[mealType] || []).filter((m) => m.id !== itemId);

    // Tính lại tổng calo ngày
    const allDayMeals = [
      ...(targetDay.breakfast || []),
      ...(targetDay.lunch || []),
      ...(targetDay.dinner || []),
      ...(targetDay.snacks || []),
    ];
    targetDay.dayCalories = allDayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

    updatedDays[dayIndex] = targetDay;

    await NutritionService.updateMealPlan(activePlan.id, { days: updatedDays });
    setMealPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, days: updatedDays } : p))
    );
  };

  // Xử lý cập nhật thông tin chung thực đơn
  const handleUpdatePlanMeta = async (updates: Partial<MealPlan>) => {
    if (!activePlan) return;
    await NutritionService.updateMealPlan(activePlan.id, updates);
    setMealPlans((prev) =>
      prev.map((p) => (p.id === activePlan.id ? { ...p, ...updates } : p))
    );
  };

  const currentWater = waterLog?.amountMl || 0;
  const targetWater = waterLog?.targetMl || profile?.targetWaterMl || activePlan?.targetWaterMl || 2500;
  const waterPercent = Math.min(100, Math.round((currentWater / targetWater) * 100));

  // Render từng khối bữa ăn với Theme & Aesthetics chuẩn mobile
  const renderMealBlock = (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    title: string,
    time: string,
    icon: any,
    theme: {
      cardBg: string;
      headerText: string;
      iconBg: string;
      badgeBg: string;
      itemBorder: string;
      addBtn: string;
    },
    items?: MealItem[]
  ) => {
    const Icon = icon;
    return (
      <div
        className={`p-3.5 sm:p-4 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 transition-all ${theme.cardBg}`}
      >
        <div className="space-y-3">
          {/* Header Bữa Ăn */}
          <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${theme.iconBg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.headerText}`}>
                {title}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">{time}</span>
              <button
                type="button"
                onClick={() =>
                  setEditingMealTarget({
                    mealType,
                    dayIndex: activeDayIndex,
                    item: null,
                  })
                }
                className="w-6 h-6 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-emerald-500 hover:text-white text-slate-500 transition flex items-center justify-center shadow-xs cursor-pointer"
                title={`Thêm món vào ${title}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Danh sách món ăn */}
          <div className="space-y-2.5">
            {items && items.length > 0 ? (
              items.map((m, mIdx) => (
                <div
                  key={m.id || mIdx}
                  className={`group relative p-3 rounded-2xl border bg-white/90 dark:bg-slate-900/90 shadow-xs space-y-2 transition-all ${theme.itemBorder}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug min-w-0 flex-1 break-words">
                      {m.name}
                    </h5>

                    {/* Action buttons (Tối ưu cảm ứng mobile dễ bấm) */}
                    <div className="flex items-center gap-1 shrink-0 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingMealTarget({
                            mealType,
                            dayIndex: activeDayIndex,
                            item: m,
                          })
                        }
                        className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Chỉnh sửa món này"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa món "${m.name}" khỏi ${title}?`)) {
                            setEditingMealTarget({
                              mealType,
                              dayIndex: activeDayIndex,
                              item: m,
                            });
                            handleDeleteMealItem(m.id);
                          }
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                        title="Xóa món này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Badges: Khẩu phần, Calo, Macros */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {m.portion}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono font-bold ${theme.badgeBg}`}>
                      <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{m.calories} kcal</span>
                    </span>

                    {(m.carbs > 0 || m.protein > 0 || m.fat > 0) && (
                      <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                        {m.carbs > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            <Wheat className="w-2.5 h-2.5" /> {m.carbs}g
                          </span>
                        )}
                        {m.protein > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400">
                            <Fish className="w-2.5 h-2.5" /> {m.protein}g
                          </span>
                        )}
                        {m.fat > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-400">
                            <Droplet className="w-2.5 h-2.5" /> {m.fat}g
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lý do y khoa / Tác dụng dinh dưỡng */}
                  {m.healthBenefit && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-[10px] text-emerald-900 dark:text-emerald-200 border border-emerald-500/20 flex items-start gap-1.5 leading-snug">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m.healthBenefit}</span>
                    </div>
                  )}

                  {m.recipeTips && (
                    <p className="text-[10px] text-slate-400 italic">Mẹo: {m.recipeTips}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 space-y-1.5">
                <p className="text-[11px] text-slate-400 italic">Chưa có món ăn trong bữa này</p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingMealTarget({
                      mealType,
                      dayIndex: activeDayIndex,
                      item: null,
                    })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm món</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nút thêm món đáy card */}
        <button
          type="button"
          onClick={() =>
            setEditingMealTarget({
              mealType,
              dayIndex: activeDayIndex,
              item: null,
            })
          }
          className={`w-full py-2 rounded-xl border border-dashed text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${theme.addBtn}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm món vào {title}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="w-full space-y-5 sm:space-y-6 animate-fadeIn pb-24 sm:pb-16">
      {/* Top Navigation & Back */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Quay lại trang Sức Khỏe & Thể Chất</span>
          <span className="sm:hidden">Quay lại Sức Khỏe</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReminderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 transition cursor-pointer shadow-xs shrink-0"
            title="Cài đặt nhắc nhở uống nước & lịch tập"
          >
            <Bell className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="hidden sm:inline">Nhắc nhở</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition cursor-pointer shadow-xs shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="hidden sm:inline">Hồ sơ thể trạng & Calo</span>
            <span className="sm:hidden">Hồ sơ & Calo</span>
          </button>
        </div>
      </div>

      {/* Top Banner Dashboard (Tối ưu responsive Mobile) */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-900 p-4 sm:p-7 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <Apple className="w-3.5 h-3.5 shrink-0" />
              <span>Dinh Dưỡng Lâm Sàng & Thực Đơn</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Ăn Uống Chuẩn Y Khoa Theo Chỉ Số Sức Khỏe
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Tự động phân tích kết quả xét nghiệm để xây dựng thực đơn thuần Việt, cung cấp năng lượng tối ưu và hỗ trợ điều chỉnh các chỉ số bất thường.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            {activePlan && (
              <button
                type="button"
                onClick={() => setIsGroceryModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs hover:bg-emerald-100 transition cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Đi chợ</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer text-center"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">1-Click Lập Thực Đơn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row Widgets: Cảnh báo Y tế & Theo dõi Nước uống */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Widget 1 & 2: Căn cứ chỉ số sức khỏe */}
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <HeartPulse className="w-3.5 h-3.5" />
              </div>
              <span>Căn Cứ Y Khoa Từ Chỉ Số Sức Khỏe</span>
            </h4>
            <span className="text-[11px] font-medium text-slate-400">
              {healthAlerts.length > 0 ? `${healthAlerts.length} định hướng` : 'Ổn định'}
            </span>
          </div>

          {healthAlerts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {healthAlerts.map((item, idx) => (
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
                <span className="font-semibold block">Chỉ số sinh hóa của bạn đang trong ngưỡng ổn định!</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Thực đơn sẽ tập trung vào cân bằng Calo, duy trì thể trạng và tăng cường miễn dịch.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Widget 3: Theo dõi Nước Uống Hôm Nay (Tối ưu nút bấm cảm ứng) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-white dark:to-slate-900 border border-sky-200/80 dark:border-sky-900/40 space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <span>Nước Uống Hôm Nay</span>
            </h4>
            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
              {currentWater} / {targetWater} ml
            </span>
          </div>

          {/* Thanh tiến độ nước */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-medium">
              <span className="text-sky-700 dark:text-sky-300 font-semibold">Đạt {waterPercent}%</span>
              <span className="text-slate-400">Mục tiêu: {targetWater} ml</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleWaterDelta(-250)}
              disabled={currentWater <= 0}
              className="py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium text-[11px] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30 active:scale-95 shadow-xs"
            >
              <Minus className="w-3 h-3" /> 250ml
            </button>
            <button
              type="button"
              onClick={() => handleWaterDelta(250)}
              className="py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold text-[11px] border border-sky-200/80 dark:border-sky-800 transition flex items-center justify-center gap-1 cursor-pointer hover:bg-sky-100 active:scale-95 shadow-xs"
            >
              <Plus className="w-3 h-3" /> 1 Cốc
            </button>
            <button
              type="button"
              onClick={() => handleWaterDelta(500)}
              className="py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-[11px] shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-1 cursor-pointer hover:from-sky-600 hover:to-blue-700 active:scale-95"
            >
              <Plus className="w-3 h-3" /> 1 Chai
            </button>
          </div>
        </div>
      </div>

      {/* CHÍNH: KHỐI THỰC ĐƠN 7 NGÀY */}
      {activePlan ? (
        <div className="space-y-4 sm:space-y-5">
          {/* Menu Switcher & Plan Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Salad className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug break-words">
                    {activePlan.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                    {activePlan.targetCalories} kcal/ngày
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-tight font-normal">
                  Tỷ lệ dinh dưỡng: {activePlan.macroRatio?.carbsPct || 50}% Tinh bột • {activePlan.macroRatio?.proteinPct || 25}% Đạm • {activePlan.macroRatio?.fatPct || 25}% Chất béo
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto min-w-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
              {mealPlans.length > 1 && (
                <div className="flex-1 sm:flex-initial min-w-0 sm:w-64 max-w-full">
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer truncate"
                  >
                    {mealPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                {/* Sửa thông tin chung thực đơn */}
                <button
                  type="button"
                  onClick={() => setIsEditPlanMetaOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                  title="Sửa thông tin thực đơn"
                >
                  <Edit className="w-4 h-4" />
                </button>

                {/* Xóa thực đơn */}
                <button
                  type="button"
                  onClick={() => handleDeletePlan(activePlan.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                  title="Xóa thực đơn này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Nhận định y khoa tóm lược của AI */}
          {activePlan.aiAnalysisSummary && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nhận Định Lâm Sàng Từ Trợ Lý AI:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditPlanMetaOpen(true)}
                  className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
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

          {/* 7-DAY TABS (Thứ Hai ➔ Chủ Nhật - Tối ưu cuộn ngang Snap trên Mobile) */}
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
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/20 font-semibold'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 font-medium'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{day.dayName || `Ngày ${idx + 1}`}</span>
                  {isToday && (
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
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
                    {day.dayCalories}k
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chi tiết 4 bữa ăn với Theme & Aesthetics độc đáo */}
          {activeDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              {/* 1. Bữa Sáng (Sunrise Amber Theme) */}
              {renderMealBlock(
                'breakfast',
                'Bữa Sáng',
                '06:30 - 07:30',
                Coffee,
                {
                  cardBg:
                    'border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:to-slate-900',
                  headerText: 'text-amber-800 dark:text-amber-300',
                  iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                  badgeBg:
                    'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900',
                  itemBorder: 'border-amber-200/50 dark:border-amber-900/40 hover:border-amber-400',
                  addBtn: 'hover:border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50/50',
                },
                activeDay.breakfast
              )}

              {/* 2. Bữa Trưa (Fresh Noon Sun Theme) */}
              {renderMealBlock(
                'lunch',
                'Bữa Trưa',
                '11:30 - 12:30',
                Sun,
                {
                  cardBg:
                    'border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-white dark:to-slate-900',
                  headerText: 'text-emerald-800 dark:text-emerald-300',
                  iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                  badgeBg:
                    'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900',
                  itemBorder: 'border-emerald-200/50 dark:border-emerald-900/40 hover:border-emerald-400',
                  addBtn: 'hover:border-emerald-400 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/50',
                },
                activeDay.lunch
              )}

              {/* 3. Bữa Tối (Twilight Calm Theme) */}
              {renderMealBlock(
                'dinner',
                'Bữa Tối',
                '18:30 - 19:30',
                Moon,
                {
                  cardBg:
                    'border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-white dark:to-slate-900',
                  headerText: 'text-indigo-800 dark:text-indigo-300',
                  iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
                  badgeBg:
                    'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900',
                  itemBorder: 'border-indigo-200/50 dark:border-indigo-900/40 hover:border-indigo-400',
                  addBtn: 'hover:border-indigo-400 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50/50',
                },
                activeDay.dinner
              )}

              {/* 4. Bữa Phụ (Sweet Rose Theme) */}
              {renderMealBlock(
                'snacks',
                'Bữa Phụ / Trái Cây',
                '15:30',
                Cookie,
                {
                  cardBg:
                    'border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-white dark:to-slate-900',
                  headerText: 'text-rose-800 dark:text-rose-300',
                  iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                  badgeBg:
                    'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900',
                  itemBorder: 'border-rose-200/50 dark:border-rose-900/40 hover:border-rose-400',
                  addBtn: 'hover:border-rose-400 text-rose-700 dark:text-rose-400 hover:bg-rose-50/50',
                },
                activeDay.snacks
              )}
            </div>
          )}

          {/* ĐÈN GIAO THÔNG DINH DƯỠNG (DO's & DON'Ts) */}
          {activePlan.dosAndDonts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
              {/* NÊN ĂN */}
              <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Thực Phẩm Vàng Nên Ăn Thường Xuyên</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePlan.dosAndDonts.recommendedFoods?.map((food, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-2.5 py-1 rounded-xl text-xs font-normal bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>

              {/* NÊN TRÁNH */}
              <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Vùng Cấm / Thực Phẩm Tuyệt Đối Tránh</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePlan.dosAndDonts.avoidFoods?.map((food, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-2.5 py-1 rounded-xl text-xs font-normal bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4 bg-white dark:bg-slate-900">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <Apple className="w-7 sm:w-8 h-7 sm:h-8" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Bạn Chưa Có Kế Hoạch Thực Đơn Nào
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hãy để Trợ lý AI Dinh dưỡng quét các chỉ số xét nghiệm và thiết kế cho bạn một thực đơn 7 ngày thuần Việt, khoa học và cá nhân hóa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo Thực Đơn 7 Ngày Bằng AI Ngay</span>
          </button>
        </div>
      )}

      {/* MODALS */}
      {user?.uid && (
        <>
          <GenerateMealPlanModal
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

          <NutritionProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            userId={user.uid}
            initialProfile={profile}
            onProfileUpdated={(p) => setProfile(p)}
          />

          <GroceryListModal
            isOpen={isGroceryModalOpen}
            onClose={() => setIsGroceryModalOpen(false)}
            mealPlan={activePlan}
          />

          {/* Modal Sửa / Thêm món ăn */}
          {editingMealTarget && (
            <EditMealItemModal
              isOpen={!!editingMealTarget}
              onClose={() => setEditingMealTarget(null)}
              mealType={editingMealTarget.mealType}
              dayName={activeDay?.dayName || `Ngày ${editingMealTarget.dayIndex + 1}`}
              item={editingMealTarget.item}
              onSave={handleSaveMealItem}
              onDelete={handleDeleteMealItem}
            />
          )}

          {/* Modal Cài đặt nhắc nhở sức khỏe */}
          <HealthReminderModal
            isOpen={isReminderModalOpen}
            onClose={() => setIsReminderModalOpen(false)}
            userId={user.uid}
          />

          {/* Modal Sửa thông tin chung thực đơn */}
          <EditMealPlanMetaModal
            isOpen={isEditPlanMetaOpen}
            onClose={() => setIsEditPlanMetaOpen(false)}
            plan={activePlan}
            onSave={handleUpdatePlanMeta}
          />
        </>
      )}
    </div>
  );
};
