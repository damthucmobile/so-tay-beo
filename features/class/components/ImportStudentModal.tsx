'use client';

import React, { useState } from 'react';
import { ClassStudentEntity } from '../types';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, FileText, Download } from 'lucide-react';
import {
  downloadClassStudentTemplate,
  parseStudentExcelFile,
} from '../utils/classImportHelper';
import { format } from 'date-fns';

interface ImportStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onImport: (students: Partial<ClassStudentEntity>[]) => Promise<void>;
}

export const ImportStudentModal: React.FC<ImportStudentModalProps> = ({
  isOpen,
  onClose,
  classId,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [textInput, setTextInput] = useState('');
  const [parsedStudents, setParsedStudents] = useState<
    Array<{ fullName: string; phoneNumber: string; joinedDate: string; notes?: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultToday = format(new Date(), 'yyyy-MM-dd');

  if (!isOpen) return null;

  // Phân tích cú pháp Text dán vào
  const handleParseText = () => {
    const lines = textInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const results: Array<{ fullName: string; phoneNumber: string; joinedDate: string; notes?: string }> = [];

    lines.forEach((line) => {
      // Hỗ trợ phân cách bằng dấu phẩy, tab, hoặc gạch đứng |
      const parts = line.split(/[,|\t]+/).map((p) => p.trim());
      if (parts.length > 0 && parts[0]) {
        results.push({
          fullName: parts[0],
          phoneNumber: parts[1] || '',
          joinedDate: parts[2] && parts[2].includes('-') ? parts[2] : defaultToday,
          notes: parts[3] || '',
        });
      }
    });

    setParsedStudents(results);
  };

  // Đọc file Excel bằng logic classImportHelper chuẩn
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseStudentExcelFile(file);
      const validRows = parsedRows.filter((r) => r.isValid);

      if (validRows.length === 0) {
        alert('Không tìm thấy học sinh hợp lệ trong file Excel. Vui lòng kiểm tra lại định dạng hoặc tải file mẫu.');
        return;
      }

      const results = validRows.map((r) => ({
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        joinedDate: r.joinedDate || defaultToday,
        notes: r.notes || 'Nhập từ file Excel',
      }));

      setParsedStudents(results);
    } catch (err: any) {
      alert('Lỗi đọc file Excel: ' + (err.message || String(err)));
    }
  };

  const handleConfirmImport = async () => {
    if (parsedStudents.length === 0) {
      alert('Chưa có học sinh nào được trích xuất.');
      return;
    }

    try {
      setIsSubmitting(true);
      const studentEntities: Partial<ClassStudentEntity>[] = parsedStudents.map((s) => ({
        classId,
        fullName: s.fullName,
        phoneNumber: s.phoneNumber,
        status: 'ACTIVE',
        joinedDate: s.joinedDate || defaultToday,
        notes: s.notes || '',
      }));

      await onImport(studentEntities);
      onClose();
    } catch (err) {
      alert('Lỗi lưu danh sách học sinh: ' + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Nhập Danh Sách Học Sinh Hàng Loạt</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hỗ trợ dán văn bản hoặc tải file Excel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 px-6 pt-3 bg-slate-50/50 dark:bg-slate-950/20 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dán Văn Bản</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Tải File Excel</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'paste' ? (
            <div className="space-y-3">
              {/* Khung gợi ý mẫu cố định luôn hiển thị phía trên */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <span>💡 Định dạng mẫu gợi ý (mỗi dòng 1 học sinh):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTextInput(
                        'Nguyễn Văn An, 0912345678, 2026-09-01\nTrần Thị Bình, 0987654321\nLê Hoàng Cường, 0905123456'
                      )
                    }
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Dán mẫu thử
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-2.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5 border border-slate-200 dark:border-slate-800/80 select-all">
                  <p className="text-slate-400 dark:text-slate-500"># Cú pháp: [Họ và Tên], [Số điện thoại], [Ngày vào: YYYY-MM-DD]</p>
                  <p className="text-emerald-600 dark:text-emerald-400">Nguyễn Văn An, 0912345678, 2026-09-01</p>
                  <p className="text-emerald-600 dark:text-emerald-400">Trần Thị Bình, 0987654321</p>
                  <p className="text-emerald-600 dark:text-emerald-400">Lê Hoàng Cường, 0905123456</p>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  * Hỗ trợ phân cách bằng dấu phẩy (<code className="text-blue-600 dark:text-blue-300">,</code>), dấu gạch đứng (<code className="text-blue-600 dark:text-blue-300">|</code>) hoặc phím Tab.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Dán hoặc nhập danh sách của bạn tại đây:
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {textInput.split('\n').filter((l) => l.trim()).length} dòng đã nhập
                </span>
              </div>

              <textarea
                rows={5}
                placeholder="Dán hoặc nhập danh sách học sinh vào đây theo định dạng mẫu ở trên..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />

              <button
                type="button"
                onClick={handleParseText}
                disabled={!textInput.trim()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Trích xuất ({textInput.split('\n').filter((l) => l.trim()).length} dòng)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner tải file biểu mẫu mẫu */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-500/10 border border-blue-500/25 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>File Biểu Mẫu Chuẩn (.xlsx)</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    File mẫu gồm 2 Tab: Mẫu Lớp Học & Mẫu Học Sinh có sẵn tiêu đề chuẩn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadClassStudentTemplate()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Biểu Mẫu Mẫu</span>
                </button>
              </div>

              {/* Khung tải file */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                <FileSpreadsheet className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Chọn file bảng tính (.xlsx, .xls, .csv)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống tự động đọc Sheet "Mau_Import_Hoc_Sinh" hoặc Sheet Học Sinh
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Preview danh sách trích xuất */}
          {parsedStudents.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Sẵn sàng nhập {parsedStudents.length} học sinh:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setParsedStudents([])}
                  className="text-[11px] text-slate-400 hover:text-red-500 transition cursor-pointer"
                >
                  Xóa kết quả
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedStudents.map((st, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{st.fullName}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{st.phoneNumber || 'Không có SĐT'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isSubmitting || parsedStudents.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang nhập...' : `Xác Nhận Nhập (${parsedStudents.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
