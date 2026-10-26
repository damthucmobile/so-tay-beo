'use client';

import React from 'react';
import { AuthProvider, ActivityTrackerProvider } from '@/core/firebase';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActivityTrackerProvider>{children}</ActivityTrackerProvider>
    </AuthProvider>
  );
}
