
"use client";

import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShieldAlert, AlertTriangle, Users, Globe } from "lucide-react";

export default function AdminPage() {
  const { isGlobalKillSwitchActive, toggleGlobalKillSwitch, t, user } = useAppContext();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-pro-slate flex items-center justify-center p-6">
        <p className="text-pro-sage/60">Access Denied.</p>
      </div>
    );
  }

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
              Administrative Control
            </h1>
            <p className="text-pro-sage/60">Manage platform-wide security and trial status.</p>
          </div>
        </div>

        <div className="grid gap-8">
          <Card className={`glass transition-colors duration-500 ${isGlobalKillSwitchActive ? 'border-destructive bg-destructive/5' : 'border-white/20'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className={`text-xl flex items-center gap-2 ${isGlobalKillSwitchActive ? 'text-destructive' : 'text-pro-sage'}`}>
                  <AlertTriangle className="h-5 w-5" />
                  {t.killSwitch}
                </CardTitle>
                <CardDescription className="text-pro-sage/50">
                  {t.killSwitchDesc}
                </CardDescription>
              </div>
              <Switch 
                checked={isGlobalKillSwitchActive} 
                onCheckedChange={toggleGlobalKillSwitch}
                className="data-[state=checked]:bg-destructive"
              />
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-xl border ${isGlobalKillSwitchActive ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-pro-sage/10 border-pro-sage/20 text-pro-sage'} flex items-center gap-3`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isGlobalKillSwitchActive ? 'bg-destructive' : 'bg-green-500'}`} />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Platform Status: {isGlobalKillSwitchActive ? 'Restricted' : 'Healthy'}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-pro-sage/60 uppercase tracking-widest flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-pro-sage">2,841</p>
                <p className="text-xs text-green-400 mt-1">+12% from last week</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-pro-sage/60 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Active Regions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-pro-sage">14</p>
                <p className="text-xs text-pro-sage/40 mt-1">Lahore, Karachi, Islamabad...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
