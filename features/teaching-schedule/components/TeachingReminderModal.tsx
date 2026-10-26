// features/teaching-schedule/components/TeachingReminderModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  Clock, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ShieldAlert, 
  User, 
  Save,
  Sparkles
} from 'lucide-react';
import { SchoolTimetable, TeachingReminderSettings } from '../types';
import { TeachingReminderService, DEFAULT_TEACHING_REMINDER_SETTINGS } from '../services/teachingReminderService';
import { usePushNotifications } from '@/core/notifications';
import { useAuth } from '@/core/firebase';

interface TeachingReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: SchoolTimetable | null;
  defaultTeacher?: string;
}

export const TeachingReminderModal: React.FC<TeachingReminderModalProps> = ({
  isOpen,
  onClose,
  timetable,
  defaultTeacher = '',
}) => {
  const { user } = useAuth();
  const { 
    permission, 
    isSupported, 
    isGranted, 
    isLoading: isPermLoading, 
    requestPermission, 
    sendTestNotification 
  } = usePushNotifications();

  const [settings, setSettings] = useState<TeachingReminderSettings>(DEFAULT_TEACHING_REMINDER_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing settings when modal opens
  useEffect(() => {
    if (!isOpen) return;

    TeachingReminderService.getSettings(user?.uid).then((loaded) => {
      setSettings((prev) => ({
        ...prev,
        ...loaded,
        selectedTeacher: loaded.selectedTeacher || defaultTeacher || (timetable?.teachers?.[0] || ''),
      }));
    });
  }, [isOpen, user?.uid, defaultTeacher, timetable?.teachers]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const ok = await requestPermission();
    if (ok) {
      setSettings(prev => ({ ...prev, enabled: true }));
    }
  };

  const handleTestNotification = async () => {
    const teacherName = settings.selectedTeacher || 'Thầy/Cô';
    setTestSent(true);
    await sendTestNotification({
      title: '🔔 Thông báo thử nghiệm thành công!',
      body: `Hệ thống nhắc lịch dạy của Sổ Tay Béo cho Thầy/Cô ${teacherName} đã sẵn sàng hoạt động.`,
      url: '/?tab=teaching_schedule',
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await TeachingReminderService.saveSettings(settings, user?.uid);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Lỗi khi lưu cài đặt:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug">
                Cài đặt nhắc lịch dạy học
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thông báo Web Push & trực tiếp trên điện thoại/máy tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {/* Permission Status Box */}
          <div className={`p-4 rounded-xl border transition-all ${
            isGranted
              ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
              : permission === 'denied'
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
              : 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {isGranted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : permission === 'denied' ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-medium">
                  {isGranted
                    ? 'Quyền thông báo đã được kích hoạt'
                    : permission === 'denied'
                    ? 'Thông báo đang bị chặn bởi trình duyệt'
                    : 'Cần cấp quyền nhận thông báo'}
                </div>
                <div className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {isGranted
                    ? 'Thiết bị này đã sẵn sàng nhận thông báo Web Push ngay cả khi thu nhỏ trang.'
                    : permission === 'denied'
                    ? 'Vui lòng nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt để cho phép Thông báo.'
                    : 'Nhấn nút bên dưới để cấp quyền cho phép hệ thống gửi thông báo nhắc tiết dạy.'}
                </div>

                {!isGranted && permission !== 'denied' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={isPermLoading || !isSupported}
                    className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {isPermLoading ? 'Đang xin quyền...' : 'Cho phép nhận thông báo ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label htmlFor="master-toggle" className="font-semibold text-slate-900 dark:text-white cursor-pointer">
                Bật tự động nhắc lịch dạy
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kích hoạt hệ thống theo dõi và đẩy thông báo tiết dạy cho Thầy/Cô
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="master-toggle"
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Teacher Selection */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Giáo viên nhận thông báo nhắc lịch:
            </label>
            <select
              value={settings.selectedTeacher || ''}
              onChange={(e) => setSettings({ ...settings, selectedTeacher: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">-- Chọn giáo viên --</option>
              {timetable?.teachers.map((t) => (
                <option key={t} value={t}>
                  Thầy/Cô: {t}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hệ thống sẽ lọc thời khóa biểu theo đúng tên Thầy/Cô để nhắc lịch.
            </p>
          </div>

          {/* Detailed Reminder Options */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tùy chọn thời điểm nhắc nhở
            </h4>

            {/* 1. Nhắc trước giờ vào tiết */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyBeforePeriod}
                    onChange={(e) => setSettings({ ...settings, notifyBeforePeriod: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Nhắc trước giờ vào tiết dạy
                  </div>
                </label>
              </div>

              {settings.notifyBeforePeriod && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Báo trước:</span>
                  <select
                    value={settings.minutesBeforePeriod}
                    onChange={(e) => setSettings({ ...settings, minutesBeforePeriod: Number(e.target.value) })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                  >
                    <option value={10}>10 phút</option>
                    <option value={15}>15 phút (Khuyên dùng)</option>
                    <option value={20}>20 phút</option>
                    <option value={30}>30 phút</option>
                    <option value={45}>45 phút</option>
                  </select>
                  <span>kèm lớp dạy và môn học</span>
                </div>
              )}
            </div>

            {/* 2. Bản tin sáng */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyMorningBrief}
                    onChange={(e) => setSettings({ ...settings, notifyMorningBrief: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <Sun className="w-4 h-4 text-orange-500" />
                    Bản tin tổng hợp lịch dạy sáng nay
                  </div>
                </label>
              </div>

              {settings.notifyMorningBrief && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Gửi lúc:</span>
                  <input
                    type="time"
                    value={settings.morningBriefTime}
                    onChange={(e) => setSettings({ ...settings, morningBriefTime: e.target.value })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                  />
                  <span>hàng ngày (Tổng số tiết & danh sách lớp)</span>
                </div>
              )}
            </div>

            {/* 3. Bản tin tối */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyEveningBrief}
                    onChange={(e) => setSettings({ ...settings, notifyEveningBrief: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Chuẩn bị giáo án ngày mai (Tối hôm trước)
                  </div>
                </label>
              </div>

              {settings.notifyEveningBrief && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span>Gửi lúc:</span>
                  <input
                    type="time"
                    value={settings.eveningBriefTime}
                    onChange={(e) => setSettings({ ...settings, eveningBriefTime: e.target.value })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                  />
                  <span>mỗi tối để chuẩn bị</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={!isGranted || testSent}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Gửi thử một thông báo ngay lập tức để kiểm tra thiết bị"
          >
            <Send className="w-3.5 h-3.5" />
            {testSent ? 'Đã gửi thử nghiệm!' : 'Gửi thử nghiệm'}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  Đã lưu!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
