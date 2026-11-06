// features/health/components/AiMedicalImportModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Stethoscope,
  Plus,
  Trash2,
  Calendar,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { HealthRecordDocument, HealthMetricValue } from '../types';
import { useAuth } from '@/core/firebase';
import { useHealthStore } from '../stores/useHealthStore';

interface AiMedicalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (recordId: string) => void;
  defaultCheckupId?: string;
}

interface SampleDoc {
  fileName: string;
  label: string;
  category: string;
}

export const AiMedicalImportModal: React.FC<AiMedicalImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultCheckupId,
}) => {
  const { user } = useAuth();
  const saveRecord = useHealthStore((state) => state.saveRecord);
  const checkupSessions = useHealthStore((state) => state.checkupSessions);

  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [selectedCheckupSessionId, setSelectedCheckupSessionId] = useState<string>(
    defaultCheckupId && defaultCheckupId !== 'all' ? defaultCheckupId : 'none'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (defaultCheckupId && defaultCheckupId !== 'all') {
      setSelectedCheckupSessionId(defaultCheckupId);
    }
  }, [defaultCheckupId]);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sample Documents
  const [samples, setSamples] = useState<SampleDoc[]>([]);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  // Parsed Result to Review
  const [parsedData, setParsedData] = useState<Partial<HealthRecordDocument> | null>(null);

  // Tải danh sách tài liệu mẫu từ thư mục .document
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/health/sample-documents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Không tải được sample docs:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý khi chọn file từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);
    setMimeType(file.type || 'application/octet-stream');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Chọn 1 file mẫu từ bệnh viện
  const handleSelectSample = async (sample: SampleDoc) => {
    setLoadingSample(sample.fileName);
    setErrorMsg('');
    try {
      const res = await fetch('/api/health/sample-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: sample.fileName }),
      });
      const data = await res.json();
      if (data.success && data.fileBase64) {
        setFileName(data.fileName);
        setMimeType(data.mimeType);
        setFileBase64(data.fileBase64);
        setSelectedFile(null);
        // Tự động phân tích luôn
        triggerAiParse(data.fileBase64, data.mimeType, data.fileName, '');
      } else {
        setErrorMsg('Không thể đọc file mẫu.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi nạp file mẫu.');
    } finally {
      setLoadingSample(null);
    }
  };

  // Gửi file đến AI để bóc tách dữ liệu
  const triggerAiParse = async (
    b64: string,
    mime: string,
    name: string,
    text: string
  ) => {
    setIsProcessing(true);
    setStep('scanning');
    setErrorMsg('');

    try {
      const res = await fetch('/api/health/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: b64,
          mimeType: mime,
          fileName: name,
          rawText: text,
        }),
      });

      const json = await res.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || 'AI không thể nhận diện được cấu trúc tài liệu này.');
      }

      setParsedData(json.data);
      setStep('review');
    } catch (err: any) {
      console.error('Lỗi phân tích AI:', err);
      setErrorMsg(err?.message || 'Có lỗi khi phân tích tài liệu bằng AI.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  // Lưu hồ sơ đã xác nhận vào DB
  const handleSaveToDb = async () => {
    if (!parsedData || !user?.uid) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const sessionIdToAssign = selectedCheckupSessionId !== 'none' ? selectedCheckupSessionId : undefined;
      const recordPayload: Omit<HealthRecordDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        title: parsedData.title || `Khám sức khỏe - ${parsedData.hospitalName || 'Bệnh viện'}`,
        recordDate: parsedData.recordDate || new Date().toISOString().split('T')[0],
        hospitalName: parsedData.hospitalName || 'Chưa rõ',
        doctorName: parsedData.doctorName || '',
        patientName: parsedData.patientName || user.displayName || 'Tôi',
        patientYearOfBirth: parsedData.patientYearOfBirth || '',
        department: parsedData.department || '',
        documentType: parsedData.documentType || 'general_health_check',
        summaryDiagnosis: parsedData.summaryDiagnosis || '',
        checkupSessionId: sessionIdToAssign,
        metrics: (parsedData.metrics || []).map((m) => ({
          ...m,
          checkupSessionId: sessionIdToAssign,
        })),
        imagingFindings: parsedData.imagingFindings || [],
        fileName: fileName || '',
        aiAnalysisNotes: parsedData.aiAnalysisNotes || '',
      };

      const recordId = await saveRecord(user.uid, recordPayload);
      onSuccess?.(recordId);
      onClose();
    } catch (err: any) {
      console.error('Lỗi lưu vào DB:', err);
      setErrorMsg(err?.message || 'Không thể lưu hồ sơ vào cơ sở dữ liệu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cập nhật giá trị chỉ số trong bảng review
  const handleUpdateMetric = (index: number, field: keyof HealthMetricValue, val: any) => {
    if (!parsedData || !parsedData.metrics) return;
    const updated = [...parsedData.metrics];
    updated[index] = { ...updated[index], [field]: val };
    setParsedData({ ...parsedData, metrics: updated });
  };

  // Xóa bớt một chỉ số khỏi danh sách import
  const handleDeleteMetric = (index: number) => {
    if (!parsedData || !parsedData.metrics) return;
    const updated = parsedData.metrics.filter((_, i) => i !== index);
    setParsedData({ ...parsedData, metrics: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  AI Quét & Nhập Hồ Sơ Y Tế Thông Minh
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  Universal AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động nhận diện mọi định dạng PDF, ảnh chụp, kết quả từ các bệnh viện
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD HOẶC CHỌN MẪU */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone Upload */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-3xl p-6 sm:p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-800/20 group">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp,.txt,.csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>

                <div className="mt-3 space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'Kéo thả hoặc chọn tệp kết quả khám bệnh'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Hỗ trợ tệp <strong>PDF</strong>, ảnh chụp điện thoại (<strong>JPG, PNG</strong>), hoặc văn bản. AI sẽ tự động phân tích và đưa vào CSDL chuẩn hóa.
                  </p>
                </div>

                {selectedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                  </div>
                )}
              </div>

              {selectedFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => triggerAiParse(fileBase64, mimeType, fileName, rawText)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Bắt đầu quét AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Dùng ngay mẫu thực tế từ .document */}
              {samples.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
                      <span>Hoặc thử nghiệm ngay với tài liệu thực tế của bạn:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">1-click AI Scanner</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {samples.map((s) => (
                      <button
                        key={s.fileName}
                        type="button"
                        onClick={() => handleSelectSample(s)}
                        disabled={loadingSample !== null || isProcessing}
                        className="group p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 text-left transition flex items-start justify-between gap-2 cursor-pointer shadow-xs"
                      >
                        <div className="min-w-0">
                          <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-1">
                            {s.category}
                          </span>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                            {s.label}
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate">
                            {s.fileName}
                          </p>
                        </div>

                        {loadingSample === s.fileName ? (
                          <Loader2 className="w-4 h-4 text-rose-500 animate-spin shrink-0 mt-2" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCANNING STATE */}
          {step === 'scanning' && (
            <div className="py-14 text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-rose-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-rose-500/30">
                  <Sparkles className="w-10 h-10 animate-spin" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  AI đang đọc và phân tích cấu trúc phiếu xét nghiệm...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Tự động nhận diện tên chỉ số, giá trị, đơn vị, khoảng tham chiếu và đánh giá tình trạng sức khỏe.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 'review' && parsedData && (
            <div className="space-y-5 animate-fadeIn">
              {/* Thông tin phiếu khám */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cơ sở khám bệnh:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <input
                      type="text"
                      value={parsedData.hospitalName || ''}
                      onChange={(e) => setParsedData({ ...parsedData, hospitalName: e.target.value })}
                      className="bg-transparent font-bold w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày khám/Xét nghiệm:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <input
                      type="date"
                      value={parsedData.recordDate || ''}
                      onChange={(e) => setParsedData({ ...parsedData, recordDate: e.target.value })}
                      className="bg-transparent font-bold w-full focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Người bệnh:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{parsedData.patientName || 'Tôi'} ({parsedData.patientYearOfBirth || '2000'})</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Bác sĩ / Khoa phòng:</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {parsedData.doctorName ? `BS: ${parsedData.doctorName}` : (parsedData.department || 'Khoa Xét nghiệm')}
                  </div>
                </div>
              </div>

              {/* Tóm tắt chẩn đoán & Đánh giá của AI */}
              {parsedData.aiAnalysisNotes && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhận định nhanh từ AI Y tế:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {parsedData.aiAnalysisNotes}
                  </p>
                </div>
              )}

              {/* Bảng Chỉ số Xét nghiệm đã bóc tách */}
              {parsedData.metrics && parsedData.metrics.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Chỉ số xét nghiệm bóc tách được ({parsedData.metrics.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Bạn có thể chỉnh sửa giá trị trước khi lưu</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Tên xét nghiệm</th>
                          <th className="py-2.5 px-3">Kết quả</th>
                          <th className="py-2.5 px-3">Đơn vị</th>
                          <th className="py-2.5 px-3">Tham chiếu</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                          <th className="py-2.5 px-3 text-right">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedData.metrics.map((m, idx) => {
                          let statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3" /> Bình thường
                            </span>
                          );

                          if (m.status === 'high') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                ▲ Cao
                              </span>
                            );
                          } else if (m.status === 'low') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                ▼ Thấp
                              </span>
                            );
                          } else if (m.status === 'abnormal') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                Bất thường
                              </span>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {m.metricName}
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {m.metricCode}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={m.value}
                                  onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:border-rose-500"
                                />
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono">
                                {m.unit || '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono">
                                {m.referenceRange || '—'}
                              </td>
                              <td className="py-2 px-3">
                                {statusBadge}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMetric(idx)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
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

              {/* Kết quả Thăm dò chức năng & Chẩn đoán hình ảnh nếu có */}
              {parsedData.imagingFindings && parsedData.imagingFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Kết quả Chẩn đoán hình ảnh & Thăm dò chức năng ({parsedData.imagingFindings.length})
                  </h4>
                  <div className="space-y-2">
                    {parsedData.imagingFindings.map((img, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {img.serviceName}
                          </span>
                          {img.classification && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {img.classification}
                            </span>
                          )}
                        </div>
                        {img.description && (
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {img.description}
                          </p>
                        )}
                        <div className="font-bold text-rose-600 dark:text-rose-400 pt-0.5">
                          👉 Kết luận: {img.conclusion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          {step === 'review' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Quay lại chọn tệp khác
              </button>

              <button
                type="button"
                onClick={handleSaveToDb}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào CSDL...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận & Lưu vào Sổ Sức Khỏe</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="text-[11px] text-slate-400">
                Dữ liệu được mã hóa và đồng bộ Firestore Cloud an toàn.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Đóng
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
