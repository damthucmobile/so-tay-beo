'use client';

import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  X,
  FileImage,
  Sparkles,
  School,
  UserCheck,
  GraduationCap,
  ZoomIn,
  ZoomOut,
  Check,
  Loader2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { DAYS_OF_WEEK, DEFAULT_PERIOD_TIMES, TimetableEntry } from '../types';
import { getSubjectTheme } from '../utils/subjectColors';

interface PrintTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'teacher' | 'class';
  name: string; // Tên giáo viên hoặc tên lớp
  schoolName: string;
  subTitle?: string;
  entries: TimetableEntry[];
  subjects?: string[];
}

export const PrintTimetableModal: React.FC<PrintTimetableModalProps> = ({
  isOpen,
  onClose,
  type,
  name,
  schoolName,
  subTitle,
  entries,
  subjects = [],
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState<number>(100);

  if (!isOpen) return null;

  // Kiểm tra xem có học Thứ Bảy không
  const hasSaturday = entries.some((e) => e.dayOfWeek === 'Bảy');
  const printDays = hasSaturday ? DAYS_OF_WEEK : DAYS_OF_WEEK.filter((d) => d.id !== 'Bảy');

  // Map entries
  const entryMap = new Map<string, TimetableEntry>();
  for (const e of entries) {
    entryMap.set(`${e.dayOfWeek}_${e.session}_${e.period}`, e);
  }

  const morningPeriods = [1, 2, 3, 4, 5];
  const afternoonPeriods = [1, 2, 3, 4, 5];

  // In trực tiếp ra máy in / PDF
  const handlePrint = () => {
    window.print();
  };

  // Xuất file ảnh PNG độ nét cao
  const handleExportPng = async () => {
    if (!printSheetRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Độ phân giải x2 siêu nét
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      const safeName = (name || 'ThoiKhoaBieu').replace(/\s+/g, '_');
      link.download = `TKB_${type === 'teacher' ? 'GV_' : 'Lop_'}${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Lỗi khi xuất ảnh TKB:', err);
      alert('Không thể tạo ảnh, vui lòng thử dùng tính năng In trực tiếp.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* 1. Modal Overlay & Preview trên màn hình */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:hidden animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header Modal */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Xem Trước & In Thời Khóa Biểu (A4 Ngang)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chuẩn hóa co giãn vừa vặn 100% trong 1 trang giấy A4 hoặc xuất ảnh Zalo
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="px-5 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            {/* Tỉ lệ thu phóng */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-500">Thu phóng:</span>
              <button
                onClick={() => setScale((s) => Math.max(70, s - 10))}
                className="p-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold w-10 text-center font-mono">{scale}%</span>
              <button
                onClick={() => setScale((s) => Math.min(130, s + 10))}
                className="p-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setScale(100)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer font-bold"
              >
                Mặc định
              </button>
            </div>

            {/* Nút hành động chính */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPng}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Lưu thành ảnh PNG sắc nét để gửi Zalo hoặc đặt hình nền"
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Xuất file ảnh (PNG)</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/25 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In A4 (Khổ ngang)</span>
              </button>
            </div>
          </div>

          {/* Khung Cuộn Xem Trước Tờ A4 (Print Preview Paper) */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-200/70 dark:bg-slate-950 flex justify-center items-start">
            <div
              style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150"
            >
              {/* Tờ giấy A4 Ngang mô phỏng (297mm x 210mm) */}
              <div
                ref={printSheetRef}
                className="w-[1020px] min-h-[660px] bg-white text-slate-900 p-6 shadow-2xl rounded-sm border border-slate-300 font-sans flex flex-col justify-between"
              >
                {/* 1. Tiêu đề chuẩn form mẫu trường học */}
                <div>
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
                    <div className="text-left space-y-0.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        {schoolName || 'TRƯỜNG TRUNG HỌC CƠ SỞ'}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {subTitle || 'Thời Khóa Biểu Giảng Dạy Chính Khóa'}
                      </p>
                    </div>

                    <div className="text-center">
                      <h2 className="text-lg font-black uppercase tracking-wider text-blue-900">
                        THỜI KHÓA BIỂU {type === 'teacher' ? 'GIÁO VIÊN' : 'LỚP HỌC'}
                      </h2>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">
                        {type === 'teacher' ? `Thầy/Cô: ${name}` : `Lớp: ${name}`}
                        {subjects.length > 0 && ` • Môn: ${subjects.join(', ')}`}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-medium">
                      <p>Tổng số: <strong className="font-bold text-slate-900">{entries.length} tiết/tuần</strong></p>
                      <p>Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* 2. Bảng Thời Khóa Biểu Tuần Chuẩn A4 */}
                  <table className="w-full border-collapse border border-slate-800 text-center text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-black">
                        <th className="border border-slate-800 py-1.5 px-2 w-20">Tiết / Giờ</th>
                        {printDays.map((d) => (
                          <th key={d.id} className="border border-slate-800 py-1.5 px-2">
                            {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Buổi Sáng */}
                      <tr className="bg-slate-50 font-bold text-[11px] text-left">
                        <td colSpan={printDays.length + 1} className="border border-slate-800 py-1 px-3 bg-amber-50 text-amber-950 font-black">
                          ☀️ BUỔI SÁNG
                        </td>
                      </tr>
                      {morningPeriods.map((period) => {
                        const time = DEFAULT_PERIOD_TIMES.Sáng[period];
                        return (
                          <tr key={`print_m_${period}`} className="h-10">
                            <td className="border border-slate-800 font-bold bg-slate-50 text-[11px]">
                              <div>Tiết {period}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{time.start}</div>
                            </td>
                            {printDays.map((d) => {
                              const entry = entryMap.get(`${d.id}_Sáng_${period}`);
                              return (
                                <td key={`m_${d.id}_${period}`} className="border border-slate-800 p-1 align-middle">
                                  {entry ? (
                                    <div className="font-bold">
                                      <div className="text-xs text-blue-900 font-black leading-tight">
                                        {entry.subject}
                                      </div>
                                      <div className="text-[11px] text-slate-700 font-extrabold mt-0.5">
                                        {type === 'teacher' ? `Lớp ${entry.className}` : (entry.teacher || '')}
                                      </div>
                                      {entry.room && (
                                        <div className="text-[9px] text-slate-500">P.{entry.room}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {/* Buổi Chiều */}
                      <tr className="bg-slate-50 font-bold text-[11px] text-left">
                        <td colSpan={printDays.length + 1} className="border border-slate-800 py-1 px-3 bg-indigo-50 text-indigo-950 font-black">
                          🌙 BUỔI CHIỀU
                        </td>
                      </tr>
                      {afternoonPeriods.map((period) => {
                        const time = DEFAULT_PERIOD_TIMES.Chiều[period];
                        return (
                          <tr key={`print_a_${period}`} className="h-10">
                            <td className="border border-slate-800 font-bold bg-slate-50 text-[11px]">
                              <div>Tiết {period}</div>
                              <div className="text-[10px] text-slate-500 font-normal">{time.start}</div>
                            </td>
                            {printDays.map((d) => {
                              const entry = entryMap.get(`${d.id}_Chiều_${period}`);
                              return (
                                <td key={`a_${d.id}_${period}`} className="border border-slate-800 p-1 align-middle">
                                  {entry ? (
                                    <div className="font-bold">
                                      <div className="text-xs text-blue-900 font-black leading-tight">
                                        {entry.subject}
                                      </div>
                                      <div className="text-[11px] text-slate-700 font-extrabold mt-0.5">
                                        {type === 'teacher' ? `Lớp ${entry.className}` : (entry.teacher || '')}
                                      </div>
                                      {entry.room && (
                                        <div className="text-[9px] text-slate-500">P.{entry.room}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Chữ Ký */}
                <div className="mt-4 pt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="italic">Hệ thống Quản lý Giáo dục - Sổ Tay Béo</span>
                  <div className="flex gap-16 font-bold text-center pr-8">
                    <div>
                      <p>Người lập biểu</p>
                      <div className="h-10" />
                    </div>
                    <div>
                      <p>Ban Giám Hiệu duyệt</p>
                      <div className="h-10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cấu hình In Thực Tế (CSS @media print chuyên dụng A4 Ngang) */}
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 6mm 8mm;
        }
        @media print {
          /* Ẩn tất cả mọi thứ trên trang ngoại trừ tờ in A4 */
          body * {
            visibility: hidden !important;
          }
          #print-sheet-actual, #print-sheet-actual * {
            visibility: visible !important;
          }
          #print-sheet-actual {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Sheet HTML được in trực tiếp khi gọi window.print() */}
      <div id="print-sheet-actual" className="hidden print:block p-4 bg-white text-black font-sans">
        <div className="border-b-2 border-black pb-2 mb-2 flex items-start justify-between">
          <div>
            <h4 className="text-[11px] font-black uppercase">{schoolName || 'TRƯỜNG TRUNG HỌC CƠ SỞ'}</h4>
            <p className="text-[10px] text-gray-600">{subTitle || 'Thời Khóa Biểu Giảng Dạy Chính Khóa'}</p>
          </div>
          <div className="text-center">
            <h2 className="text-base font-black uppercase tracking-wider">
              THỜI KHÓA BIỂU {type === 'teacher' ? 'GIÁO VIÊN' : 'LỚP HỌC'}
            </h2>
            <p className="text-xs font-bold">
              {type === 'teacher' ? `Thầy/Cô: ${name}` : `Lớp: ${name}`}
              {subjects.length > 0 && ` (${subjects.join(', ')})`}
            </p>
          </div>
          <div className="text-right text-[10px] text-gray-600">
            <p>Tổng: <strong>{entries.length} tiết/tuần</strong></p>
            <p>Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-center text-[10px]">
          <thead>
            <tr className="bg-gray-100 font-black">
              <th className="border border-black py-1 px-1 w-16">Tiết / Giờ</th>
              {printDays.map((d) => (
                <th key={d.id} className="border border-black py-1 px-1">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="font-bold text-left bg-gray-50">
              <td colSpan={printDays.length + 1} className="border border-black py-0.5 px-2 font-black">
                ☀️ BUỔI SÁNG
              </td>
            </tr>
            {morningPeriods.map((period) => {
              const time = DEFAULT_PERIOD_TIMES.Sáng[period];
              return (
                <tr key={`print_real_m_${period}`} className="h-8">
                  <td className="border border-black font-bold">
                    T.{period} ({time.start})
                  </td>
                  {printDays.map((d) => {
                    const entry = entryMap.get(`${d.id}_Sáng_${period}`);
                    return (
                      <td key={`real_m_${d.id}_${period}`} className="border border-black p-0.5 align-middle">
                        {entry ? (
                          <div>
                            <span className="font-black text-[11px] block">{entry.subject}</span>
                            <span className="font-bold text-[10px] text-gray-800">
                              {type === 'teacher' ? `Lớp ${entry.className}` : (entry.teacher || '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            <tr className="font-bold text-left bg-gray-50">
              <td colSpan={printDays.length + 1} className="border border-black py-0.5 px-2 font-black">
                🌙 BUỔI CHIỀU
              </td>
            </tr>
            {afternoonPeriods.map((period) => {
              const time = DEFAULT_PERIOD_TIMES.Chiều[period];
              return (
                <tr key={`print_real_a_${period}`} className="h-8">
                  <td className="border border-black font-bold">
                    T.{period} ({time.start})
                  </td>
                  {printDays.map((d) => {
                    const entry = entryMap.get(`${d.id}_Chiều_${period}`);
                    return (
                      <td key={`real_a_${d.id}_${period}`} className="border border-black p-0.5 align-middle">
                        {entry ? (
                          <div>
                            <span className="font-black text-[11px] block">{entry.subject}</span>
                            <span className="font-bold text-[10px] text-gray-800">
                              {type === 'teacher' ? `Lớp ${entry.className}` : (entry.teacher || '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-2 flex items-center justify-between text-[9px] text-gray-500">
          <span>Sổ Tay Béo - Quản lý Giáo dục</span>
          <div className="flex gap-12 font-bold text-center pr-4">
            <span>Người lập biểu</span>
            <span>Ban Giám Hiệu</span>
          </div>
        </div>
      </div>
    </>
  );
};
