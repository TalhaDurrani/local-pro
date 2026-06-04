"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert, Gift, CheckCircle2, XCircle, Ban } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProviderData {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  has_active_sub?: boolean;
  is_banned?: boolean;
  email?: string | null;
  created_at?: string | null;
  display_address?: string | null;
  area?: string | null;
}

export default function AdminDashboard() {
  const { user, loading } = useAppContext();
  const router = useRouter();
  
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [fetching, setFetching] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAdminData = async () => {
      if (loading) return; 
      if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
        router.push("/");
        return;
      }

      try {
        setFetching(true);
        const { data: providerProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'provider');

        if (profileError) throw profileError;

        const now = new Date().toISOString();
        const activeProviderIds = new Set(
          (providerProfiles || [])
            .filter(p => p.subscription_end_date && p.subscription_end_date > now)
            .map(p => p.id)
        );

        const mergedData = (providerProfiles || []).map(p => ({
          ...p,
          has_active_sub: activeProviderIds.has(p.id)
        })) as ProviderData[];

        if (isMounted) setProviders(mergedData);
      } catch (error: any) {
        if (isMounted) setErrorMsg(error.message);
      } finally {
        if (isMounted) setFetching(false);
      }
    };

    loadAdminData();
    return () => { isMounted = false; };
  }, [user, loading, router]);

  const grantFreeTrial = async (providerId: string, providerName: string) => {
    setProcessingId(providerId);
    try {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { error } = await supabase.from('profiles')
        .update({ subscription_end_date: trialEnd.toISOString() })
        .eq('id', providerId);

      if (error) throw error;
      await supabase.from('transactions').insert({ sender_id: providerId, amount: 0, transaction_type: 'free_trial', status: 'completed' });

      toast({ title: `14-Day Trial granted to ${providerName}!` });
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, has_active_sub: true } : p));
    } catch (error: any) {
      toast({ title: "Failed to grant trial", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const toggleBanStatus = async (providerId: string, currentStatus: boolean, providerName: string) => {
    setProcessingId(providerId);
    try {
      const { error } = await supabase.from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', providerId);

      if (error) throw error;

      toast({ title: `${providerName} has been ${!currentStatus ? 'banned' : 'unbanned'}.` });
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, is_banned: !currentStatus } : p));
    } catch (error: any) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || fetching) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  if (errorMsg) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><ShieldAlert className="h-12 w-12 text-destructive mb-4" /><p>{errorMsg}</p></div>;
  if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-headline text-accent font-bold flex items-center gap-3">
            <ShieldAlert className="h-8 w-8" /> Superadmin Control
          </h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader><CardTitle className="text-foreground">Registered Providers</CardTitle></CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Joined</th>
                      <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Sub Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {providers.map((p) => (
                    <tr key={p.id} className={p.is_banned ? 'opacity-50 bg-destructive/5' : ''}>
                        <td className="py-3 px-4 font-medium">{p.full_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.email || '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.phone}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{p.display_address || (p.city ? `${p.city}${p.area ? ', ' + p.area : ''}` : '—')}</td>
                      <td className="py-3 px-4">
                        {p.has_active_sub ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-md text-xs font-bold">Active</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded-md text-xs font-bold">Expired</span>}
                      </td>
                      <td className="py-3 px-4">
                        {p.is_banned ? <span className="text-destructive font-bold text-xs flex items-center"><Ban className="w-3 h-3 mr-1"/> Banned</span> : <span className="text-muted-foreground text-xs">Clear</span>}
                      </td>
                      <td className="py-3 px-4 flex justify-end gap-2">
                        <Button size="sm" disabled={p.has_active_sub || processingId === p.id || p.is_banned} onClick={() => grantFreeTrial(p.id, p.full_name)}>
                          <Gift className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant={p.is_banned ? "outline" : "destructive"} disabled={processingId === p.id} onClick={() => toggleBanStatus(p.id, !!p.is_banned, p.full_name)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}