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

export interface MobilePlatformInfo {
  isIos: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  isSecureContext: boolean;
  supportsNotification: boolean;
  supportsServiceWorker: boolean;
  requiresPwaForPush: boolean;
}

export class PushNotificationService {
  private static swRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Phát âm thanh chuông thông báo trực tiếp qua Web Audio API (hoạt động 100% trên điện thoại)
   */
  public static playNotificationSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Tạo chuông Ding-dong 2 giai điệu ngân vang
      const playChime = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playChime(659.25, now, 0.4);       // E5
      playChime(880.00, now + 0.15, 0.7); // A5
    } catch (e) {
      // Bỏ qua lỗi audio context bị khóa
    }
  }

  /**
   * Kiểm tra thông tin môi trường thiết bị và khả năng hỗ trợ Web Push
   */
  public static getPlatformInfo(): MobilePlatformInfo {
    if (typeof window === 'undefined') {
      return {
        isIos: false,
        isAndroid: false,
        isStandalone: false,
        isSecureContext: true,
        supportsNotification: false,
        supportsServiceWorker: false,
        requiresPwaForPush: false,
      };
    }

    const ua = navigator.userAgent || '';
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    const isSecureContext = window.isSecureContext ?? (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    const supportsNotification = 'Notification' in window;
    const supportsServiceWorker = 'serviceWorker' in navigator;
    const requiresPwaForPush = isIos && !isStandalone;

    return {
      isIos,
      isAndroid,
      isStandalone,
      isSecureContext,
      supportsNotification,
      supportsServiceWorker,
      requiresPwaForPush,
    };
  }

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
   * Request browser permission to send notifications (hỗ trợ cả Promise và Callback trên Mobile Safari/Chrome)
   */
  public static async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined') return 'unsupported';
    if (!('Notification' in window)) return 'unsupported';

    try {
      let result: string;
      // Trình duyệt cũ / Mobile Safari hỗ trợ callback
      if (typeof Notification.requestPermission === 'function') {
        const req = Notification.requestPermission();
        if (req && typeof (req as any).then === 'function') {
          result = await req;
        } else {
          result = await new Promise((resolve) => Notification.requestPermission(resolve as any));
        }
      } else {
        result = 'denied';
      }

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
   * Yêu cầu mã FCM Token từ Firebase Cloud Messaging cho thiết bị này
   */
  public static async getFcmToken(): Promise<string | null> {
    if (typeof window === 'undefined' || !this.isSupported()) return null;
    if (Notification.permission !== 'granted') return null;

    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
      (process.env as any).VITE_FIREBASE_VAPID_KEY;

    try {
      const reg = await this.registerServiceWorker();
      if (!reg) return null;

      // Import động firebase/messaging để tránh lỗi SSR trên server Next.js
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { app: firebaseApp, initFirebase } = await import('../firebase/auth/config');
      const targetApp = firebaseApp || initFirebase().app;
      const messaging = getMessaging(targetApp);

      const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
        serviceWorkerRegistration: reg,
      };
      if (vapidKey) {
        tokenOptions.vapidKey = vapidKey;
      }

      const token = await getToken(messaging, tokenOptions);
      if (token) {
        console.log('[PushNotificationService] FCM Token fetched successfully:', token);
        return token;
      }
      return null;
    } catch (err) {
      console.warn('[PushNotificationService] Không thể lấy FCM Token (cần cấu hình NEXT_PUBLIC_FIREBASE_VAPID_KEY):', err);
      return null;
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

      // Tự động lấy FCM Token nếu chưa được truyền vào
      let token = fcmToken;
      if (!token) {
        token = (await this.getFcmToken()) || '';
      }

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
        fcmToken: token || '',
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
    // Luôn phát âm thanh chuông thông báo trên thiết bị
    this.playNotificationSound();

    // Bắn sự kiện hiển thị In-App Toast Banner trên giao diện
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-inapp-notification', { detail: payload }));
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.log('[PushNotificationService] Native Web Push not granted, fallback to in-app notification & sound');
      return true;
    }

    try {
      const reg = await this.registerServiceWorker();
      const title = payload.title || 'Thông báo mới';
      const options: any = {
        body: payload.body || '',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/icon.png',
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
      } else if ('Notification' in window) {
        new Notification(title, options);
        return true;
      }
      return true;
    } catch (err) {
      console.warn('[PushNotificationService] Error displaying native notification, in-app displayed:', err);
      return true;
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
