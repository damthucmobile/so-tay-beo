'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AuthUser, AuthContextState } from './types';
import {
  loginWithEmail as serviceLoginWithEmail,
  signupWithEmail as serviceSignupWithEmail,
  loginWithGooglePopup as serviceLoginWithGooglePopup,
  loginWithGoogleRedirect as serviceLoginWithGoogleRedirect,
  loginWithGoogleTokens as serviceLoginWithGoogleTokens,
  handleGoogleRedirectResult,
  sendPasswordReset as serviceSendPasswordReset,
  logoutFirebase,
  subscribeToAuth,
} from './authService';

const AUTH_CACHE_KEY = 'app_auth_cached_user';

const getInitialCachedUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const cacheUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {
    // Bỏ qua lỗi truy cập LocalStorage
  }
};

export const AuthContext = createContext<AuthContextState | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  onUserChanged?: (user: AuthUser | null) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, onUserChanged }) => {
  const [user, setUser] = useState<AuthUser | null>(getInitialCachedUser);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Kiểm tra kết quả nếu vừa redirect từ Google
    handleGoogleRedirectResult().then((redirectUser) => {
      if (!isMounted) return;
      if (redirectUser) {
        setUser(redirectUser);
        cacheUser(redirectUser);
        onUserChanged?.(redirectUser);
      }
    });

    // 2. Lắng nghe thay đổi phiên đăng nhập Firebase Realtime
    const unsubscribe = subscribeToAuth((currentUser) => {
      if (!isMounted) return;
      setUser(currentUser);
      cacheUser(currentUser);
      setIsLoading(false);
      onUserChanged?.(currentUser);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [onUserChanged]);

  const loginWithEmail = async (email: string, pass: string): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await serviceLoginWithEmail(email, pass);
      setUser(loggedUser);
      cacheUser(loggedUser);
      return loggedUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    displayName?: string
  ): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await serviceSignupWithEmail(email, pass, displayName);
      setUser(newUser);
      cacheUser(newUser);
      return newUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGooglePopup = async (): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const googleUser = await serviceLoginWithGooglePopup();
      setUser(googleUser);
      cacheUser(googleUser);
      return googleUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleRedirect = async (): Promise<void> => {
    setError(null);
    try {
      await serviceLoginWithGoogleRedirect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  };

  const loginWithGoogleTokens = async (tokens: {
    idToken?: string | null;
    accessToken?: string | null;
  }): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const tokenUser = await serviceLoginWithGoogleTokens(tokens);
      setUser(tokenUser);
      cacheUser(tokenUser);
      return tokenUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    setError(null);
    try {
      await serviceSendPasswordReset(email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutFirebase();
      setUser(null);
      cacheUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo<AuthContextState>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      loginWithEmail,
      signupWithEmail,
      loginWithGooglePopup,
      loginWithGoogleRedirect,
      loginWithGoogleTokens,
      sendPasswordReset,
      logout,
      clearError,
    }),
    [user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
