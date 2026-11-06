// features/health/components/EditCheckupModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Building2,
  Award,
  ShieldAlert,
  FileCheck2,
  Stethoscope,
  Heart,
  Eye,
  Smile,
  Ear,
  Shield,
  Activity,
} from 'lucide-react';
import { useHealthStore } from '../stores/useHealthStore';
import { HealthCheckupSession } from '../types';

interface EditCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkup: HealthCheckupSession | null;
}

export const EditCheckupModal: React.FC<EditCheckupModalProps> = ({
  isOpen,
  onClose,
  checkup,
}) => {
  const { updateCheckup } = useHealthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [checkupDate, setCheckupDate] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [healthClassification, setHealthClassification] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [clinicalConclusion, setClinicalConclusion] = useState('');

  // Specialties
  const [internalMedicine, setInternalMedicine] = useState('');
  const [surgery, setSurgery] = useState('');
  const [ophthalmology, setOphthalmology] = useState('');
  const [dental, setDental] = useState('');
  const [ent, setEnt] = useState('');
  const [dermatology, setDermatology] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (checkup) {
      setTitle(checkup.title || '');
      setCheckupDate(checkup.checkupDate || '');
      setHospitalName(checkup.hospitalName || '');
      setDoctorName(checkup.doctorName || '');
      setHealthClassification(checkup.healthClassification || '');
      setFamilyHistory(checkup.familyHistory || '');
      setClinicalConclusion(checkup.clinicalConclusion || '');
      setInternalMedicine(checkup.specialtiesSummary?.internalMedicine || '');
      setSurgery(checkup.specialtiesSummary?.surgery || '');
      setOphthalmology(checkup.specialtiesSummary?.ophthalmology || '');
      setDental(checkup.specialtiesSummary?.dental || '');
      setEnt(checkup.specialtiesSummary?.ent || '');
      setDermatology(checkup.specialtiesSummary?.dermatology || '');
      setNotes(checkup.notes || '');
    }
  }, [checkup, isOpen]);

  if (!isOpen || !checkup) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCheckup(checkup.id, {
        title: title.trim(),
        checkupDate,
        hospitalName: hospitalName.trim(),
        doctorName: doctorName.trim() || undefined,
        healthClassification: healthClassification.trim() || undefined,
        familyHistory: familyHistory.trim() || undefined,
        clinicalConclusion: clinicalConclusion.trim() || undefined,
        specialtiesSummary: {
          internalMedicine: internalMedicine.trim() || undefined,
          surgery: surgery.trim() || undefined,
          ophthalmology: ophthalmology.trim() || undefined,
          dental: dental.trim() || undefined,
          ent: ent.trim() || undefined,
          dermatology: dermatology.trim() || undefined,
        },
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error('Lỗi cập nhật đợt khám:', err);
      alert(err.message || 'Lỗi khi cập nhật đợt khám');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cập Nhật Kết Quả & Kết Luận Đợt Khám
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bổ sung chẩn đoán lâm sàng, chuyên khoa và phân loại sức khỏe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên Đợt Khám
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bệnh Viện / Cơ Sở Khám
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ngày Khám
              </label>
              <input
                type="date"
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bác Sĩ Kết Luận / Phụ Trách
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="VD: BS. Vũ Thùy Linh"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Phân Loại Sức Khỏe Chung</span>
              </label>
              <input
                type="text"
                value={healthClassification}
                onChange={(e) => setHealthClassification(e.target.value)}
                placeholder="VD: Loại 1, Loại 2 (Đủ sức khỏe làm việc)..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Tiền Sử Gia Đình / Yếu Tố Nguy Cơ</span>
              </label>
              <input
                type="text"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="VD: Bố tiểu đường, Mẹ cao huyết áp..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kết Luận / Lời Dặn Của Bác Sĩ
              </label>
              <textarea
                rows={2}
                value={clinicalConclusion}
                onChange={(e) => setClinicalConclusion(e.target.value)}
                placeholder="VD: Nhân thùy phải tuyến giáp TIRADS 3 theo dõi 6 tháng, khám nha khoa định kỳ..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Specialties Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
              <span>Khám Lâm Sàng Chuyên Khoa</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ngoại Khoa (Tuyến Giáp, Cơ Xương...)</span>
                </label>
                <input
                  type="text"
                  value={surgery}
                  onChange={(e) => setSurgery(e.target.value)}
                  placeholder="VD: Nhân thùy phải TIRADS 3..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mắt (Thị Lực, Khúc Xạ)</span>
                </label>
                <input
                  type="text"
                  value={ophthalmology}
                  onChange={(e) => setOphthalmology(e.target.value)}
                  placeholder="VD: MP không kính 5/10 (có kính 10/10), MT 10/10..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-amber-500" />
                  <span>Răng Hàm Mặt</span>
                </label>
                <input
                  type="text"
                  value={dental}
                  onChange={(e) => setDental(e.target.value)}
                  placeholder="VD: Sâu răng 26, 36. Cao răng viêm lợi..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Ear className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tai Mũi Họng</span>
                </label>
                <input
                  type="text"
                  value={ent}
                  onChange={(e) => setEnt(e.target.value)}
                  placeholder="VD: Viêm mũi dị ứng, viêm amydan mạn..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nội Khoa (Tim, Phổi, Bụng...)</span>
                </label>
                <input
                  type="text"
                  value={internalMedicine}
                  onChange={(e) => setInternalMedicine(e.target.value)}
                  placeholder="VD: Tim đều T1T2 rõ, rì rào phế nang êm..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Da Liễu</span>
                </label>
                <input
                  type="text"
                  value={dermatology}
                  onChange={(e) => setDermatology(e.target.value)}
                  placeholder="VD: Bình thường, không tổn thương..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú Thêm
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Khám theo gói bảo hiểm công ty, tái khám sau 6 tháng..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
