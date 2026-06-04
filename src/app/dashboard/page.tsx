"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  UserCircle,
  MapPin,
  Phone,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import ProviderSubscription from "@/components/billing/ProviderSubscription";
import { Button } from "@/components/ui/button";
import SeekerFeed from "@/components/dashboard/SeekerFeed";
import EditProfileDialog from "@/components/dashboard/EditProfileDialog";
import ProviderLeads from "@/components/provider/ProviderLeads";

export default function DashboardPage() {
  const { user, loading, t } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-headline text-foreground font-bold">
            {t.welcomeBackTitle}, {user.full_name.split(" ")[0]}!
          </h1>
          <p className="text-foreground/70 text-lg">
            {user.role === "provider" && t.providerOverview}
            {user.role === "superadmin" && t.adminDashboardText}
            {(user.role === "user" || user.role === "seeker") &&
              t.findProfessionals}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass border-border shadow-xl">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  {t.profileStatus}
                </CardTitle>
                <EditProfileDialog />
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <div className="bg-accent/20 p-2 rounded-lg">
                  <UserCircle className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-foreground/60 uppercase tracking-wider">
                    {t.accountType}
                  </p>
                  <p className="font-semibold capitalize">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground">
                <div className="bg-accent/20 p-2 rounded-lg">
                  <Phone className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-foreground/60 uppercase tracking-wider">
                    {t.phone}
                  </p>
                  <p className="font-semibold">{user.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground">
                <div className="bg-accent/20 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xs text-foreground/60 uppercase tracking-wider">
                    {t.locationLabel}
                  </p>
                  <p className="font-semibold">{user.city || "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditional Rendering Based on Exact Role */}
          <div className="md:col-span-2">
            {user.role === "provider" && <ProviderSubscription />}

            {user.role === "superadmin" && (
              <Card className="glass border-border shadow-xl h-full flex flex-col items-center justify-center p-8 bg-accent/5">
                <ShieldAlert className="h-16 w-16 text-accent mb-4 opacity-80" />
                <h2 className="text-2xl font-headline font-bold text-foreground mb-2">
                  {t.masterControl}
                </h2>
                <p className="text-foreground/65 text-center max-w-md mb-8">
                  {t.adminDashboardText}
                </p>
                <Button
                  onClick={() => router.push("/admin")}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-8 py-6 text-lg"
                >
                  {t.enterAdminPanel}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            )}

            {/* INJECT SEEKER FEED HERE */}
            {(user.role === "user" || user.role === "seeker") && <SeekerFeed />}
          </div>
        </div>
      </main>
    </div>
  );
}
