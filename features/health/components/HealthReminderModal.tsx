// features/health/components/HealthReminderModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Droplets,
  Dumbbell,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { HealthReminderSettings } from '../types';
import { HealthReminderService, DEFAULT_HEALTH_REMINDER_SETTINGS } from '../services/healthReminderService';
import { PushNotificationService } from '@/core/notifications';

interface HealthReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const HealthReminderModal: React.FC<HealthReminderModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState<'water' | 'workout'>('water');
  const [settings, setSettings] = useState<HealthReminderSettings>(DEFAULT_HEALTH_REMINDER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [testSent, setTestSent] = useState<string | null>(null);

  // Load settings & check permission
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const loaded = await HealthReminderService.getSettings(userId);
        if (isMounted) setSettings(loaded);
        const perm = PushNotificationService.getPermission();
        if (isMounted) setPermission(perm);
      } catch (err) {
        console.error('Lỗi tải cấu hình nhắc nhở:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Request browser push notification permission
  const handleRequestPermission = async () => {
    const result = await PushNotificationService.requestPermission();
    setPermission(result);
    if (result === 'granted' && userId) {
      await PushNotificationService.syncDeviceSubscription(userId);
    }
  };

  // Test Notification Trigger
  const handleTestNotification = async (type: 'WATER' | 'WORKOUT') => {
    setTestSent(type);
    await HealthReminderService.sendTestNotification(type);
    setTimeout(() => setTestSent(null), 3000);
  };

  // Save Settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await HealthReminderService.saveSettings(settings, userId);
      onClose();
    } catch (err) {
      console.error('Lỗi lưu cấu hình nhắc nhở:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                Cài Đặt Nhắc Nhở Sức Khỏe
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Nhắc uống nước định kỳ & bản tin chuẩn bị lịch tập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 sm:px-6 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'water'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-200/60 dark:border-sky-900/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 shrink-0" />
            <span>Nhắc Uống Nước</span>
            {settings.waterReminder.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workout')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'workout'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-rose-200/60 dark:border-rose-900/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 shrink-0" />
            <span>Nhắc Lịch Tập</span>
            {settings.workoutReminder.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Permission Status Banner */}
          <div className="p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              {permission === 'granted' ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {permission === 'granted'
                    ? 'Đã bật thông báo trên thiết bị'
                    : 'Chưa cấp quyền thông báo đẩy'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {permission === 'granted'
                    ? 'Chuông & banner sẽ hiển thị đúng giờ'
                    : 'Bấm nút để nhận nhắc nhở cả khi thu nhỏ web'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer shrink-0"
              >
                Cấp quyền
              </button>
            )}
          </div>

          {/* TAB 1: NHẮC UỐNG NƯỚC */}
          {activeTab === 'water' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Toggle chính */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-900/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Bật nhắc uống nước định kỳ
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Tự động chuông báo và banner nhắc nạp nước
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.waterReminder.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        waterReminder: {
                          ...prev.waterReminder,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
                </label>
              </div>

              {settings.waterReminder.enabled && (
                <div className="space-y-4 pt-1">
                  {/* Khung giờ hoạt động */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <span>Khung giờ nhắc trong ngày</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Bắt đầu từ</span>
                        <input
                          type="time"
                          value={settings.waterReminder.startTime}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              waterReminder: {
                                ...prev.waterReminder,
                                startTime: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">Kết thúc lúc</span>
                        <input
                          type="time"
                          value={settings.waterReminder.endTime}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              waterReminder: {
                                ...prev.waterReminder,
                                endTime: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chu kỳ nhắc */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tần suất lặp lại
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              waterReminder: {
                                ...prev.waterReminder,
                                intervalMinutes: mins,
                              },
                            }))
                          }
                          className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            settings.waterReminder.intervalMinutes === mins
                              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          Mỗi {mins}p
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lượng nước mỗi lần nhắc */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Lượng nước khuyến nghị mỗi lần uống
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[200, 250, 300].map((ml) => (
                        <button
                          key={ml}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              waterReminder: {
                                ...prev.waterReminder,
                                cupSizeMl: ml,
                              },
                            }))
                          }
                          className={`py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            settings.waterReminder.cupSizeMl === ml
                              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-700 dark:text-sky-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {ml} ml
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nút Test thông báo mẫu */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestNotification('WATER')}
                      className="w-full py-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-sky-100 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{testSent === 'WATER' ? 'Đã phát chuông thử nghiệm!' : 'Thử chuông & thông báo uống nước ngay'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NHẮC LỊCH TẬP THỂ CHẤT */}
          {activeTab === 'workout' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Toggle chính */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Bật nhắc lịch tập thể chất
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Bản tin sáng & nhắc nhở khởi động trước giờ tập
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.workoutReminder.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        workoutReminder: {
                          ...prev.workoutReminder,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {settings.workoutReminder.enabled && (
                <div className="space-y-4 pt-1">
                  {/* 1. Bản tin sáng */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Bản tin lịch tập buổi sáng
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Báo lịch tập hoặc nhắc nghỉ ngơi phục hồi
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.workoutReminder.notifyMorningBrief}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            workoutReminder: {
                              ...prev.workoutReminder,
                              notifyMorningBrief: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>

                    {settings.workoutReminder.notifyMorningBrief && (
                      <div className="pt-1.5 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">Giờ gửi bản tin:</span>
                        <input
                          type="time"
                          value={settings.workoutReminder.morningBriefTime}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              workoutReminder: {
                                ...prev.workoutReminder,
                                morningBriefTime: e.target.value,
                              },
                            }))
                          }
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Nhắc trước giờ tập */}
                  <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Nhắc nhở trước giờ tập
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Nhắc khởi động khớp & chuẩn bị trang phục
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.workoutReminder.notifyBeforeWorkout}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            workoutReminder: {
                              ...prev.workoutReminder,
                              notifyBeforeWorkout: e.target.checked,
                            },
                          }))
                        }
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </div>

                    {settings.workoutReminder.notifyBeforeWorkout && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-600 dark:text-slate-400">Giờ tập yêu thích:</span>
                          <input
                            type="time"
                            value={settings.workoutReminder.preferredWorkoutTime}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                workoutReminder: {
                                  ...prev.workoutReminder,
                                  preferredWorkoutTime: e.target.value,
                                },
                              }))
                            }
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
                          />
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block mb-1.5">Báo trước:</span>
                          <div className="grid grid-cols-3 gap-2">
                            {[15, 30, 45].map((mins) => (
                              <button
                                key={mins}
                                type="button"
                                onClick={() =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    workoutReminder: {
                                      ...prev.workoutReminder,
                                      minutesBefore: mins,
                                    },
                                  }))
                                }
                                className={`py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                                  settings.workoutReminder.minutesBefore === mins
                                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Trước {mins}p
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nút Test thông báo mẫu */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestNotification('WORKOUT')}
                      className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{testSent === 'WORKOUT' ? 'Đã phát chuông thử nghiệm!' : 'Thử chuông & thông báo lịch tập ngay'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Cài Đặt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
