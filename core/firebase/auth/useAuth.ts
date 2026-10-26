'use client';

import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextState } from './types';

/**
 * Custom hook giúp truy cập dữ liệu xác thực Firebase trong bất kỳ component React nào
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, loginWithGooglePopup, logout } = useAuth();
 * ```
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() phải được sử dụng bên trong component <AuthProvider>');
  }
  return context;
}
