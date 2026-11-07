// features/health/HealthFeature.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Dumbbell,
  Apple,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FolderOpen,
  Plus,
  SlidersHorizontal,
  Activity,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/core/firebase';
import { useHealthStore, HealthSubTab } from './stores/useHealthStore';
import { BiometricsView } from './components/BiometricsView';
import { NutritionView } from './components/NutritionView';
import { AiMedicalImportModal } from './components/AiMedicalImportModal';

interface HealthFeatureProps {
  onNavigateTab: (tab: any) => void;
}

export const HealthFeature: React.FC<HealthFeatureProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { activeSubTab, setActiveSubTab, initStore, records, metrics } = useHealthStore();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = initStore(user.uid);
    return () => {
      unsub();
    };
  }, [user?.uid, initStore]);

  // Nếu đang ở màn con "Chỉ số sinh học"
  if (activeSubTab === 'biometrics') {
    return <BiometricsView onBackToOverview={() => setActiveSubTab('overview')} />;
  }

  // Nếu đang ở màn con "Dinh dưỡng & Thực đơn"
  if (activeSubTab === 'nutrition') {
    return <NutritionView onBackToOverview={() => setActiveSubTab('overview')} />;
  }

  // Màn con Workouts (Giữ cấu trúc sẵn sàng)
  if (activeSubTab === 'workouts') {
    return (
      <div className="w-full space-y-6">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang Sức Khỏe & Thể Chất</span>
        </button>

        <div className="p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tính năng Lịch Tập & Workout
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Module đang được hoàn thiện. Hãy trải nghiệm phân hệ <strong>Chỉ số sinh học</strong> hoặc <strong>Dinh dưỡng & Thực đơn</strong> trước.
          </p>
          <button
            type="button"
            onClick={() => setActiveSubTab('biometrics')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <span>Mở Bảng Chỉ Số Sinh Học</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHÍNH TỔNG QUAN (GIỮ NGUYÊN GIAO DIỆN HIỆN TẠI THEO YÊU CẦU CỦA USER)
  const suggestedCards = [
    {
      id: 'biometrics' as HealthSubTab,
      icon: HeartPulse,
      title: 'Chỉ Số Sinh Học',
      description: 'Biểu đồ theo dõi cân nặng, huyết áp, nhịp tim, xét nghiệm máu, nước tiểu & chẩn đoán hình ảnh.',
      tag: 'Sẵn sàng • AI Import',
      isReady: true,
    },
    {
      id: 'nutrition' as HealthSubTab,
      icon: Apple,
      title: 'Dinh Dưỡng & Thực Đơn',
      description: 'Thực đơn 7 ngày cá nhân hóa theo chỉ số xét nghiệm, theo dõi nước uống & calo mục tiêu.',
      tag: 'Sẵn sàng • AI Lập thực đơn',
      isReady: true,
    },
    {
      id: 'workouts' as HealthSubTab,
      icon: Dumbbell,
      title: 'Lịch Tập & Workout',
      description: 'Lên lịch tập gym, chạy bộ, cardio theo tuần và ghi nhận số calo tiêu hao.',
      tag: 'Gợi ý',
      isReady: false,
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Header (Tối ưu responsive trên Mobile & Desktop) */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900/90 p-4 sm:p-7 shadow-sm backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent pointer-events-none opacity-80" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0 shadow-sm">
              <HeartPulse className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  Sức Khỏe & Thể Chất
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500">• Không gian cá nhân</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Nhật Ký & Theo Dõi Sức Khỏe
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                Không gian ghi chép chỉ số thể chất (BMI, cân nặng, huyết áp), nhật ký tập luyện thể thao, chế độ dinh dưỡng và hồ sơ khám sức khỏe định kỳ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 pt-1 md:pt-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('biometrics')}
              className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Xem chỉ số sinh học</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Sub-features / Starter Cards (Giữ nguyên giao diện, click chuyển màn con) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Tính năng gợi ý</span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedCards.map((card) => {
            const CardIcon = card.icon;
            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveSubTab(card.id)}
                className={`group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md ${
                  card.isReady
                    ? 'border-rose-300/80 dark:border-rose-800/80 hover:border-rose-500 ring-2 ring-rose-500/10'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    {card.tag && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          card.isReady
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {card.tag}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                      <span>{card.title}</span>
                      {card.isReady && <Sparkles className="w-3.5 h-3.5 text-rose-500" />}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  <span>{card.isReady ? 'Mở bảng dữ liệu ngay' : 'Khám phá ngay'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State Showcase hoặc Danh sách chỉ số đã có */}
      {metrics.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shadow-inner">
            <FolderOpen className="w-8 h-8 opacity-80" />
          </div>

          <div className="max-w-md space-y-1.5">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg">
              Không gian đang sẵn sàng khởi tạo
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Không gian toàn diện giúp bạn ghi chép chỉ số thể chất (BMI, cân nặng, huyết áp), nhật ký tập luyện thể thao, kế hoạch ăn uống healthy và lịch nhắc khám sức khỏe định kỳ.
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic pt-1">
              💡 Sức khỏe là tài sản quý giá nhất. Hãy bắt đầu ghi chép ngày hôm nay!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubTab('biometrics')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95 bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Mở Bảng Chỉ Số Sinh Học</span>
          </button>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chỉ số sức khỏe đã ghi nhận ({metrics.length} chỉ số từ {records.length} hồ sơ)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('biometrics')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Xem chi tiết toàn bộ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* AI Scanner Modal */}
      <AiMedicalImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => setActiveSubTab('biometrics')}
      />
    </div>
  );
};
