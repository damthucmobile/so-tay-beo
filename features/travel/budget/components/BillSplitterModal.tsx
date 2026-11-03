// features/travel/budget/components/BillSplitterModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  ArrowRight,
  Check,
  Copy,
  DollarSign,
  Sparkles,
  PieChart,
  UserCheck,
} from 'lucide-react';
import { useBudgetStore } from '../../stores/useBudgetStore';
import { useTravelStore } from '../../stores/useTravelStore';

interface BillSplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillSplitterModal: React.FC<BillSplitterModalProps> = ({ isOpen, onClose }) => {
  const { trips } = useTravelStore();
  const { expenses, calculateSettlements } = useBudgetStore();

  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const settlements = calculateSettlements(selectedTripId);

  // Thống kê tổng tiền mỗi người đã chi và số dư
  const personStats: Record<string, { paid: number; shouldPay: number; net: number }> = {};

  const targetExpenses =
    selectedTripId === 'all'
      ? expenses
      : expenses.filter((e) => e.tripId === selectedTripId);

  targetExpenses.forEach((exp) => {
    const payer = exp.paidBy || 'Tôi';
    const participants =
      exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : [payer];
    const share = exp.amount / participants.length;

    if (!personStats[payer]) personStats[payer] = { paid: 0, shouldPay: 0, net: 0 };
    personStats[payer].paid += exp.amount;

    participants.forEach((p) => {
      if (!personStats[p]) personStats[p] = { paid: 0, shouldPay: 0, net: 0 };
      personStats[p].shouldPay += share;
    });
  });

  Object.keys(personStats).forEach((p) => {
    personStats[p].net = personStats[p].paid - personStats[p].shouldPay;
  });

  const handleCopySettlement = (item: { from: string; to: string; amount: number }, idx: number) => {
    const text = `${item.from} chuyển cho ${item.to}: ${Math.round(item.amount).toLocaleString('vi-VN')} VNĐ`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Chia Tiền Nhóm Bạn & Đối Soát Công Nợ
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động tính toán số tiền chuyển khoản tối ưu nhất (Bill Splitter)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trip Selector Filter */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn chuyến đi:</span>
          <select
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="flex-1 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Tất cả chi phí đã ghi nhận</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Individual Summary Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" />
            <span>Tổng kết theo từng thành viên ({Object.keys(personStats).length} người)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(personStats).map(([person, stat]) => {
              const isReceiving = stat.net > 100;
              const isPaying = stat.net < -100;

              return (
                <div
                  key={person}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                      {person}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isReceiving
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isPaying
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isReceiving
                        ? `Nhận lại: +${Math.round(stat.net).toLocaleString('vi-VN')} ₫`
                        : isPaying
                        ? `Cần trả: -${Math.abs(Math.round(stat.net)).toLocaleString('vi-VN')} ₫`
                        : 'Đã sòng phẳng'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>Đã chi: {Math.round(stat.paid).toLocaleString('vi-VN')} ₫</span>
                    <span>Phần chịu: {Math.round(stat.shouldPay).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optimal Transfer Recommendations */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Phương án chuyển khoản sòng phẳng (Tối ưu số lượt chuyển)</span>
          </h3>

          {settlements.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              Mọi người đã chi tiêu bằng nhau hoặc chưa có khoản nợ nào cần giải quyết!
            </div>
          ) : (
            <div className="space-y-2.5">
              {settlements.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-sm text-rose-600 dark:text-rose-400 truncate">
                      {item.from}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 truncate">
                      {item.to}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                      {Math.round(item.amount).toLocaleString('vi-VN')} ₫
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopySettlement(item, idx)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
                      title="Sao chép thông tin chuyển khoản"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 text-[11px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px]">Chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
