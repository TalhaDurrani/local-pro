
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';

type Role = 'seeker' | 'provider' | 'admin';

interface User {
  id: string;
  phone: string;
  role: Role;
  isActive: boolean;
}

interface AppContextType {
  user: User | null;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  setUser: (user: User | null) => void;
  switchRole: () => void;
  isGlobalKillSwitchActive: boolean;
  toggleGlobalKillSwitch: () => void;
  location: { lat: number; lng: number; address: string } | null;
  setLocation: (loc: { lat: number; lng: number; address: string } | null) => void;
  walletBalance: number;
  setWalletBalance: (bal: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isGlobalKillSwitchActive, setIsGlobalKillSwitchActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const t = translations[language];

  const switchRole = () => {
    if (!user) return;
    const nextRole: Role = user.role === 'seeker' ? 'provider' : 'seeker';
    setUser({ ...user, role: nextRole });
  };

  const toggleGlobalKillSwitch = () => {
    setIsGlobalKillSwitchActive(!isGlobalKillSwitchActive);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        t,
        switchRole,
        isGlobalKillSwitchActive,
        toggleGlobalKillSwitch,
        location,
        setLocation,
        walletBalance,
        setWalletBalance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
