// features/health/components/GroceryListModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Check,
  Copy,
  CheckCheck,
  Salad,
  Fish,
  Wheat,
  Sparkles,
} from 'lucide-react';
import { MealPlan } from '../types';

interface GroceryListModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlan: MealPlan | null;
}

interface GroceryCategory {
  title: string;
  icon: any;
  items: string[];
}

export const GroceryListModal: React.FC<GroceryListModalProps> = ({
  isOpen,
  onClose,
  mealPlan,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Trích xuất danh sách thực phẩm từ 7 ngày thực đơn
  const categories: GroceryCategory[] = useMemo(() => {
    if (!mealPlan || !mealPlan.days) return [];

    const vegSet = new Set<string>();
    const proteinSet = new Set<string>();
    const carbSet = new Set<string>();
    const otherSet = new Set<string>();

    mealPlan.days.forEach((day) => {
      const allMeals = [
        ...(day.breakfast || []),
        ...(day.lunch || []),
        ...(day.dinner || []),
        ...(day.snacks || []),
      ];

      allMeals.forEach((m) => {
        const text = m.name.toLowerCase();

        // Phân loại đơn giản theo từ khóa ẩm thực Việt
        if (
          text.includes('rau') ||
          text.includes('cải') ||
          text.includes('ngót') ||
          text.includes('dưa') ||
          text.includes('cà') ||
          text.includes('bầu') ||
          text.includes('bí') ||
          text.includes('mồng tơi') ||
          text.includes('ổi') ||
          text.includes('chuối') ||
          text.includes('táo') ||
          text.includes('ớt chuông') ||
          text.includes('nấm')
        ) {
          vegSet.add(m.name);
        } else if (
          text.includes('cá') ||
          text.includes('gà') ||
          text.includes('thịt') ||
          text.includes('trứng') ||
          text.includes('đậu phụ') ||
          text.includes('tôm') ||
          text.includes('sữa chua')
        ) {
          proteinSet.add(m.name);
        } else if (
          text.includes('cơm') ||
          text.includes('yến mạch') ||
          text.includes('gạo lứt') ||
          text.includes('khoai') ||
          text.includes('bún') ||
          text.includes('miến') ||
          text.includes('phở')
        ) {
          carbSet.add(m.name);
        } else {
          otherSet.add(m.name);
        }
      });
    });

    return [
      {
        title: 'Rau xanh, Củ quả & Trái cây',
        icon: Salad,
        items: Array.from(vegSet),
      },
      {
        title: 'Đạm lành mạnh (Thịt nạc, Cá, Đậu phụ, Trứng)',
        icon: Fish,
        items: Array.from(proteinSet),
      },
      {
        title: 'Tinh bột chuyển hóa chậm (Gạo lứt, Yến mạch, Khoai)',
        icon: Wheat,
        items: Array.from(carbSet),
      },
      {
        title: 'Món ăn & Thực phẩm bổ sung khác',
        icon: Sparkles,
        items: Array.from(otherSet),
      },
    ].filter((c) => c.items.length > 0);
  }, [mealPlan]);

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleCopyText = () => {
    if (!mealPlan) return;
    const textLines: string[] = [
      `🛒 DANH SÁCH ĐI CHỢ CHO THỰC ĐƠN: ${mealPlan.title}`,
      `Mục tiêu: ${mealPlan.goal} • Calo: ${mealPlan.targetCalories} kcal/ngày\n`,
    ];

    categories.forEach((cat) => {
      textLines.push(`📌 ${cat.title}:`);
      cat.items.forEach((item) => {
        textLines.push(`  - [ ] ${item}`);
      });
      textLines.push('');
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !mealPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[88vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Danh Sách Đi Chợ Cho Tuần Này
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                Tổng hợp nguyên liệu từ {mealPlan.title}
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

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{cat.title} ({cat.items.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.items.map((item, itemIdx) => {
                    const isChecked = !!checkedItems[item];
                    return (
                      <button
                        key={itemIdx}
                        type="button"
                        onClick={() => toggleCheck(item)}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer text-xs ${
                          isChecked
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 text-slate-400 line-through'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium hover:border-emerald-500'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="truncate">{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyText}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                <span>Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Sao chép danh sách</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
