// core/notifications/pushNotificationService.ts
/**
 * Common Push Notification & Service Worker Management Service
 * Reusable across all modules (Teaching Schedule, Class Appointments, Tasks, etc.)
 */

import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../firebase/db/constants';
import { 
  NotificationPermissionState, 
  PushDeviceSubscription, 
  PushNotificationPayload, 
  BaseReminderSettings 
} from './types';

export class PushNotificationService {
  private static swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Check if Notifications & Service Worker are supported on current platform
   */
  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current browser notification permission
   */
  public static getPermission(): NotificationPermissionState {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionState;
  }

  /**
   * Register common Service Worker
   */
  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    if (this.swRegistration) return this.swRegistration;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      this.swRegistration = reg;
      console.log('[PushNotificationService] Service Worker registered successfully with scope:', reg.scope);
      return reg;
    } catch (err) {
      console.error('[PushNotificationService] Service Worker registration failed:', err);
      return null;
    }
  }

  /**
   * Request browser permission to send notifications
   */
  public static async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await this.registerServiceWorker();
      }
      return result as NotificationPermissionState;
    } catch (err) {
      console.error('[PushNotificationService] Error requesting notification permission:', err);
      return 'denied';
    }
  }

  /**
   * Get or register push subscription and save to Firestore
   */
  public static async syncDeviceSubscription(
    userId: string, 
    userEmail?: string,
    fcmToken?: string
  ): Promise<PushDeviceSubscription | null> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const reg = await this.registerServiceWorker();
      if (!reg) return null;

      const deviceId = this.getOrCreateDeviceId();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const platform = isMobile ? 'mobile' : 'desktop';

      // Attempt standard Web Push subscription if supported
      let webPushEndpoint: string | undefined;
      let webPushKeys: { p256dh: string; auth: string } | undefined;

      try {
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          const json = existingSub.toJSON();
          webPushEndpoint = existingSub.endpoint;
          if (json.keys) {
            webPushKeys = {
              p256dh: json.keys.p256dh || '',
              auth: json.keys.auth || '',
            };
          }
        }
      } catch (subErr) {
        console.warn('[PushNotificationService] Web Push Manager subscription check warning:', subErr);
      }

      const subscriptionData: PushDeviceSubscription = {
        id: deviceId,
        userId,
        fcmToken: fcmToken || '',
        endpoint: webPushEndpoint || '',
        keys: webPushKeys || { p256dh: '', auth: '' },
        platform,
        userAgent,
        enabled: true,
        updatedAt: new Date().toISOString(),
      };

      // Save device subscription to Firestore
      if (db) {
        const payloadToSave: Record<string, any> = {
          ...subscriptionData,
          userEmail: userEmail || '',
          lastActive: serverTimestamp(),
        };

        // Loại bỏ triệt để các thuộc tính undefined để tránh lỗi Firestore
        Object.keys(payloadToSave).forEach((key) => {
          if (payloadToSave[key] === undefined) {
            delete payloadToSave[key];
          }
        });

        const subDocRef = doc(db, COLLECTIONS.PUSH_SUBSCRIPTIONS, `${userId}_${deviceId}`);
        await setDoc(subDocRef, payloadToSave, { merge: true });
        console.log('[PushNotificationService] Device synced to Firestore successfully');
      }

      return subscriptionData;
    } catch (err) {
      console.error('[PushNotificationService] Failed to sync device subscription:', err);
      return null;
    }
  }

  /**
   * Display a local rich notification immediately via Service Worker or Notification API
   */
  public static async showNotification(payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.warn('[PushNotificationService] Notification permission is not granted');
      return false;
    }

    try {
      const reg = await this.registerServiceWorker();
      const title = payload.title || 'Thông báo mới';
      const options: any = {
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        tag: payload.tag || 'general_notification',
        renotify: payload.renotify ?? true,
        data: {
          url: payload.url || '/',
          timestamp: Date.now(),
          ...payload.data,
        },
      };

      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return true;
      } else {
        new Notification(title, options);
        return true;
      }
    } catch (err) {
      console.error('[PushNotificationService] Error displaying notification:', err);
      return false;
    }
  }

  /**
   * Save general or module-specific reminder settings to Firestore
   */
  public static async saveSettings<T extends BaseReminderSettings>(
    settingId: string, 
    userId?: string, 
    settings?: T
  ): Promise<void> {
    if (!db || !userId || !settings) return;
    try {
      const payload: Record<string, any> = {
        ...settings,
        userId,
        settingId,
        updatedAt: serverTimestamp(),
      };

      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const docRef = doc(db, COLLECTIONS.REMINDER_SETTINGS, `${userId}_${settingId}`);
      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.warn('[PushNotificationService] Could not sync settings to Cloud, saved locally:', err);
    }
  }

  /**
   * Get reminder settings from Firestore
   */
  public static async getSettings<T extends BaseReminderSettings>(
    settingId: string, 
    userId?: string
  ): Promise<T | null> {
    if (!db || !userId) return null;
    try {
      const docRef = doc(db, COLLECTIONS.REMINDER_SETTINGS, `${userId}_${settingId}`);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as T;
      }
    } catch (err) {
      console.warn('[PushNotificationService] Could not fetch remote settings, using local fallback:', err);
    }
    return null;
  }

  /**
   * Subscribe to real-time reminder settings
   */
  public static subscribeSettings<T extends BaseReminderSettings>(
    settingId: string,
    userId: string,
    callback: (data: T | null) => void
  ): () => void {
    if (!db) return () => {};
    const docRef = doc(db, COLLECTIONS.REMINDER_SETTINGS, `${userId}_${settingId}`);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as T);
      } else {
        callback(null);
      }
    }, (err) => {
      console.error('[PushNotificationService] Error listening to settings:', err);
    });
  }

  /**
   * Unique client device identifier persistent in localStorage
   */
  private static getOrCreateDeviceId(): string {
    if (typeof window === 'undefined') return 'unknown_device';
    const KEY = 'app_device_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  }
}
