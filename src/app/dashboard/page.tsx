
"use client";

import Navbar from "@/components/layout/Navbar";
import { useAppContext } from "@/context/AppContext";
import PerformanceMetrics from "@/components/dashboard/PerformanceMetrics";
import WalletBilling from "@/components/billing/WalletBilling";
import BioTool from "@/components/provider/BioTool";
import { 
  History, 
  Settings, 
  Bell, 
  Map as MapIcon, 
  TrendingUp,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, t } = useAppContext();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-pro-slate pb-20">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-pro-sage">
              {t.dashboard}
            </h2>
            <p className="text-pro-sage/60">
              Welcome back, {user.phone} • {user.role === 'seeker' ? t.roleSeeker : t.roleProvider}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="glass border-white/20 text-pro-sage">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="glass border-white/20 text-pro-sage">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {user.role === 'provider' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PerformanceMetrics />
              <div className="glass p-6 rounded-3xl border-white/20">
                <h3 className="text-lg font-bold text-pro-sage flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5" />
                  Service Pipeline
                </h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-pro-sage font-medium">Home Cleaning #{1024 + i}</p>
                        <p className="text-pro-sage/40 text-xs">Gulberg III • 2 hours ago</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-pro-sage/20 text-pro-sage uppercase tracking-tighter">
                        In Progress
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <BioTool />
              <WalletBilling />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass p-8 rounded-3xl border-white/20 flex flex-col items-center text-center gap-4 cursor-pointer hover:bg-pro-sage/5 transition-all">
              <div className="w-16 h-16 bg-pro-sage/20 rounded-2xl flex items-center justify-center text-pro-sage">
                <MapIcon className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-pro-sage">Nearby Pros</h4>
                <p className="text-pro-sage/60 text-sm">Find professionals around your current location.</p>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border-white/20 flex flex-col items-center text-center gap-4 cursor-pointer hover:bg-pro-sage/5 transition-all">
              <div className="w-16 h-16 bg-pro-sage/20 rounded-2xl flex items-center justify-center text-pro-sage">
                <History className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-pro-sage">Booking History</h4>
                <p className="text-pro-sage/60 text-sm">Review your past service requests and invoices.</p>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border-white/20 flex flex-col items-center text-center gap-4 cursor-pointer hover:bg-pro-sage/5 transition-all">
              <div className="w-16 h-16 bg-pro-sage/20 rounded-2xl flex items-center justify-center text-pro-sage">
                <TrendingUp className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-pro-sage">Exclusive Offers</h4>
                <p className="text-pro-sage/60 text-sm">Browse seasonal discounts from our elite partners.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
