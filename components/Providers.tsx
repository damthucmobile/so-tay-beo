'use client';

import React from 'react';
import { AuthProvider, ActivityTrackerProvider } from '@/core/firebase';
import { GlobalTeachingReminderScheduler } from '@/features/teaching-schedule';
import { GlobalHealthReminderScheduler } from '@/features/health/components/GlobalHealthReminderScheduler';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ActivityTrackerProvider>
        <GlobalTeachingReminderScheduler />
        <GlobalHealthReminderScheduler />
        {children}
      </ActivityTrackerProvider>
    </AuthProvider>
  );
}
