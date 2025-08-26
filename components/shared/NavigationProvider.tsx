'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface NavigationContextType {
  currentPath: string;
  previousPath: string | null;
  navigationHistory: string[];
  goBack: () => void;
  canGoBack: boolean;
  addToHistory: (path: string) => void;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  maxHistoryLength?: number;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ 
  children, 
  maxHistoryLength = 10 
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  // Update navigation history when pathname changes
  useEffect(() => {
    if (pathname && pathname !== navigationHistory[navigationHistory.length - 1]) {
      setNavigationHistory(prev => {
        const newHistory = [...prev, pathname];
        if (newHistory.length > maxHistoryLength) {
          return newHistory.slice(-maxHistoryLength);
        }
        return newHistory;
      });
      
      if (navigationHistory.length > 0) {
        setPreviousPath(navigationHistory[navigationHistory.length - 1]);
      }
    }
  }, [pathname, maxHistoryLength]);

  const goBack = () => {
    if (previousPath) {
      router.push(previousPath);
    } else {
      router.back();
    }
  };

  const canGoBack = navigationHistory.length > 1 || typeof window !== 'undefined' && window.history.length > 1;

  const addToHistory = (path: string) => {
    setNavigationHistory(prev => {
      const newHistory = [...prev, path];
      if (newHistory.length > maxHistoryLength) {
        return newHistory.slice(-maxHistoryLength);
      }
      return newHistory;
    });
  };

  const clearHistory = () => {
    setNavigationHistory([]);
    setPreviousPath(null);
  };

  const value: NavigationContextType = {
    currentPath: pathname,
    previousPath,
    navigationHistory,
    goBack,
    canGoBack,
    addToHistory,
    clearHistory,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationProvider;
