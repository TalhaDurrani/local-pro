"use client";

import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
import Navbar from "@/components/layout/Navbar";
import { useAppContext } from "@/context/AppContext";
import { Loader2 } from "lucide-react";

function AuthFormFallback() {
  return (
    <div className="w-full max-w-xl glass border-border shadow-xl rounded-2xl flex items-center justify-center p-16">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );
}

export default function AuthPage() {
  const { t } = useAppContext();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="flex items-center justify-center p-6 pt-20">
        <div className="w-full flex flex-col items-center">
          <Suspense fallback={<AuthFormFallback />}>
            <AuthForm />
          </Suspense>
          <p className="mt-8 text-foreground/50 text-sm max-w-xs text-center">{t.termsDisclaimer}</p>
        </div>
      </main>
    </div>
  );
}
