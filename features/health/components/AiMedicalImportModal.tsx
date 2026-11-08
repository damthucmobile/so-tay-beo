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
  Plus,
  Trash2,
  Calendar,
  Building2,
  User,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { HealthRecordDocument, HealthMetricValue } from '../types';
import { useAuth } from '@/core/firebase';
import { useHealthStore } from '../stores/useHealthStore';
import { processFileForAi, formatBytes } from '@/core/utils/imageCompressor';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  originalSize?: number;
  type: string;
  blob: Blob | File;
  previewUrl?: string;
  isCompressed?: boolean;
}

interface AiMedicalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (recordId: string) => void;
  defaultCheckupId?: string;
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);

  React.useEffect(() => {
    if (defaultCheckupId && defaultCheckupId !== 'all') {
      setSelectedCheckupSessionId(defaultCheckupId);
    }
  }, [defaultCheckupId]);

  // Giải phóng preview URLs khi component unmount
  React.useEffect(() => {
    return () => {
      uploadedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const [rawText, setRawText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressingFiles, setIsCompressingFiles] = useState(false);
  const [compressingProgress, setCompressingProgress] = useState<{ current: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Parsed Result to Review
  const [parsedData, setParsedData] = useState<Partial<HealthRecordDocument> | null>(null);

  if (!isOpen) return null;

  // Xử lý khi chọn một hoặc nhiều file từ máy tính / điện thoại
  const handleFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg('');

    const fileList = Array.from(files);
    setIsCompressingFiles(true);
    setCompressingProgress({ current: 0, total: fileList.length });

    try {
      const newItems: UploadedFileItem[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setCompressingProgress({ current: i + 1, total: fileList.length });

        // Cảnh báo nếu PDF vượt quá 4MB
        if (file.type === 'application/pdf' && file.size > 4 * 1024 * 1024) {
          setErrorMsg(
            `Tệp PDF "${file.name}" có dung lượng lớn (${formatBytes(file.size)}). Vui lòng nén PDF hoặc tải ảnh từng trang để AI quét tối ưu.`
          );
          continue;
        }

        const processed = await processFileForAi(file, {
          maxDimension: 1920,
          quality: 0.82,
        });

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: processed.size,
          originalSize: processed.originalSize,
          type: processed.mimeType,
          blob: processed.blob,
          previewUrl: processed.previewUrl,
          isCompressed: processed.isCompressed,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newItems]);
    } catch (err: any) {
      console.error('Lỗi khi nén/đọc tệp:', err);
      setErrorMsg(err?.message || 'Có lỗi khi đọc và tối ưu hóa tệp.');
    } finally {
      setIsCompressingFiles(false);
      setCompressingProgress(null);
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleClearAllFiles = () => {
    uploadedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setUploadedFiles([]);
  };

  // Gửi toàn bộ các file đã chọn đến AI để bóc tách dữ liệu thông qua FormData
  const triggerAiParse = async () => {
    if (uploadedFiles.length === 0 && !rawText) return;
    setIsProcessing(true);
    setStep('scanning');
    setErrorMsg('');

    try {
      const totalBinaryBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
      const MAX_PAYLOAD_LIMIT = 4.2 * 1024 * 1024; // 4.2 MB nhị phân thuần túy

      if (totalBinaryBytes > MAX_PAYLOAD_LIMIT) {
        throw new Error(
          `Tổng dung lượng tệp (${formatBytes(totalBinaryBytes)}) vượt quá giới hạn 4.5MB của hệ thống. Vui lòng giảm bớt số lượng ảnh hoặc chia nhỏ lần quét để AI bóc tách tốt nhất.`
        );
      }

      const formData = new FormData();
      if (rawText) {
        formData.append('rawText', rawText);
      }

      uploadedFiles.forEach((item, index) => {
        const fileName = item.name || `medical_doc_${index + 1}.jpg`;
        formData.append('files', item.blob, fileName);
      });

      const res = await fetch('/api/health/parse-document', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 413) {
        throw new Error(
          'Dung lượng tệp vượt quá giới hạn xử lý của máy chủ (413 Payload Too Large). Vui lòng bớt số lượng ảnh hoặc tải từng trang.'
        );
      }

      if (!res.ok) {
        let errMessage = '';
        try {
          const errJson = await res.json();
          errMessage = errJson.error || errJson.message;
        } catch {
          errMessage = await res.text();
        }
        throw new Error(errMessage || `Máy chủ phản hồi lỗi (${res.status})`);
      }

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
      const combinedFileNames = uploadedFiles.map((f) => f.name).join(', ');
      const totalFileSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);

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
        fileName: combinedFileNames || undefined,
        fileSize: totalFileSize || undefined,
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
            <div className="space-y-5">
              {/* Checkup Session Selector */}
              {checkupSessions.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Gán vào Đợt Khám Sức Khỏe:
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Các chỉ số và hồ sơ quét được sẽ tự động liên kết với đợt khám này
                      </span>
                    </div>
                  </div>
                  <select
                    value={selectedCheckupSessionId}
                    onChange={(e) => setSelectedCheckupSessionId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer sm:max-w-xs truncate"
                  >
                    <option value="none">Không gắn đợt khám (Tự đo lẻ / Khác)</option>
                    {checkupSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.checkupDate} • {s.hospitalName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropzone Upload Hỗ trợ nhiều tệp */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-3xl p-6 sm:p-8 text-center transition-all bg-slate-50/50 dark:bg-slate-800/20 group">
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/png,image/jpeg,image/webp,.txt,.csv"
                  onChange={(e) => {
                    handleFilesSelect(e.target.files);
                    e.target.value = '';
                  }}
                  disabled={isCompressingFiles || isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                />

                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isCompressingFiles ? (
                    <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <div className="mt-3 space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {isCompressingFiles
                      ? `Đang tự động nén & tối ưu hóa ảnh (${compressingProgress?.current || 1}/${compressingProgress?.total || 1})...`
                      : uploadedFiles.length > 0
                      ? 'Nhấn hoặc kéo thả để thêm tệp'
                      : 'Kéo thả hoặc chọn tệp kết quả khám bệnh'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Hỗ trợ chọn <strong>cùng lúc nhiều tệp</strong>: ảnh chụp từng trang (<strong>JPG, PNG</strong>), phiếu siêu âm, xét nghiệm hoặc tệp <strong>PDF</strong>. Hệ thống tự động nén giữ trọn độ nét cho AI, tránh lỗi quá tải 413.
                  </p>
                </div>
              </div>

              {/* Danh sách tệp đã chọn */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tệp đã nạp ({uploadedFiles.length} tệp)
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm tệp khác</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,image/png,image/jpeg,image/webp,.txt,.csv"
                          onChange={(e) => {
                            handleFilesSelect(e.target.files);
                            e.target.value = '';
                          }}
                          disabled={isCompressingFiles || isProcessing}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleClearAllFiles}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200/70 dark:border-slate-700/70">
                            {file.previewUrl ? (
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : file.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatBytes(file.size)} • Trang/Ảnh #{idx + 1}
                              {file.isCompressed && file.originalSize && file.originalSize > file.size && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">
                                  (giảm {Math.round(((file.originalSize - file.size) / file.originalSize) * 100)}%)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          title="Xóa tệp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Thanh tổng dung lượng & nút kích hoạt */}
                  {(() => {
                    const totalFilesSizeBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
                    const isTotalOversized = totalFilesSizeBytes > 4.2 * 1024 * 1024;

                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 w-full sm:w-auto">
                          <span>Tổng dung lượng:</span>
                          <strong className={isTotalOversized ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300 font-semibold'}>
                            {formatBytes(totalFilesSizeBytes)}
                          </strong>
                          <span className="text-slate-400">/ 4.2 MB</span>
                          {isTotalOversized && (
                            <span className="text-rose-600 font-bold ml-1.5 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Quá giới hạn Vercel
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={triggerAiParse}
                            disabled={isProcessing || isCompressingFiles || isTotalOversized}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang phân tích {uploadedFiles.length} tệp...</span>
                              </>
                            ) : isCompressingFiles ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Đang tối ưu tệp ({compressingProgress?.current}/{compressingProgress?.total})...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Bắt đầu quét AI ({uploadedFiles.length} tệp)</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
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
                  AI đang đọc và tổng hợp {uploadedFiles.length > 1 ? `${uploadedFiles.length} tài liệu / trang khám` : 'tài liệu y tế'}...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Tự động nhận diện tên chỉ số, giá trị, đơn vị, khoảng tham chiếu và đánh giá tình trạng sức khỏe từ toàn bộ các trang.
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
                          } else if (m.status === 'warning') {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Cần theo dõi
                              </span>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                              <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{m.metricName}</span>
                                  {m.category === 'imaging_functional' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      CĐHA & Thăm dò
                                    </span>
                                  )}
                                </div>
                                <span className="block text-[10px] text-slate-400 font-mono">
                                  {m.metricCode}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={m.value}
                                  onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                                  className={`px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:border-rose-500 ${m.category === 'imaging_functional' ? 'w-full min-w-[140px] max-w-xs font-sans' : 'w-24 font-mono'}`}
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
                        <div className="font-bold text-rose-600 dark:text-rose-400 pt-0.5 flex items-center gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Kết luận: {img.conclusion}</span>
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
