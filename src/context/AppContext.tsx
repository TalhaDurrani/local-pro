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
  latitude?: number | null;
  longitude?: number | null;
  display_address?: string | null;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  t: typeof translations.en;
  logout: () => Promise<void>;
  isGlobalKillSwitchActive: boolean;
  location: { lat: number; lng: number; address: string } | null;
  setLocation: (loc: { lat: number; lng: number; address: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isGlobalKillSwitchActive, setIsGlobalKillSwitchActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number | null; lng: number | null; address: string } | null>(null);

  const t = translations[language];

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    }
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    // Check active session on load
    const checkSession = async () => {
      try {
        const res = await supabase.auth.getSession();
        const session = res?.data?.session;
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("checkSession error:", err);
        setUser(null);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes (login/logout)
    const onAuth = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const subscription = onAuth?.data?.subscription;

    return () => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (e) {
        // noop
      }
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    setUser(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // FIX: Changed from .single() to .maybeSingle() to prevent 406 crashes
      
    if (data && !error) {
      const profile = data as UserProfile;
      setUser(profile);
      if (
        profile.city ||
        profile.province ||
        profile.district ||
        profile.nearest_landmark ||
        (profile as any).latitude != null ||
        (profile as any).longitude != null
      ) {
        setLocation({
          lat: (profile as any).latitude ?? null,
          lng: (profile as any).longitude ?? null,
          address:
            profile.nearest_landmark ||
            profile.city ||
            profile.district ||
            profile.province ||
            "",
        });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('theme', theme);
  }, [theme]);

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
        theme,
        setTheme,
        t,
        logout,
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