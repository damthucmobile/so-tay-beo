// ==============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU COMMON CHO HỆ THỐNG THÔNG BÁO WEB PUSH & NHẮC NHỞ
// ==============================================================================

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PushDeviceSubscription {
  id: string; // Token ID or Hash
  userId: string;
  token?: string;
  fcmToken?: string;
  platform: 'mobile' | 'desktop' | 'web-fcm' | 'web-push' | 'safari' | 'chrome' | 'other';
  endpoint?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  renotify?: boolean;
  data?: {
    url?: string;
    type?: string;
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
}

export interface ZaloNotificationSettings {
  enabled: boolean;
  phoneNumber?: string;
  zaloUserId?: string;
  status: 'disabled' | 'pending_link' | 'connected';
  testMode: boolean; // Chế độ thử nghiệm khi chưa có Giấy ĐKKD
}

export interface BaseReminderSettings {
  id?: string;
  userId?: string;
  enabled: boolean;
  soundEnabled?: boolean;
  zalo?: ZaloNotificationSettings;
  createdAt?: string;
  updatedAt?: string;
}
