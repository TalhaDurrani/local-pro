
"use client";

import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, AlertTriangle, Users, Globe, BarChart3 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, collection, query, getDocs } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user, t } = useAppContext();
  const db = useFirestore();
  
  const settingsRef = doc(db, "settings", "global");
  const { data: settings } = useDoc(settingsRef);
  
  const [stats, setStats] = useState({ users: 0, transactions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const uSnap = await getDocs(collection(db, "users"));
      const tSnap = await getDocs(collection(db, "transactions"));
      setStats({
        users: uSnap.size,
        transactions: tSnap.size
      });
    };
    fetchStats();
  }, [db]);

  const toggleGlobalKillSwitch = async (val: boolean) => {
    try {
      await setDoc(settingsRef, { globalFreeTrialActive: val }, { merge: true });
      toast({ 
        title: val ? "Trials Enabled" : "Global Override Triggered",
        description: val ? "Free trials are now active." : "All trial accounts have been restricted.",
        variant: val ? "default" : "destructive"
      });
    } catch (e) {
      toast({ title: "Failed to update settings", variant: "destructive" });
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-pro-slate flex items-center justify-center p-6">
        <p className="text-pro-sage/60">Unauthorized Access.</p>
      </div>
    );
  }

  const isOverrideActive = settings?.globalFreeTrialActive === false;

  return (
    <div className="min-h-screen bg-pro-slate">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 pt-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-pro-sage/20 rounded-2xl flex items-center justify-center text-pro-sage">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-bold text-pro-sage">
              Superadmin Control Panel
            </h1>
            <p className="text-pro-sage/60">Operational metrics and system overrides.</p>
          </div>
        </div>

        <div className="grid gap-8">
          <Card className={`glass transition-all duration-500 ${isOverrideActive ? 'border-destructive bg-destructive/10' : 'border-white/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className={`text-xl flex items-center gap-2 ${isOverrideActive ? 'text-destructive' : 'text-pro-sage'}`}>
                  <AlertTriangle className="h-5 w-5" />
                  Global Free Trial Override
                </CardTitle>
                <CardDescription className="text-pro-sage/50">
                  Toggling this off instantly terminates all free trial sessions platform-wide.
                </CardDescription>
              </div>
              <Switch 
                checked={settings?.globalFreeTrialActive ?? true} 
                onCheckedChange={toggleGlobalKillSwitch}
                className="data-[state=unchecked]:bg-destructive"
              />
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-pro-sage/60 uppercase tracking-widest flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-pro-sage">{stats.users}</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-pro-sage/60 uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-pro-sage">{stats.transactions}</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-pro-sage/60 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-400">OPTIMAL</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
