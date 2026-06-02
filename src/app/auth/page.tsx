
"use client";

import AuthForm from "@/components/auth/AuthForm";
import Navbar from "@/components/layout/Navbar";
import { useAppContext } from "@/context/AppContext";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-pro-slate">
      <Navbar />
      <main className="flex items-center justify-center p-6 pt-20">
        <div className="w-full flex flex-col items-center">
          <AuthForm />
          <p className="mt-8 text-pro-sage/40 text-sm max-w-xs text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy. Secure phone-based verification will follow.
          </p>
        </div>
      </main>
    </div>
  );
}
