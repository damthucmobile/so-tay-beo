// core/firebase/admin/index.ts
import * as admin from 'firebase-admin';

/**
 * Singleton Firebase Admin App instance
 * Tự động phân tích credentials từ biến môi trường (hỗ trợ cả Service Account JSON hoặc biến lẻ)
 */
function getFirebaseAdminApp(): admin.app.App | null {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // 1. Kiểm tra cấu hình Service Account JSON dạng chuỗi
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const decoded = serviceAccountJson.startsWith('{')
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));

      return admin.initializeApp({
        credential: admin.credential.cert(decoded),
        projectId: decoded.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Lỗi parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  // 2. Kiểm tra các biến môi trường cấu hình lẻ
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    // Xử lý xuống dòng cho private key trong .env
    privateKey = privateKey.replace(/\\n/g, '\n');

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  }

  // 3. Fallback cho môi trường Google Cloud / Firebase Hosting tích hợp (Application Default Credentials)
  if (projectId) {
    try {
      return admin.initializeApp({
        projectId,
      });
    } catch (e) {
      console.warn('[Firebase Admin] Không thể khởi tạo với projectId mặc định:', e);
    }
  }

  console.warn(
    '[Firebase Admin] Chưa tìm thấy cấu hình Service Account. Vui lòng cấu hình FIREBASE_CLIENT_EMAIL và FIREBASE_PRIVATE_KEY trong .env để kích hoạt gửi FCM từ Server.'
  );
  return null;
}

export const adminApp = getFirebaseAdminApp();
export const adminDb = adminApp ? admin.firestore(adminApp) : null;
export const adminMessaging = adminApp ? admin.messaging(adminApp) : null;
