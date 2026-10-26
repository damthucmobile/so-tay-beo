import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  NextOrObserver,
} from 'firebase/auth';
import { auth, googleProvider, initFirebase } from './config';
import { AuthUser } from './types';
import { getFriendlyAuthErrorMessage } from './authErrors';

/**
 * Đảm bảo instance Auth đã sẵn sàng
 */
function getActiveAuth() {
  if (!auth) {
    const initialized = initFirebase();
    if (!initialized.auth) {
      throw new Error('Firebase Auth chưa được khởi tạo. Vui lòng kiểm tra lại cấu hình .env');
    }
    return initialized.auth;
  }
  return auth;
}

/**
 * Chuyển đổi Firebase User sang AuthUser chuẩn hóa
 */
export function mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Người dùng',
    photoURL: user.photoURL || undefined,
    phoneNumber: user.phoneNumber || undefined,
    emailVerified: user.emailVerified,
    rawFirebaseUser: user,
  };
}

/**
 * 1. Đăng nhập bằng Email & Mật khẩu
 */
export async function loginWithEmail(email: string, pass: string): Promise<AuthUser> {
  const currentAuth = getActiveAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(currentAuth, email, pass);
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Không thể lấy thông tin người dùng sau khi đăng nhập.');
    return mapped;
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 2. Đăng ký tài khoản mới bằng Email & Mật khẩu
 */
export async function signupWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<AuthUser> {
  const currentAuth = getActiveAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(currentAuth, email, pass);
    if (displayName && userCredential.user) {
      try {
        await updateProfile(userCredential.user, { displayName });
      } catch (err) {
        console.warn('[Firebase Auth] Cập nhật displayName ban đầu không thành công:', err);
      }
    }
    const mapped = mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Không thể lấy thông tin người dùng sau khi đăng ký.');
    return mapped;
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 3. Đăng nhập Google qua Popup (Dành cho Web React chuẩn)
 */
export async function loginWithGooglePopup(): Promise<AuthUser> {
  const currentAuth = getActiveAuth();
  const provider = googleProvider || new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(currentAuth, provider);
    const mapped = mapFirebaseUser(result.user);
    if (!mapped) throw new Error('Đăng nhập Google thành công nhưng không lấy được thông tin.');
    return mapped;
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 4. Đăng nhập Google qua Redirect (Dành cho trình duyệt Mobile hoặc thiết bị hạn chế popup)
 */
export async function loginWithGoogleRedirect(): Promise<void> {
  const currentAuth = getActiveAuth();
  const provider = googleProvider || new GoogleAuthProvider();
  try {
    await signInWithRedirect(currentAuth, provider);
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 5. Lấy kết quả Redirect sau khi trang reload
 */
export async function handleGoogleRedirectResult(): Promise<AuthUser | null> {
  const currentAuth = getActiveAuth();
  try {
    const result = await getRedirectResult(currentAuth);
    if (result && result.user) {
      return mapFirebaseUser(result.user);
    }
    return null;
  } catch (error) {
    console.warn('[Firebase Auth] Lỗi đọc kết quả redirect:', error);
    return null;
  }
}

/**
 * 6. Đăng nhập Firebase bằng Google Tokens (IdToken / AccessToken)
 * Dùng cho Desktop (Tauri/Electron), Mobile (React Native/Capacitor) hoặc OAuth PKCE flow.
 */
export async function loginWithGoogleTokens(tokens: {
  idToken?: string | null;
  accessToken?: string | null;
}): Promise<AuthUser> {
  const currentAuth = getActiveAuth();
  try {
    const credential = GoogleAuthProvider.credential(
      tokens.idToken || null,
      tokens.accessToken || null
    );
    const result = await signInWithCredential(currentAuth, credential);
    const mapped = mapFirebaseUser(result.user);
    if (!mapped) throw new Error('Không thể đồng bộ hồ sơ sau khi nhận Google Credential.');
    return mapped;
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 7. Gửi email khôi phục / đặt lại mật khẩu
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const currentAuth = getActiveAuth();
  try {
    await sendPasswordResetEmail(currentAuth, email);
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 8. Đăng xuất khỏi Firebase
 */
export async function logoutFirebase(): Promise<void> {
  const currentAuth = getActiveAuth();
  try {
    await signOut(currentAuth);
  } catch (error) {
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * 9. Lắng nghe thay đổi trạng thái đăng nhập (onAuthStateChanged)
 */
export function subscribeToAuth(
  callback: (user: AuthUser | null) => void
): () => void {
  const currentAuth = getActiveAuth();
  const unsubscribe = onAuthStateChanged(currentAuth, (fbUser: FirebaseUser | null) => {
    callback(mapFirebaseUser(fbUser));
  });
  return unsubscribe;
}

/**
 * 10. Lấy user hiện tại đồng bộ
 */
export function getCurrentAuthUser(): AuthUser | null {
  const currentAuth = getActiveAuth();
  return mapFirebaseUser(currentAuth.currentUser);
}
