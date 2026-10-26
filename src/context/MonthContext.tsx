'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentMonthRef, getOffsetMonthRef } from '@/lib/utils';

interface MonthContextType {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  resetToToday: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthRef());
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const nextMonth = () => {
    setCurrentMonth((prev) => getOffsetMonthRef(prev, 1));
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => getOffsetMonthRef(prev, -1));
  };

  const resetToToday = () => {
    setCurrentMonth(getCurrentMonthRef());
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <MonthContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        nextMonth,
        prevMonth,
        resetToToday,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </MonthContext.Provider>
  );
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonth deve ser usado dentro de um MonthProvider');
  }
  return context;
}
