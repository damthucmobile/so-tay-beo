'use client';

import React from 'react';
import { AuthProvider, ActivityTrackerProvider } from '@/core/firebase';
import { GlobalTeachingReminderScheduler } from '@/features/teaching-schedule';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActivityTrackerProvider>
        <GlobalTeachingReminderScheduler />
        {children}
      </ActivityTrackerProvider>
    </AuthProvider>
  );
}
