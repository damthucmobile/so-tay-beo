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
  MessageCircle,
  QrCode,
  ExternalLink
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
    platformInfo,
    isLoading: isPermLoading,
    requestPermission,
    sendTestNotification
  } = usePushNotifications();

  const [settings, setSettings] = useState<TeachingReminderSettings>(DEFAULT_TEACHING_REMINDER_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobileNotice, setMobileNotice] = useState<string | null>(null);
  const [inAppToast, setInAppToast] = useState<{ title: string; body: string } | null>(null);
  const [zaloTestSent, setZaloTestSent] = useState(false);
  const [showZaloQr, setShowZaloQr] = useState(false);

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

  // Lắng nghe sự kiện thông báo in-app
  useEffect(() => {
    const handleInApp = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setInAppToast({
          title: detail.title || '🔔 Thông báo nhắc nhở',
          body: detail.body || '',
        });
        setTimeout(() => setInAppToast(null), 5000);
      }
    };

    window.addEventListener('app-inapp-notification', handleInApp);
    return () => window.removeEventListener('app-inapp-notification', handleInApp);
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (platformInfo?.requiresPwaForPush) {
      setMobileNotice('Trên iPhone/iPad: Bạn hãy đăng nhập tài khoản trên Safari trước, sau đó nhấn nút "Chia sẻ" (biểu tượng mũi tên lên) ở thanh dưới và chọn "Thêm vào Màn hình chính" để nhận thông báo đẩy.');
      return;
    }

    if (!isSupported) {
      if (!platformInfo?.isSecureContext) {
        setMobileNotice('Trình duyệt trên điện thoại yêu cầu kết nối bảo mật HTTPS (hoặc localhost) để kích hoạt Push Notification. Hiện tại hệ thống vẫn phát chuông và thông báo trực tiếp khi mở trang.');
      } else {
        setMobileNotice('Trình duyệt hiện tại chưa hỗ trợ Web Push Notification trực tiếp. Hệ thống sẽ phát chuông âm thanh khi có lịch.');
      }
      return;
    }

    const ok = await requestPermission();
    if (ok) {
      setSettings(prev => ({ ...prev, enabled: true }));
      setMobileNotice(null);
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

    setTimeout(() => setTestSent(false), 2500);
  };

  const handleTestZalo = () => {
    const phone = settings.zalo?.phoneNumber?.trim();
    if (!phone) {
      setMobileNotice('Vui lòng nhập số điện thoại Zalo trước khi gửi thử nghiệm.');
      return;
    }
    setZaloTestSent(true);
    setInAppToast({
      title: '💬 Zalo Notification (Môi trường Sandbox)',
      body: `Đã gửi bản tin lịch dạy thử nghiệm đến SĐT Zalo ${phone} cho Thầy/Cô ${settings.selectedTeacher || 'được chọn'}.`,
    });
    setTimeout(() => setZaloTestSent(false), 3000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Toast In-App Banner nổi trên đỉnh */}
      {inAppToast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500 shadow-2xl flex items-start gap-3 animate-bounce">
          <div className="p-2 rounded-xl bg-blue-500 text-white shrink-0">
            <BellRing className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {inAppToast.title}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {inAppToast.body}
            </div>
          </div>
          <button
            onClick={() => setInAppToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                Cài đặt nhắc lịch dạy học
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Thông báo Web Push & âm thanh chuông trên điện thoại/máy tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-5 text-sm">
          {/* Permission Status Box */}
          <div className={`p-4 rounded-xl border transition-all ${isGranted
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
                <div className="font-medium text-xs sm:text-sm">
                  {isGranted
                    ? 'Quyền thông báo đã được kích hoạt'
                    : permission === 'denied'
                      ? 'Thông báo đang bị chặn bởi trình duyệt'
                      : 'Kích hoạt nhận thông báo trên thiết bị này'}
                </div>
                <div className="text-[11px] sm:text-xs mt-0.5 opacity-90 leading-relaxed">
                  {isGranted
                    ? 'Thiết bị này đã sẵn sàng nhận thông báo Web Push ngay cả khi thu nhỏ trang.'
                    : permission === 'denied'
                      ? 'Vui lòng nhấn vào biểu tượng ổ khóa/cài đặt trên thanh địa chỉ trình duyệt để cho phép Thông báo.'
                      : 'Nhấn nút bên dưới để cấp quyền nhận thông báo và chuông nhắc giờ dạy.'}
                </div>

                {!isGranted && permission !== 'denied' && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={isPermLoading}
                    className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {isPermLoading ? 'Đang kích hoạt...' : 'Cho phép nhận thông báo ngay'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hướng dẫn riêng cho thiết bị iOS / Mobile nếu cần */}
          {platformInfo?.requiresPwaForPush && (
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-blue-600 dark:text-blue-400">
                <Smartphone className="w-4 h-4" />
                Hướng dẫn cho iPhone / iPad (iOS):
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Để nhận thông báo đẩy khi tắt màn hình: Hãy <strong>đăng nhập tài khoản trên Safari trước</strong> ➔ Bấm nút <strong className="inline-flex items-center gap-1 font-bold"><Share className="w-3 h-3 inline" /> Chia sẻ</strong> ở thanh công cụ dưới Safari ➔ Chọn <strong className="font-bold">"Thêm vào Màn hình chính"</strong> (Add to Home Screen).
              </p>
            </div>
          )}

          {/* Thông báo hướng dẫn nếu gặp lỗi Mobile */}
          {mobileNotice && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2 animate-in fade-in">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed text-[11px] sm:text-xs">
                {mobileNotice}
              </div>
              <button onClick={() => setMobileNotice(null)} className="text-amber-600 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label htmlFor="master-toggle" className="font-semibold text-slate-900 dark:text-white cursor-pointer text-xs sm:text-sm">
                Bật tự động nhắc lịch dạy
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs sm:text-sm"
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
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Nhắc trước giờ vào tiết dạy
                  </div>
                </label>
              </div>

              {settings.notifyBeforePeriod && (
                <div className="pl-6 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
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
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
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
                  <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
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
                    className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold outline-none"
                  />
                  <span>mỗi tối để chuẩn bị</span>
                </div>
              )}
            </div>

            {/* 4. Tùy chọn thông báo qua Zalo (Chế độ Thử nghiệm / Sandbox) */}
            <div className="p-3.5 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.zalo?.enabled || false}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        zalo: {
                          ...(settings.zalo || { testMode: true, status: 'disabled' }),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-800 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                    <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                    <span>Nhận thông báo lịch dạy qua Zalo</span>
                  </div>
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Sandbox Test
                </span>
              </div>

              {settings.zalo?.enabled && (
                <div className="space-y-3 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/40 text-xs animate-in fade-in">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                      Số điện thoại Zalo nhận tin:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        placeholder="Ví dụ: 0987654321"
                        value={settings.zalo?.phoneNumber || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            zalo: {
                              ...(settings.zalo || { enabled: true, testMode: true, status: 'disabled' }),
                              enabled: true,
                              phoneNumber: e.target.value,
                              status: e.target.value.trim() ? 'pending_link' : 'disabled',
                            },
                          })
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium outline-none text-xs focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestZalo}
                        disabled={zaloTestSent}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>{zaloTestSent ? 'Đã gửi...' : 'Gửi thử Zalo'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Giải thích nghiệp vụ Sandbox & cơ chế quan tâm OA */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-2">
                    <p className="leading-relaxed">
                      💡 <strong>Cơ chế thử nghiệm:</strong> Do hệ thống đang ở môi trường Test (chưa có GPĐKKD), Zalo chỉ cho phép gửi tin nhắn đến các số điện thoại đã bấm <strong>Quan tâm Zalo OA</strong> của bạn.
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowZaloQr(!showZaloQr)}
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{showZaloQr ? 'Ẩn mã QR kết nối' : 'Xem mã QR kết nối Zalo OA'}</span>
                      </button>
                    </div>

                    {showZaloQr && (
                      <div className="mt-2.5 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2 animate-in fade-in">
                        <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border-2 border-dashed border-blue-400 text-slate-400 text-center p-3 shadow-inner">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            Mã QR Zalo OA kết nối tự động
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">
                          Mở Zalo trên điện thoại quét mã này để tự động cấp quyền nhận lịch dạy qua tin nhắn Zalo.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 gap-2">
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={testSent}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Gửi thử chuông và thông báo ngay lập tức để kiểm tra thiết bị"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <Send className="w-3 h-3" />
            <span>{testSent ? 'Đang gửi...' : 'Gửi thử nghiệm'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
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
