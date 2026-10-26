'use client';

import React, { useState } from 'react';
import { useAuth } from '../useAuth';

export interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
  enableGoogle?: boolean;
  googleFlow?: 'popup' | 'redirect';
  title?: string;
  subtitle?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  className = '',
  enableGoogle = true,
  googleFlow = 'popup',
  title = 'Chào mừng trở lại',
  subtitle = 'Vui lòng đăng nhập để tiếp tục sử dụng ứng dụng',
}) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGooglePopup,
    loginWithGoogleRedirect,
    sendPasswordReset,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setInfoMessage(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        onSuccess?.();
      } else if (mode === 'signup') {
        await signupWithEmail(email, password, name);
        onSuccess?.();
      } else if (mode === 'forgot') {
        await sendPasswordReset(email);
        setInfoMessage('Đã gửi email hướng dẫn khôi phục mật khẩu. Vui lòng kiểm tra hộp thư!');
      }
    } catch {
      // Lỗi đã được lưu vào `error` trong hook useAuth
    }
  };

  const handleGoogleAuth = async () => {
    clearError();
    setInfoMessage(null);
    try {
      if (googleFlow === 'popup') {
        await loginWithGooglePopup();
        onSuccess?.();
      } else {
        await loginWithGoogleRedirect();
      }
    } catch {
      // Lỗi do hook xử lý
    }
  };

  return (
    <div
      className={`w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-gray-100 ${className}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      {/* Tiêu đề & Giới thiệu */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {mode === 'login' && title}
          {mode === 'signup' && 'Đăng ký tài khoản mới'}
          {mode === 'forgot' && 'Khôi phục mật khẩu'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {mode === 'login' && subtitle}
          {mode === 'signup' && 'Tạo tài khoản nhanh chóng chỉ trong vài giây'}
          {mode === 'forgot' && 'Nhập email để nhận liên kết đổi lại mật khẩu'}
        </p>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Thông báo thông tin */}
      {infoMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <span>✅</span>
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Form chính */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required={mode === 'signup'}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                Mật khẩu
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    clearError();
                    setInfoMessage(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
              minLength={6}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition shadow-sm hover:shadow flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <span>Đang xử lý...</span>
          ) : (
            <span>
              {mode === 'login' && 'Đăng nhập'}
              {mode === 'signup' && 'Đăng ký'}
              {mode === 'forgot' && 'Gửi liên kết khôi phục'}
            </span>
          )}
        </button>
      </form>

      {/* Đăng nhập nhanh bằng Google */}
      {enableGoogle && mode !== 'forgot' && (
        <div className="mt-5">
          <div className="relative flex items-center justify-center mb-4">
            <div className="w-full border-t border-gray-200 dark:border-slate-800" />
            <span className="bg-white dark:bg-slate-900 px-3 text-xs text-gray-400 uppercase tracking-wider relative z-10">
              Hoặc
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 px-4 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 rounded-lg text-sm font-medium transition flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
        </div>
      )}

      {/* Chuyển đổi giữa các chế độ */}
      <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        {mode === 'login' && (
          <p>
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                clearError();
                setInfoMessage(null);
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Đăng ký ngay
            </button>
          </p>
        )}
        {mode === 'signup' && (
          <p>
            Đã có tài khoản?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setInfoMessage(null);
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Đăng nhập
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setInfoMessage(null);
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              ← Quay lại Đăng nhập
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
