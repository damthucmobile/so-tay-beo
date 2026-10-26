// core/notifications/usePushNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService } from './pushNotificationService';
import { NotificationPermissionState, PushNotificationPayload } from './types';
import { useAuth } from '../firebase';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const supported = PushNotificationService.isSupported();
    setIsSupported(supported);
    if (supported) {
      setPermission(PushNotificationService.getPermission());
      // Register Service Worker in background
      PushNotificationService.registerServiceWorker().catch(() => {});
    }
  }, []);

  // Request browser permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await PushNotificationService.requestPermission();
      setPermission(result);

      if (result === 'granted' && user?.uid) {
        await PushNotificationService.syncDeviceSubscription(user.uid, user.email || undefined);
        return true;
      }
      return result === 'granted';
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Send a test local notification
  const sendTestNotification = useCallback(async (payload?: Partial<PushNotificationPayload>): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    return PushNotificationService.showNotification({
      title: payload?.title || '🔔 Kiểm tra thông báo thành công!',
      body: payload?.body || 'Hệ thống nhắc nhở của Sổ Tay Béo đã hoạt động trơn tru trên thiết bị này.',
      icon: payload?.icon || '/icon-192.png',
      tag: payload?.tag || 'test_notification',
      url: payload?.url || '/?tab=teaching_schedule',
      data: payload?.data,
    });
  }, [permission, requestPermission]);

  return {
    permission,
    isSupported,
    isLoading,
    isGranted: permission === 'granted',
    requestPermission,
    sendTestNotification,
  };
}
