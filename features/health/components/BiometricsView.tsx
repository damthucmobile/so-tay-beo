// features/health/components/BiometricsView.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HeartPulse,
  Sparkles,
  Upload,
  Plus,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Activity,
  Trash2,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Droplet,
  ShieldCheck,
  Check,
  Zap,
  Award,
  Eye,
  Smile,
  Ear,
  Heart,
  Shield,
  ArrowUp,
  ArrowDown,
  Edit3,
} from 'lucide-react';
import { HealthCategory, HealthMetricValue, HealthRecordDocument, HealthCheckupSession } from '../types';
import { useHealthStore } from '../stores/useHealthStore';
import { useAuth } from '@/core/firebase';
import { imagingFindingToMetric } from '../services/healthService';
import { HealthService, parseDateToTimestamp } from '../services/healthService';
import { AiMedicalImportModal } from './AiMedicalImportModal';
import { ManualMetricModal } from './ManualMetricModal';
import { CreateCheckupModal } from './CreateCheckupModal';
import { EditCheckupModal } from './EditCheckupModal';
import { MEDICAL_METRIC_DEFINITIONS } from '../constants/medicalMetrics';

interface BiometricsViewProps {
  onBackToOverview?: () => void;
}

export const BiometricsView: React.FC<BiometricsViewProps> = ({ onBackToOverview }) => {
  const {
    records,
    metrics,
    checkupSessions,
    selectedCheckupId,
    setSelectedCheckupId,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    deleteRecord,
    deleteMetric,
    deleteCheckup,
  } = useHealthStore();

  const { user } = useAuth();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);
  const [isEditCheckupModalOpen, setIsEditCheckupModalOpen] = useState(false);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<HealthRecordDocument | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Danh sách đợt khám luôn sắp xếp ngày khám gần nhất (mới nhất) lên đầu tiên
  const sortedCheckupSessions = useMemo(() => {
    return [...checkupSessions].sort((a, b) => {
      const timeA = parseDateToTimestamp(a.checkupDate);
      const timeB = parseDateToTimestamp(b.checkupDate);
      if (timeB !== timeA) return timeB - timeA;
      return parseDateToTimestamp(b.createdAt) - parseDateToTimestamp(a.createdAt);
    });
  }, [checkupSessions]);

  // Tìm đợt khám hiện tại được chọn (nếu có)
  const currentCheckup = useMemo(() => {
    if (selectedCheckupId === 'all') return null;
    return sortedCheckupSessions.find((s) => s.id === selectedCheckupId) || null;
  }, [sortedCheckupSessions, selectedCheckupId]);

  // Trợ giúp lấy checkupSessionId của chỉ số
  const getMetricCheckupId = (m: HealthMetricValue): string | undefined => {
    if (m.checkupSessionId) return m.checkupSessionId;
    if (m.sourceDocId) {
      const rec = records.find((r) => r.id === m.sourceDocId);
      if (rec?.checkupSessionId) return rec.checkupSessionId;
    }
    return undefined;
  };

  // Map ID đợt khám -> Tên đợt khám & bệnh viện để hiển thị trên bảng
  const checkupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    sortedCheckupSessions.forEach((s) => {
      map.set(s.id, `${s.title} (${s.hospitalName})`);
    });
    return map;
  }, [sortedCheckupSessions]);

  // Lọc danh sách chỉ số theo đúng đợt khám đang chọn (kèm tự động tổng hợp CĐHA & Thăm dò từ records)
  const metricsInCurrentSession = useMemo(() => {
    const baseMetrics =
      selectedCheckupId === 'all'
        ? metrics
        : metrics.filter((m) => {
            const sessId = getMetricCheckupId(m);
            return sessId === selectedCheckupId;
          });

    // Tự động tổng hợp kết quả CĐHA & Thăm dò chức năng từ records (phục vụ dữ liệu cũ hoặc khi chưa lưu sang health_metrics)
    const recordsInScope =
      selectedCheckupId === 'all'
        ? records
        : records.filter((r) => r.checkupSessionId === selectedCheckupId);

    const syntheticImagingMetrics: HealthMetricValue[] = [];
    recordsInScope.forEach((r) => {
      if (r.imagingFindings && Array.isArray(r.imagingFindings)) {
        r.imagingFindings.forEach((f) => {
          const serviceName = (f.serviceName || '').trim();
          const exists = baseMetrics.some(
            (m) =>
              m.category === 'imaging_functional' &&
              (m.sourceDocId === r.id ||
                (m.metricName || '').toLowerCase() === serviceName.toLowerCase() ||
                m.value === f.conclusion)
          );
          if (!exists && serviceName) {
            syntheticImagingMetrics.push(
              imagingFindingToMetric(f, {
                recordId: r.id,
                checkupSessionId: r.checkupSessionId,
                hospitalName: r.hospitalName,
                doctorName: r.doctorName,
                measuredAt: r.recordDate,
              })
            );
          }
        });
      }
    });

    return [...baseMetrics, ...syntheticImagingMetrics];
  }, [metrics, selectedCheckupId, records]);

  // Nhóm các chỉ số theo code để lấy kết quả mới nhất cho mỗi chỉ số trong phạm vi đợt khám
  const latestMetricsMap = useMemo(() => {
    const map = new Map<string, HealthMetricValue>();
    metricsInCurrentSession.forEach((m) => {
      const key = m.metricCode || m.metricName;
      if (!map.has(key)) {
        map.set(key, m);
      }
    });
    return map;
  }, [metricsInCurrentSession]);

  const latestMetricsList = useMemo(() => {
    return Array.from(latestMetricsMap.values());
  }, [latestMetricsMap]);

  // Danh sách hồ sơ khám thuộc đợt khám đang chọn
  const filteredRecords = useMemo(() => {
    if (selectedCheckupId === 'all') return records;
    return records.filter((r) => r.checkupSessionId === selectedCheckupId);
  }, [records, selectedCheckupId]);

  // Bộ lọc theo danh mục và tìm kiếm
  const filteredMetrics = useMemo(() => {
    return latestMetricsList.filter((m) => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = m.metricName.toLowerCase().includes(q);
        const codeMatch = (m.metricCode || '').toLowerCase().includes(q);
        const hospitalMatch = (m.hospitalName || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || hospitalMatch;
      }
      return true;
    });
  }, [latestMetricsList, selectedCategory, searchQuery]);

  // Các chỉ số sinh tồn chính trên Vitals Bar
  const keyVitals = useMemo(() => {
    const weight = latestMetricsMap.get('WEIGHT');
    const height = latestMetricsMap.get('HEIGHT');
    const bpSys = latestMetricsMap.get('BP_SYS');
    const bpDia = latestMetricsMap.get('BP_DIA');
    const heartRate = latestMetricsMap.get('HEART_RATE');
    const glucose = latestMetricsMap.get('GLUCOSE');
    const spo2 = latestMetricsMap.get('SPO2');

    let bmi = latestMetricsMap.get('BMI')?.value;
    if (!bmi && weight?.numericValue && height?.numericValue) {
      const hM = height.numericValue / 100;
      bmi = (weight.numericValue / (hM * hM)).toFixed(1);
    }

    return {
      weight: weight ? `${weight.value} kg` : 'Chưa đo',
      bmi: bmi ? `${bmi}` : '—',
      bloodPressure: bpSys && bpDia ? `${bpSys.value}/${bpDia.value} mmHg` : bpSys ? `${bpSys.value} mmHg` : 'Chưa đo',
      heartRate: heartRate ? `${heartRate.value} bpm` : 'Chưa đo',
      glucose: glucose ? `${glucose.value} mmol/L` : 'Chưa đo',
      spo2: spo2 ? `${spo2.value} %` : 'Chưa đo',
    };
  }, [latestMetricsMap]);

  // Đếm theo danh mục
  const counts = useMemo(() => {
    const vitals = latestMetricsList.filter((m) => m.category === 'vitals').length;
    const biochemistry = latestMetricsList.filter((m) => m.category === 'biochemistry').length;
    const bloodCount = latestMetricsList.filter((m) => m.category === 'blood_count').length;
    const urinalysis = latestMetricsList.filter((m) => m.category === 'urinalysis').length;
    const imagingFunctional = latestMetricsList.filter((m) => m.category === 'imaging_functional').length;
    return {
      all: latestMetricsList.length,
      vitals,
      biochemistry,
      bloodCount,
      urinalysis,
      imagingFunctional,
      records: filteredRecords.length,
    };
  }, [latestMetricsList, filteredRecords]);

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-16">
      {/* 1. Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-200/80 dark:border-slate-800 min-w-0 max-w-full">
        <div className="space-y-1 min-w-0">
          {onBackToOverview && (
            <button
              type="button"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Quay lại Tổng quan Sức khỏe</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug break-words">
                Chỉ Số Sinh Học & Hồ Sơ Xét Nghiệm
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-none">
                Toàn bộ chỉ số máu, sinh hóa gan thận, nước tiểu & chẩn đoán hình ảnh từ bệnh viện
              </p>
            </div>
          </div>
        </div>

        {/* Menu thao tác chính dạng Popup */}
        <div className="relative w-full sm:w-auto shrink-0" ref={actionMenuRef}>
          <button
            type="button"
            onClick={() => setIsActionMenuOpen((prev) => !prev)}
            className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Thao tác / Thêm mới</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isActionMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isActionMenuOpen && (
            <div className="absolute left-0 sm:left-auto right-0 mt-2 w-full sm:w-80 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
              {/* 1. AI Quét tài liệu y tế */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  setIsAiModalOpen(true);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-rose-50/80 dark:hover:bg-rose-950/40 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-rose-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      AI Quét tài liệu y tế
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                      AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    Quét ảnh chụp, PDF kết quả xét nghiệm & đơn thuốc
                  </p>
                </div>
              </button>

              {/* 2. Đợt khám mới */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  setIsCheckupModalOpen(true);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 block">
                    + Đợt khám mới
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    Tạo mã đợt khám tổng quát hoặc chuyên khoa
                  </p>
                </div>
              </button>

              {/* 3. Ghi nhận thủ công */}
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  setIsManualModalOpen(true);
                }}
                className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 block">
                    Ghi nhận thủ công
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    Nhập nhanh 1 chỉ số sinh tồn hoặc xét nghiệm đo lẻ
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Thanh Chọn Đợt Khám Sức Khỏe (Checkup Sessions Selector) */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">
              Quản Lý Theo Đợt Khám Sức Khỏe
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0">
            {checkupSessions.length > 0 ? `${checkupSessions.length} đợt` : '0 đợt'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSelectedCheckupId('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${selectedCheckupId === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
          >
            <span>Tất cả đợt khám (Tổng hợp)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedCheckupId === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
            >
              {checkupSessions.length}
            </span>
          </button>

          {sortedCheckupSessions.map((s) => {
            const isSelected = selectedCheckupId === s.id;
            return (
              <div
                key={s.id}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs transition whitespace-nowrap cursor-pointer border ${isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                onClick={() => setSelectedCheckupId(s.id)}
              >
                <Calendar className="w-3.5 h-3.5 opacity-80 shrink-0" />
                <span className="font-extrabold max-w-[140px] sm:max-w-none truncate">{s.title || 'Đợt khám'}</span>
                <span className="text-[11px] opacity-80 font-normal shrink-0">
                  • {s.checkupDate || 'Chưa có ngày'} ({s.hospitalName})
                </span>
                {s.healthClassification && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase ${isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                  >
                    {s.healthClassification.includes('Loại 2') ? 'Loại 2' : s.healthClassification}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Bạn có chắc muốn xóa đợt khám "${s.title}"?`)) {
                      deleteCheckup(s.id);
                    }
                  }}
                  className={`p-1 rounded-md transition ${isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-rose-100 text-slate-400 hover:text-rose-600'
                    }`}
                  title="Xóa đợt khám"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* 3. Thẻ Thông Tin Chi Tiết Đợt Khám */}
        {currentCheckup && (() => {
          const hasAnySpecialty = !!(
            currentCheckup.specialtiesSummary?.surgery ||
            currentCheckup.specialtiesSummary?.ophthalmology ||
            currentCheckup.specialtiesSummary?.dental ||
            currentCheckup.specialtiesSummary?.ent ||
            currentCheckup.specialtiesSummary?.internalMedicine ||
            currentCheckup.specialtiesSummary?.dermatology
          );
          const hasClinicalData = !!(
            currentCheckup.clinicalConclusion ||
            currentCheckup.familyHistory ||
            currentCheckup.healthClassification ||
            hasAnySpecialty
          );
          const hasDataInSession = latestMetricsList.length > 0 || filteredRecords.length > 0 || hasClinicalData;

          return (
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 space-y-3.5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {currentCheckup.title}
                    </h4>
                    {currentCheckup.healthClassification ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{currentCheckup.healthClassification}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Chờ kết quả phân loại
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      {currentCheckup.hospitalName}
                    </span>
                    <span>• Ngày khám: {currentCheckup.checkupDate}</span>
                    {currentCheckup.doctorName && <span>• Bác sĩ: {currentCheckup.doctorName}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  {currentCheckup.familyHistory && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-bold text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Tiền sử: {currentCheckup.familyHistory}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsEditCheckupModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    title="Cập nhật kết luận bác sĩ hoặc chuyên khoa cho đợt khám này"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa kết luận / chuyên khoa</span>
                  </button>
                </div>
              </div>

              {/* Bác sĩ kết luận */}
              {currentCheckup.clinicalConclusion && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Kết luận tổng quát: </span>
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {currentCheckup.clinicalConclusion}
                  </span>
                </div>
              )}

              {/* Chi tiết từng chuyên khoa lâm sàng (Chỉ hiện khi có kết quả thực tế) */}
              {hasAnySpecialty && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Kết Quả Khám Chuyên Khoa Lâm Sàng
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {/* Ngoại khoa (Tuyến giáp) */}
                    {currentCheckup.specialtiesSummary?.surgery && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-amber-500" />
                            <span>Ngoại Khoa (Tuyến Giáp)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.surgery}
                        </p>
                      </div>
                    )}

                    {/* Mắt */}
                    {currentCheckup.specialtiesSummary?.ophthalmology && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4 text-indigo-500" />
                            <span>Chuyên Khoa Mắt</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.ophthalmology}
                        </p>
                      </div>
                    )}

                    {/* Răng hàm mặt */}
                    {currentCheckup.specialtiesSummary?.dental && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Smile className="w-4 h-4 text-amber-500" />
                            <span>Răng Hàm Mặt</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.dental}
                        </p>
                      </div>
                    )}

                    {/* Tai Mũi Họng */}
                    {currentCheckup.specialtiesSummary?.ent && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Ear className="w-4 h-4 text-amber-500" />
                            <span>Tai Mũi Họng</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.ent}
                        </p>
                      </div>
                    )}

                    {/* Nội khoa */}
                    {currentCheckup.specialtiesSummary?.internalMedicine && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-emerald-500" />
                            <span>Nội Khoa (Tim, Phổi, Tiêu Hóa)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.internalMedicine}
                        </p>
                      </div>
                    )}

                    {/* Da liễu */}
                    {currentCheckup.specialtiesSummary?.dermatology && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <span>Da Liễu</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {currentCheckup.specialtiesSummary.dermatology}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Trạng thái đợt khám mới - Chờ nạp dữ liệu */}
              {!hasDataInSession && (
                <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-dashed border-indigo-200 dark:border-indigo-800/80 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Đợt khám đang chờ nạp kết quả
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Đợt khám &quot;{currentCheckup.title}&quot; đã được tạo thành công. Bạn có thể sử dụng AI để quét tài liệu y tế hoặc bổ sung từng chỉ số thủ công vào đợt này.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Quét tài liệu vào đợt này</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-500" />
                      <span>Thêm chỉ số thủ công</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditCheckupModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Nhập kết luận chuyên khoa</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 4. Key Vitals Cards Bar (Thẻ Chỉ Số Sinh Tồn Nhanh) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Cân nặng', value: keyVitals.weight, icon: Activity, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
          { label: 'Chỉ số BMI', value: keyVitals.bmi, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
          { label: 'Huyết áp', value: keyVitals.bloodPressure, icon: HeartPulse, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
          { label: 'Nhịp tim', value: keyVitals.heartRate, icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
          { label: 'Đường huyết đói', value: keyVitals.glucose, icon: Droplet, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Nồng độ Oxy (SpO2)', value: keyVitals.spo2, icon: ShieldCheck, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40' },
        ].map((v, i) => {
          const Icon = v.icon;
          return (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {v.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${v.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-white truncate">
                {v.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Search and Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'Tất cả chỉ số', count: counts.all },
            { id: 'vitals', label: 'Sinh tồn & Thể chất', count: counts.vitals },
            { id: 'biochemistry', label: 'Sinh hóa máu', count: counts.biochemistry },
            { id: 'blood_count', label: 'Huyết học (CBC)', count: counts.bloodCount },
            { id: 'urinalysis', label: 'Nước tiểu', count: counts.urinalysis },
            { id: 'imaging_functional', label: 'CĐHA & Thăm dò', count: counts.imagingFunctional },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${selectedCategory === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[200px] sm:max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm chỉ số: Glucose, RBC, Uric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* 4. Main Biometrics Data Table */}
      {filteredMetrics.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedCheckupId !== 'all'
                ? `Đợt khám "${currentCheckup?.title || ''}" chưa có chỉ số nào trong mục này`
                : 'Chưa có dữ liệu chỉ số sức khỏe trong mục này'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {selectedCheckupId !== 'all'
                ? 'Bạn có thể bấm nút dưới đây để ghi nhận thêm chỉ số xét nghiệm hoặc dùng AI quét tài liệu trực tiếp cho đợt khám này.'
                : 'Hãy dùng tính năng AI Quét tài liệu để tự động đọc mọi file kết quả xét nghiệm PDF/ảnh chụp của bệnh viện, hoặc bấm Ghi nhận thủ công để nhập nhanh.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-rose-500" />
              <span>Ghi nhận thủ công</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Quét tài liệu y tế</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          {/* Header Bảng Chỉ Số */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedCheckupId === 'all'
                  ? `Toàn Bộ Chỉ Số Sức Khỏe Tổng Hợp (${filteredMetrics.length} chỉ số)`
                  : `Bảng Chỉ Số Đợt Khám: ${currentCheckup?.title || 'Đợt khám'} (${filteredMetrics.length} chỉ số)`}
              </span>
            </div>
            {selectedCheckupId !== 'all' && (
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm chỉ số vào đợt khám này</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tên Chỉ Số & Mã</th>
                  <th className="py-3 px-4">Kết Quả</th>
                  <th className="py-3 px-4">Đơn Vị</th>
                  <th className="py-3 px-4">Khoảng Tham Chiếu</th>
                  <th className="py-3 px-4">Đánh Giá</th>
                  <th className="py-3 px-4">Đợt Khám / Nơi Đo</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredMetrics.map((m) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      <Check className="w-3 h-3" /> Bình thường
                    </span>
                  );

                  if (m.status === 'high') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                        <ArrowUp className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Vượt ngưỡng (Cao)
                      </span>
                    );
                  } else if (m.status === 'low') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        <ArrowDown className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Dưới chuẩn (Thấp)
                      </span>
                    );
                  } else if (m.status === 'abnormal') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                        <AlertTriangle className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Bất thường
                      </span>
                    );
                  } else if (m.status === 'warning') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Cần theo dõi
                      </span>
                    );
                  }

                  const sessionLabel = checkupNameMap.get(getMetricCheckupId(m) || '') || m.hospitalName || 'Tự ghi';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span>{m.metricName}</span>
                          {m.category === 'imaging_functional' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                              CĐHA & Thăm dò
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {m.metricCode}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <div className={`font-extrabold text-sm text-slate-900 dark:text-white leading-relaxed ${m.category === 'imaging_functional' ? 'font-sans' : 'font-mono'}`}>
                          {m.value}
                        </div>
                        {m.notes && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2" title={m.notes}>
                            {m.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {m.unit || '—'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {m.referenceRange || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {statusBadge}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{m.measuredAt}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={sessionLabel}>
                          {sessionLabel}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMetric(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          title="Xóa chỉ số này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Danh Sách Hồ Sơ Khám Bệnh Đã Lưu (Past Exam Sessions) */}
      {filteredRecords.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {selectedCheckupId === 'all'
                  ? `Hồ Sơ & Tài Liệu Xét Nghiệm (${filteredRecords.length})`
                  : `Hồ Sơ Thuộc Đợt Khám: ${currentCheckup?.title || ''} (${filteredRecords.length})`}
              </h3>
            </div>
            <span className="text-xs text-slate-400">Đã đồng bộ an toàn trên Cloud</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-900 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {r.recordDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {r.metrics?.length || 0} chỉ số
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                    {r.title}
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{r.hospitalName || 'Bệnh viện'}</span>
                    {r.doctorName && <span>• BS: {r.doctorName}</span>}
                  </p>

                  {r.summaryDiagnosis && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      {r.summaryDiagnosis}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {r.fileName || 'Hồ sơ đã quét'}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteRecord(r.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                    title="Xóa hồ sơ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AiMedicalImportModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultCheckupId={selectedCheckupId !== 'all' ? selectedCheckupId : undefined}
      />

      <ManualMetricModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        defaultCheckupId={selectedCheckupId !== 'all' ? selectedCheckupId : undefined}
      />

      <CreateCheckupModal
        isOpen={isCheckupModalOpen}
        onClose={() => setIsCheckupModalOpen(false)}
        onCreated={(newSessionId) => setSelectedCheckupId(newSessionId)}
      />

      <EditCheckupModal
        isOpen={isEditCheckupModalOpen}
        onClose={() => setIsEditCheckupModalOpen(false)}
        checkup={currentCheckup}
      />
    </div>
  );
};
