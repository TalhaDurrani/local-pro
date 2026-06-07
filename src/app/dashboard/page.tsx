"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import SeekerFeed from "@/components/dashboard/SeekerFeed";
import SeekerRequests from "@/components/dashboard/SeekerRequests";
import ProviderLeads from "@/components/provider/ProviderLeads";
import ProviderStats from "@/components/provider/ProviderStats";

export default function DashboardPage() {
  const { user, loading, t } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    if (user.role === "superadmin") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === "superadmin") {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  const firstName = user.full_name.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="px-4 py-8 md:px-8 md:py-12 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold tracking-tight">
            {t.welcomeBackTitle}, {firstName}
          </h1>
          <p className="text-foreground/65">
            {user.role === "provider" ? t.providerOverview : t.findProfessionals}
          </p>
        </header>

        {user.role === "provider" ? (
          <div className="space-y-10">
            <ProviderStats />
            <ProviderLeads />
          </div>
        ) : (
          <div className="space-y-10">
            <SeekerRequests />
            <SeekerFeed />
          </div>
        )}
      </main>
    </div>
  );
}
