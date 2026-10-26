'use client';

import { useState, useEffect, useCallback } from 'react';
import { Appointment, Customer } from '../types';
import {
  subscribeToAppointments,
  subscribeToCustomers,
  saveAppointment,
  deleteAppointment,
  toggleAppointmentComplete,
  saveCustomer,
  deleteCustomer,
  seedDemoSchedule,
} from '../services/scheduleService';

export function useScheduleManager(userId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Lắng nghe Realtime
  useEffect(() => {
    if (!userId) {
      setAppointments([]);
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let appLoaded = false;
    let custLoaded = false;

    const unsubApp = subscribeToAppointments(
      userId,
      (list) => {
        setAppointments(list);
        appLoaded = true;
        if (custLoaded) setIsLoading(false);
      },
      (err) => {
        console.error(err);
        appLoaded = true;
        setIsLoading(false);
      }
    );

    const unsubCust = subscribeToCustomers(
      userId,
      (list) => {
        setCustomers(list);
        custLoaded = true;
        if (appLoaded) setIsLoading(false);
      },
      (err) => {
        console.error(err);
        custLoaded = true;
        setIsLoading(false);
      }
    );

    return () => {
      unsubApp();
      unsubCust();
    };
  }, [userId]);

  const handleSaveAppointment = useCallback(
    async (data: Partial<Appointment>) => {
      if (!userId) return '';
      return await saveAppointment(data, userId);
    },
    [userId]
  );

  const handleDeleteAppointment = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteAppointment(id, userId);
    },
    [userId]
  );

  const handleToggleComplete = useCallback(
    async (app: Appointment) => {
      if (!userId) return;
      await toggleAppointmentComplete(app, userId);
    },
    [userId]
  );

  const handleSaveCustomer = useCallback(
    async (data: Partial<Customer>) => {
      if (!userId) return '';
      return await saveCustomer(data, userId);
    },
    [userId]
  );

  const handleDeleteCustomer = useCallback(async (id: string) => {
    await deleteCustomer(id);
  }, []);

  const handleSeedDemo = useCallback(async () => {
    if (!userId) return;
    await seedDemoSchedule(userId);
  }, [userId]);

  return {
    appointments,
    customers,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    saveAppointment: handleSaveAppointment,
    deleteAppointment: handleDeleteAppointment,
    toggleComplete: handleToggleComplete,
    saveCustomer: handleSaveCustomer,
    deleteCustomer: handleDeleteCustomer,
    seedDemo: handleSeedDemo,
  };
}
