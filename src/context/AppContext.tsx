
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, translations } from '@/lib/translations';
import { useUser, useDoc, useFirestore, useAuth } from '@/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

type Role = 'seeker' | 'provider' | 'admin';

interface UserProfile {
  uid: string;
  phone: string;
  role: Role;
  isActive: boolean;
  walletBalance: number;
  subscriptionPlan: 'trial' | 'pro' | 'elite';
  subscriptionExpiry: string;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  switchRole: () => void;
  isGlobalKillSwitchActive: boolean;
  toggleGlobalKillSwitch: () => void;
  location: { lat: number; lng: number; address: string } | null;
  setLocation: (loc: { lat: number; lng: number; address: string } | null) => void;
  updateSubscription: (plan: 'pro' | 'elite') => Promise<void>;
  addCredits: (amount: number, method: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const userDocRef = useMemo(() => (db && authUser ? doc(db, 'users', authUser.uid) : null), [db, authUser]);
  const { data: profileData, loading: profileLoading } = useDoc(userDocRef);

  const [language, setLanguage] = useState<Language>('en');
  const [isGlobalKillSwitchActive, setIsGlobalKillSwitchActive] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const t = translations[language];

  const user = useMemo(() => {
    if (!authUser || !profileData) return null;
    return {
      uid: authUser.uid,
      ...profileData
    } as UserProfile;
  }, [authUser, profileData]);

  const switchRole = async () => {
    if (!userDocRef || !user) return;
    const nextRole: Role = user.role === 'seeker' ? 'provider' : 'seeker';
    updateDoc(userDocRef, { role: nextRole });
  };

  const updateSubscription = async (plan: 'pro' | 'elite') => {
    if (!userDocRef) return;
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    updateDoc(userDocRef, { 
      subscriptionPlan: plan,
      subscriptionExpiry: expiryDate.toISOString()
    });
  };

  const addCredits = async (amount: number, method: string) => {
    if (!userDocRef || !user || !db) return;
    const newBalance = (user.walletBalance || 0) + amount;
    
    // Update user balance
    updateDoc(userDocRef, { walletBalance: newBalance });
    
    // Log transaction
    const transRef = doc(db, 'transactions', `${user.uid}_${Date.now()}`);
    setDoc(transRef, {
      userId: user.uid,
      amount,
      type: 'credit',
      method,
      timestamp: new Date().toISOString()
    });
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
        loading: authLoading || profileLoading,
        language,
        setLanguage,
        t,
        switchRole,
        isGlobalKillSwitchActive,
        toggleGlobalKillSwitch,
        location,
        setLocation,
        updateSubscription,
        addCredits,
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
