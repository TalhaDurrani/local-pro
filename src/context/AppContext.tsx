"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';
import { supabase } from '@/lib/supabase';

type Role = 'seeker' | 'provider' | 'admin' | 'superadmin' | 'user';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  city: string;
  walletBalance?: number; 
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  isGlobalKillSwitchActive: boolean;
  location: { lat: number; lng: number; address: string } | null;
  setLocation: (loc: { lat: number; lng: number; address: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [isGlobalKillSwitchActive, setIsGlobalKillSwitchActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const t = translations[language];

  useEffect(() => {
    // Check active session on load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // FIX: Changed from .single() to .maybeSingle() to prevent 406 crashes
      
    if (data && !error) {
      setUser(data as UserProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        language,
        setLanguage,
        t,
        isGlobalKillSwitchActive,
        location,
        setLocation,
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