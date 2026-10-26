import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FirebaseModuleConfig } from './types';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

/**
 * Trích xuất biến môi trường tự động hỗ trợ cả Vite (`import.meta.env`) và Webpack/Next.js/CRA (`process.env`)
 */
function getEnvConfig(): FirebaseModuleConfig | null {
  // 1. Kiểm tra Next.js / Create React App / Webpack qua process.env
  // Lưu ý: Next.js yêu cầu truy cập trực tiếp process.env.NEXT_PUBLIC_* để bundler tự động inline biến vào trình duyệt
  try {
    if (typeof process !== 'undefined' && process.env) {
      const apiKey =
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.REACT_APP_FIREBASE_API_KEY ||
        (process.env as any).VITE_FIREBASE_API_KEY;
      const projectId =
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.REACT_APP_FIREBASE_PROJECT_ID ||
        (process.env as any).VITE_FIREBASE_PROJECT_ID;

      const databaseId =
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
        process.env.REACT_APP_FIREBASE_DATABASE_ID ||
        (process.env as any).VITE_FIREBASE_DATABASE_ID;

      if (apiKey && projectId) {
        return {
          apiKey,
          authDomain:
            process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
            process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
            `${projectId}.firebaseapp.com`,
          projectId,
          databaseId: databaseId || '(default)',
          storageBucket:
            process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
            process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
            process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId:
            process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
            process.env.REACT_APP_FIREBASE_APP_ID ||
            '',
        };
      }
    }
  } catch {
    // Bỏ qua nếu không có process.env
  }

  // 2. Kiểm tra Vite qua import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const v = (import.meta as any).env;
      if (v.VITE_FIREBASE_API_KEY && v.VITE_FIREBASE_PROJECT_ID) {
        return {
          apiKey: v.VITE_FIREBASE_API_KEY,
          authDomain: v.VITE_FIREBASE_AUTH_DOMAIN || `${v.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
          projectId: v.VITE_FIREBASE_PROJECT_ID,
          databaseId: v.VITE_FIREBASE_DATABASE_ID || '(default)',
          storageBucket: v.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: v.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: v.VITE_FIREBASE_APP_ID || '',
        };
      }
    }
  } catch {
    // Bỏ qua nếu không phải môi trường Vite
  }

  return null;
}

/**
 * Khởi tạo Firebase SDK thủ công hoặc từ cấu hình tùy biến
 */
export function initFirebase(customConfig?: Partial<FirebaseModuleConfig>): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  googleProvider: GoogleAuthProvider;
} {
  if (app && auth && db && storage && googleProvider) {
    return { app, auth, db, storage, googleProvider };
  }

  const resolvedConfig = customConfig || getEnvConfig();

  if (!resolvedConfig || !resolvedConfig.apiKey || !resolvedConfig.projectId) {
    console.warn(
      '[Firebase Module] Chưa tìm thấy cấu hình Firebase đầy đủ trong biến môi trường (.env).'
    );
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(resolvedConfig as FirebaseModuleConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    // Bật lưu phiên đăng nhập lâu dài trên LocalStorage trình duyệt
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Module] Cảnh báo lưu phiên setPersistence:', err);
    });

    const dbId = resolvedConfig?.databaseId;
    db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
    storage = getStorage(app);

    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    return { app, auth, db, storage, googleProvider };
  } catch (error) {
    console.error('[Firebase Module] Lỗi khởi tạo Firebase:', error);
    throw error;
  }
}

// Tự động khởi tạo ngay nếu đã có biến môi trường hợp lệ
try {
  initFirebase();
} catch {
  // Có thể đợi gọi initFirebase() thủ công sau nếu cần
}

export { app, auth, db, storage, googleProvider };
