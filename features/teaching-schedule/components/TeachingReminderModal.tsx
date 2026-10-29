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
  Smartphone,
  Share,
  Volume2,
  Info,
  CalendarCheck,
  Sparkles,
} from 'lucide-react';
import { SchoolTimetable, TeachingReminderSettings } from '../types';
import { TeachingReminderService, DEFAULT_TEACHING_REMINDER_SETTINGS } from '../services/teachingReminderService';
import { usePushNotifications, PushNotificationService } from '@/core/notifications';
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
    platformInfo,
    isLoading: isPermLoading,
    requestPermission,
    sendTestNotification,
  } = usePushNotifications();

  const [settings, setSettings] = useState<TeachingReminderSettings>(DEFAULT_TEACHING_REMINDER_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobileNotice, setMobileNotice] = useState<string | null>(null);

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
    if (platformInfo?.requiresPwaForPush) {
      setMobileNotice(
        'Trên iPhone/iPad: Vui lòng mở Safari > nhấn nút "Chia sẻ" (biểu tượng mũi tên lên) > chọn "Thêm vào Màn hình chính" để nhận thông báo đẩy khi đóng màn hình.'
      );
      return;
    }

    if (!isSupported) {
      if (!platformInfo?.isSecureContext) {
        setMobileNotice(
          'Trình duyệt yêu cầu kết nối bảo mật HTTPS (hoặc localhost) để kích hoạt Push Notification. Hệ thống vẫn phát chuông và thông báo trực tiếp khi mở ứng dụng.'
        );
      } else {
        setMobileNotice('Trình duyệt hiện tại chưa hỗ trợ Web Push Notification trực tiếp. Hệ thống sẽ phát chuông âm thanh khi có lịch.');
      }
      return;
    }

    const ok = await requestPermission();
    if (ok) {
      setSettings((prev) => ({ ...prev, enabled: true }));
      setMobileNotice(null);
    }
  };

  const handleTestSound = () => {
    PushNotificationService.playNotificationSound();
  };

  const handleTestNotification = async () => {
    const teacherName = settings.selectedTeacher || 'Thầy/Cô';
    setTestSent(true);

    await sendTestNotification({
      title: `⏰ Sắp đến giờ vào lớp: ${teacherName}!`,
      body: `Thầy/Cô có tiết dạy môn Toán lớp 10A1 lúc 07:45. Nhấn vào thông báo này để mở lịch dạy!`,
      url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(teacherName)}`,
      data: {
        url: `/?tab=teaching_schedule&teacher=${encodeURIComponent(teacherName)}`,
        tab: 'teaching_schedule',
        teacher: teacherName,
      },
    });

    setTimeout(() => setTestSent(false), 2500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await TeachingReminderService.saveSettings(settings, user?.uid);
      setSaveSuccess(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-teaching-settings-updated', { detail: settings }));
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Lỗi lưu cài đặt nhắc lịch:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cài đặt nhắc lịch dạy học
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thông báo Web Push & chuông nhắc giờ giảng dạy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 text-sm">
          {/* Permission Status Box */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isGranted
                ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                : permission === 'denied'
                ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                : 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {isGranted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : permission === 'denied' ? (
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-xs sm:text-sm">
                  {isGranted
                    ? 'Quyền thông báo Web Push đã sẵn sàng'
                    : permission === 'denied'
                    ? 'Thông báo đang bị chặn bởi trình duyệt'
                    : 'Kích hoạt nhận thông báo trên thiết bị này'}
                </div>
                <div className="text-[11px] sm:text-xs mt-0.5 opacity-90 leading-relaxed">
                  {isGranted
                    ? 'Thiết bị này đã sẵn sàng nhận thông báo khi đến giờ dạy ngay cả khi thu nhỏ trình duyệt.'
                    : permission === 'denied'
                    ? 'Vui lòng nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt để Bật thông báo.'
                    : 'Bấm nút bên dưới để cấp quyền nhận thông báo và chuông nhắc giờ giảng dạy.'}
                </div>

                {!isGranted && permission !== 'denied' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={isPermLoading}
                    className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {isPermLoading ? 'Đang kích hoạt...' : 'Bật thông báo ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hướng dẫn iOS nếu cần */}
          {platformInfo?.requiresPwaForPush && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-blue-600 dark:text-blue-400">
                <Smartphone className="w-4 h-4" />
                Hướng dẫn cho iPhone / iPad (iOS):
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Trên Safari, bấm nút{' '}
                <strong className="inline-flex items-center gap-1 font-bold">
                  <Share className="w-3 h-3 inline" /> Chia sẻ
                </strong>{' '}
                ở thanh công cụ ➔ Chọn{' '}
                <strong className="font-bold">&quot;Thêm vào Màn hình chính&quot;</strong> (Add to Home Screen) để nhận thông báo đẩy.
              </p>
            </div>
          )}

          {mobileNotice && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">{mobileNotice}</div>
              <button onClick={() => setMobileNotice(null)} className="text-amber-600 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Master Switch Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label
                htmlFor="master-toggle"
                className="font-bold text-slate-900 dark:text-white cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
              >
                <span>Bật tự động nhắc lịch dạy</span>
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tự động kiểm tra thời khóa biểu và đẩy thông báo cho Thầy/Cô
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
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Giáo viên nhận thông báo nhắc lịch:
            </label>
            <select
              value={settings.selectedTeacher || ''}
              onChange={(e) => setSettings({ ...settings, selectedTeacher: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
            >
              <option value="">-- Chọn giáo viên --</option>
              {timetable?.teachers.map((t) => (
                <option key={t} value={t}>
                  Thầy/Cô: {t}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hệ thống sẽ lọc thời khóa biểu theo đúng tên Thầy/Cô để gửi thông báo chính xác.
            </p>
          </div>

          {/* Detailed Reminder Options */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Các mốc thời gian nhắc nhở thông minh
            </h4>

            {/* 1. Nhắc trước giờ vào tiết */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyBeforePeriod}
                    onChange={(e) => setSettings({ ...settings, notifyBeforePeriod: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Nhắc trước giờ vào lớp từng tiết dạy
                  </div>
                </label>
              </div>

              {settings.notifyBeforePeriod && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                  <span>Báo trước:</span>
                  <select
                    value={settings.minutesBeforePeriod}
                    onChange={(e) => setSettings({ ...settings, minutesBeforePeriod: Number(e.target.value) })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                  >
                    <option value={5}>5 phút</option>
                    <option value={10}>10 phút</option>
                    <option value={15}>15 phút (Khuyên dùng)</option>
                    <option value={20}>20 phút</option>
                    <option value={30}>30 phút</option>
                  </select>
                  <span>kèm thông tin lớp dạy và môn học</span>
                </div>
              )}
            </div>

            {/* 2. Bản tin sáng */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyMorningBrief}
                    onChange={(e) => setSettings({ ...settings, notifyMorningBrief: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    <Sun className="w-4 h-4 text-orange-500" />
                    Bản tin tổng hợp lịch dạy sáng nay
                  </div>
                </label>
              </div>

              {settings.notifyMorningBrief && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                  <span>Gửi lúc:</span>
                  <input
                    type="time"
                    value={settings.morningBriefTime}
                    onChange={(e) => setSettings({ ...settings, morningBriefTime: e.target.value })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                  />
                  <span>mỗi sáng (tóm tắt tổng số tiết & các lớp)</span>
                </div>
              )}
            </div>

            {/* 3. Bản tin tối */}
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifyEveningBrief}
                    onChange={(e) => setSettings({ ...settings, notifyEveningBrief: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800"
                  />
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    Chuẩn bị giáo án ngày mai (Tối hôm trước)
                  </div>
                </label>
              </div>

              {settings.notifyEveningBrief && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                  <span>Gửi lúc:</span>
                  <input
                    type="time"
                    value={settings.eveningBriefTime}
                    onChange={(e) => setSettings({ ...settings, eveningBriefTime: e.target.value })}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold outline-none"
                  />
                  <span>mỗi tối để chuẩn bị giáo án</span>
                </div>
              )}
            </div>

            {/* Âm thanh chuông báo */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    Âm thanh chuông thông báo
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Phát chuông báo hiệu khi có thông báo lịch dạy
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestSound}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-sm"
              >
                Nghe thử chuông
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 gap-2">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={testSent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/50 transition cursor-pointer shrink-0 shadow-sm"
            title="Gửi thử chuông và thông báo để bấm kiểm tra chuyển lịch"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testSent ? 'Đang gửi thử...' : 'Gửi thử thông báo'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
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
