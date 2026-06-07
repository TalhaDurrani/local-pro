"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Language, translations } from "@/lib/translations";
import { supabase } from "@/lib/supabase";

export type Role = "superadmin" | "user" | "provider";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  city: string;
  province?: string | null;
  district?: string | null;
  nearest_landmark?: string | null;
  is_banned?: boolean | null;
  email?: string | null;
}

export interface AppLocation {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  t: typeof translations.en;
  logout: () => Promise<void>;
  location: AppLocation | null;
  setLocation: (loc: AppLocation | null) => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LANG_KEY = "prolocal.language";
const THEME_KEY = "prolocal.theme";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [location, setLocation] = useState<AppLocation | null>(null);

  const t = useMemo(() => translations[language], [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, lang);
  }, []);

  const setTheme = useCallback((next: "light" | "dark") => {
    setThemeState(next);
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, next);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLocation(null);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, city, province, district, nearest_landmark, is_banned, email")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("fetchProfile error:", error);
      return;
    }

    if (data) {
      const profile = data as UserProfile;
      if (profile.is_banned) {
        await supabase.auth.signOut();
        setUser(null);
        setLocation(null);
        return;
      }
      setUser(profile);
      const addr = profile.nearest_landmark || [profile.city, profile.district].filter(Boolean).join(", ");
      setLocation((prev) => prev ?? { address: addr || "Location not set" });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) await fetchProfile(session.user.id);
  }, [fetchProfile]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        fetchProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLocation(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLang = localStorage.getItem(LANG_KEY) as Language | null;
    if (savedLang === "en" || savedLang === "ur") setLanguageState(savedLang);
    const savedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const contextValue = useMemo<AppContextType>(
    () => ({
      user,
      loading,
      language,
      setLanguage,
      theme,
      setTheme,
      t,
      logout,
      location,
      setLocation,
      refreshProfile,
    }),
    [user, loading, language, setLanguage, theme, setTheme, t, logout, location, refreshProfile],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
