import { User as FirebaseUser } from 'firebase/auth';

/**
 * Định dạng cấu hình Firebase SDK
 */
export interface FirebaseModuleConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

/**
 * Đối tượng người dùng chuẩn hóa cho ứng dụng React
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  emailVerified: boolean;
  rawFirebaseUser?: FirebaseUser;
}

/**
 * Trạng thái Auth của React Context
 */
export interface AuthContextState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<AuthUser>;
  signupWithEmail: (email: string, pass: string, displayName?: string) => Promise<AuthUser>;
  loginWithGooglePopup: () => Promise<AuthUser>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginWithGoogleTokens: (tokens: { idToken?: string | null; accessToken?: string | null }) => Promise<AuthUser>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
