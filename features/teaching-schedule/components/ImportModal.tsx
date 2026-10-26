'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useTeachingScheduleStore } from '../stores/useTeachingScheduleStore';
import { parseSchoolTimetable } from '../utils/excelParser';
import { useAuth } from '@/core/firebase';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { setTimetable } = useTeachingScheduleStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('Vui lòng chọn file Excel có định dạng .xlsx hoặc .xls');
      }

      const buffer = await file.arrayBuffer();
      const parsed = parseSchoolTimetable(buffer, file.name);

      setPreviewData(parsed);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Lỗi phân tích file Excel:', err);
      setError(err?.message || 'Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng ma trận TKB.');
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleConfirmApply = async () => {
    if (previewData) {
      setIsSavingCloud(true);
      setError(null);
      try {
        await setTimetable(previewData, user?.uid);
        setIsSavingCloud(false);
        onClose();
      } catch (err: any) {
        setIsSavingCloud(false);
        setError(err?.message || 'Có lỗi xảy ra khi lưu thời khóa biểu lên Firebase. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nhập Thời Khóa Biểu Excel</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hỗ trợ file ma trận TKB toàn trường THCS / THPT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Drag & Drop Upload Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Đang bóc tách dữ liệu thời khóa biểu từ Excel...
                </p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Bấm để chọn file hoặc kéo thả file Excel vào đây
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Định dạng file: .xlsx, .xls (Thời khóa biểu ma trận tuần toàn trường)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Báo lỗi nếu có */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Xem trước kết quả bóc tách file người dùng vừa chọn */}
          {previewData && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bóc tách file thành công!</span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{previewData.schoolName}</p>
                <p className="text-slate-500 dark:text-slate-400">{previewData.title} • {previewData.description}</p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                    <span className="block font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {previewData.classes.length}
                    </span>
                    <span className="text-[10px] text-slate-400">Lớp học</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                    <span className="block font-bold text-purple-600 dark:text-purple-400 text-sm">
                      {previewData.teachers.length}
                    </span>
                    <span className="text-[10px] text-slate-400">Giáo viên</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                    <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {previewData.totalEntries}
                    </span>
                    <span className="text-[10px] text-slate-400">Tiết học</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
          {previewData && (
            <button
              onClick={handleConfirmApply}
              disabled={isSavingCloud}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center gap-1.5"
            >
              {isSavingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
