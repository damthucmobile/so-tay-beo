// features/health/components/ManualMetricModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Plus, HeartPulse, Check, AlertCircle } from 'lucide-react';
import { MEDICAL_METRIC_DEFINITIONS, evaluateMetricStatus } from '../constants/medicalMetrics';
import { HealthMetricValue, HealthCategory } from '../types';
import { useAuth } from '@/core/firebase';
import { useHealthStore } from '../stores/useHealthStore';

interface ManualMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCode?: string;
  defaultCheckupId?: string;
}

export const ManualMetricModal: React.FC<ManualMetricModalProps> = ({
  isOpen,
  onClose,
  defaultCode = 'WEIGHT',
  defaultCheckupId,
}) => {
  const { user } = useAuth();
  const addMetric = useHealthStore((state) => state.addMetric);
  const checkupSessions = useHealthStore((state) => state.checkupSessions);

  const [selectedCode, setSelectedCode] = useState<string>(defaultCode);
  const [selectedCheckupSessionId, setSelectedCheckupSessionId] = useState<string>(
    defaultCheckupId && defaultCheckupId !== 'all' ? defaultCheckupId : 'none'
  );
  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [hospitalName, setHospitalName] = useState<string>('Tự đo tại nhà');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Cập nhật khi defaultCheckupId thay đổi
  React.useEffect(() => {
    if (defaultCheckupId && defaultCheckupId !== 'all') {
      setSelectedCheckupSessionId(defaultCheckupId);
      const found = checkupSessions.find((s) => s.id === defaultCheckupId);
      if (found) {
        if (found.hospitalName) setHospitalName(found.hospitalName);
        if (found.checkupDate) setDate(found.checkupDate);
      }
    }
  }, [defaultCheckupId, checkupSessions]);

  if (!isOpen) return null;

  const currentDef = MEDICAL_METRIC_DEFINITIONS.find((d) => d.code === selectedCode) || MEDICAL_METRIC_DEFINITIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setErrorMsg('Vui lòng nhập giá trị chỉ số.');
      return;
    }
    if (!user?.uid) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const numVal = parseFloat(value.replace(',', '.'));
      const status = evaluateMetricStatus(
        isNaN(numVal) ? value : numVal,
        currentDef.defaultMin,
        currentDef.defaultMax,
        currentDef.referenceText
      );

      const metricPayload: Omit<HealthMetricValue, 'id'> = {
        metricCode: currentDef.code,
        metricName: currentDef.name,
        category: currentDef.category,
        value: value.trim(),
        numericValue: isNaN(numVal) ? undefined : numVal,
        unit: currentDef.defaultUnit,
        referenceRange: currentDef.referenceText,
        minNormal: currentDef.defaultMin,
        maxNormal: currentDef.defaultMax,
        status,
        measuredAt: date,
        notes: notes.trim() || undefined,
        hospitalName: hospitalName.trim() || undefined,
        checkupSessionId: selectedCheckupSessionId !== 'none' ? selectedCheckupSessionId : undefined,
      };

      await addMetric(user.uid, metricPayload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể lưu chỉ số.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ghi Nhận Chỉ Số Sức Khỏe
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thêm chỉ số đo hàng ngày hoặc kết quả khám
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Gán vào Đợt Khám Sức Khỏe */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Gán vào Đợt Khám Sức Khỏe:
            </label>
            <select
              value={selectedCheckupSessionId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedCheckupSessionId(newId);
                if (newId !== 'none') {
                  const found = checkupSessions.find((s) => s.id === newId);
                  if (found) {
                    if (found.hospitalName) setHospitalName(found.hospitalName);
                    if (found.checkupDate) setDate(found.checkupDate);
                  }
                } else {
                  setHospitalName('Tự đo tại nhà');
                }
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="none">Không thuộc đợt khám cụ thể (Tự đo tại nhà / Hàng ngày)</option>
              {checkupSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.checkupDate} • {s.hospitalName})
                </option>
              ))}
            </select>
          </div>

          {/* Chọn loại chỉ số */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Chọn chỉ số sức khỏe:
            </label>
            <select
              value={selectedCode}
              onChange={(e) => {
                setSelectedCode(e.target.value);
                setValue('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <optgroup label="Chỉ số sinh tồn & Thể chất">
                {MEDICAL_METRIC_DEFINITIONS.filter((d) => d.category === 'vitals').map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.defaultUnit})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sinh hóa máu (Gan, Thận, Mỡ, Đường)">
                {MEDICAL_METRIC_DEFINITIONS.filter((d) => d.category === 'biochemistry').map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.defaultUnit})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Huyết học & Công thức máu (CBC)">
                {MEDICAL_METRIC_DEFINITIONS.filter((d) => d.category === 'blood_count').map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.defaultUnit})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Nước tiểu 10 thông số">
                {MEDICAL_METRIC_DEFINITIONS.filter((d) => d.category === 'urinalysis').map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Giá trị đo & Đơn vị */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Giá trị kết quả:
              </label>
              <input
                type="text"
                placeholder={currentDef.code === 'BP_SYS' ? '120/80' : 'Ví dụ: 65.5'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Đơn vị:
              </label>
              <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-center">
                {currentDef.defaultUnit || '—'}
              </div>
            </div>
          </div>

          {/* Khoảng tham chiếu */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Mức chuẩn tham chiếu:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {currentDef.referenceText}
            </span>
          </div>

          {/* Ngày đo & Địa điểm */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Ngày đo:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Nơi đo / Cơ sở:
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Tự đo / Tên bệnh viện"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              Ghi chú thêm:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đo buổi sáng sau khi ngủ dậy, lúc bụng đói..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition active:scale-95 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu chỉ số'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
