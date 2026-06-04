
"use client";

import AuthForm from "@/components/auth/AuthForm";
import Navbar from "@/components/layout/Navbar";
import { useAppContext } from "@/context/AppContext";

export default function AuthPage() {
  const { t } = useAppContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex items-center justify-center p-6 pt-20">
        <div className="w-full flex flex-col items-center">
          <AuthForm />
          <p className="mt-8 text-foreground/50 text-sm max-w-xs text-center">
            {t.termsDisclaimer}
          </p>
        </div>
      </main>
    </div>
  );
}
