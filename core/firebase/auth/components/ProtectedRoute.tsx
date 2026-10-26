'use client';

import React from 'react';
import { useAuth } from '../useAuth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Component bảo vệ tuyến đường - chỉ hiển thị nội dung khi người dùng đã đăng nhập.
 * Nếu chưa đăng nhập, hiển thị giao diện fallback (ví dụ Form đăng nhập hoặc thông báo).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  loadingFallback = (
    <div className="flex items-center justify-center min-h-[300px] w-full text-gray-500 text-sm">
      Đang kiểm tra thông tin đăng nhập...
    </div>
  ),
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : (
      <div className="text-center p-8 text-sm text-gray-500">
        Bạn cần đăng nhập để truy cập trang này.
      </div>
    );
  }

  return <>{children}</>;
};
