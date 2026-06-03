"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Gift, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProviderData {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  has_active_sub?: boolean;
}

export default function AdminDashboard() {
  const { user, loading } = useAppContext();
  const router = useRouter();
  
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bulletproof Data Loader
  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      // Don't do anything if the main context is still loading
      if (loading) return; 

      // Security check
      if (!user) {
        router.push("/");
        return;
      }
      if (user.role !== 'superadmin' && user.role !== 'admin') {
        router.push("/dashboard");
        return;
      }

      try {
        setFetching(true);
        setErrorMsg(null);

        // 1. Fetch all profiles with the role of 'provider'
        const { data: providerProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'provider');

        if (profileError) throw new Error(`Profile Fetch Error: ${profileError.message}`);

        // 2. Fetch all completed transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('sender_id')
          .eq('status', 'completed');

        if (txError) throw new Error(`Transaction Fetch Error: ${txError.message}`);

        // 3. Map out who has a subscription
        const activeProviderIds = new Set((txData || []).map(tx => tx.sender_id));

        const mergedData = (providerProfiles || []).map(p => ({
          ...p,
          has_active_sub: activeProviderIds.has(p.id)
        })) as ProviderData[];

        if (isMounted) {
          setProviders(mergedData);
        }
      } catch (error: any) {
        console.error("Admin Dashboard Error:", error);
        if (isMounted) setErrorMsg(error.message);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadAdminData();

    // Cleanup function prevents state updates if component unmounts mid-fetch
    return () => { isMounted = false; };
  }, [user, loading, router]);

  const grantFreeTrial = async (providerId: string, providerName: string) => {
    setProcessingId(providerId);
    try {
      // Inject a $0 "completed" transaction to bypass the paywall
      const { error } = await supabase.from('transactions').insert({
        sender_id: providerId,
        amount: 0,
        transaction_type: 'free_trial',
        status: 'completed',
      });

      if (error) throw error;

      toast({ title: `Free Trial granted to ${providerName}!` });
      
      // Update local state instantly instead of re-fetching the whole database
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, has_active_sub: true } : p
      ));

    } catch (error: any) {
      console.error("Trial grant error:", error);
      toast({ title: "Failed to grant trial", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-pro-slate flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-pro-sage" />
      </div>
    );
  }

  // If there was a database error, show it clearly instead of spinning forever
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-pro-slate flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl text-white font-bold mb-2">Admin Dashboard Error</h2>
        <p className="text-white/50 max-w-md">{errorMsg}</p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-pro-sage text-pro-slate">
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) return null;

  return (
    <div className="min-h-screen bg-pro-slate">
      <Navbar />
      
      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-headline text-pro-sage font-bold flex items-center gap-3">
              <ShieldAlert className="h-8 w-8" />
              Superadmin Control
            </h1>
            <p className="text-pro-sage/70 text-lg">
              Manage platform users, subscriptions, and overrides.
            </p>
          </div>
        </div>

        <Card className="glass border-white/10 shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-pro-sage text-lg font-headline">Registered Providers</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-0 sm:px-6">
            <div className="overflow-x-auto">
              {providers.length === 0 ? (
                <p className="text-center text-sm text-white/30 py-8">No service providers registered yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase text-white/40 tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {providers.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{p.full_name}</td>
                        <td className="py-3 px-4 text-white/70">{p.phone}</td>
                        <td className="py-3 px-4 text-white/70">{p.city}</td>
                        <td className="py-3 px-4">
                          {p.has_active_sub ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-md">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-400/10 w-fit px-2 py-1 rounded-md">
                              <XCircle className="h-3.5 w-3.5" /> Locked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            size="sm"
                            disabled={p.has_active_sub || processingId === p.id}
                            onClick={() => grantFreeTrial(p.id, p.full_name)}
                            className={`font-bold ${p.has_active_sub ? 'bg-white/5 text-white/30' : 'bg-pro-sage text-pro-slate hover:bg-pro-sage/90'}`}
                          >
                            {processingId === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Gift className="h-4 w-4 mr-2" />
                                {p.has_active_sub ? "Subscribed" : "Grant Trial"}
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}