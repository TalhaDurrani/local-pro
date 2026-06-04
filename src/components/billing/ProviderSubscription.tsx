"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
}

export default function ProviderSubscription() {
  const { user } = useAppContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // We determine if they are active based on if they have a recent successful payment
  const [isSubscribed, setIsSubscribed] = useState(false);

  const SUBSCRIPTION_PRICE = 2000; // Rs. 2000 per month

  const fetchSubscriptionData = async () => {
    if (!user || user.role !== 'provider') return;
    setLoading(true);
    
    try {
      // Fetch billing history
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("sender_id", user.id) // Provider is the sender of the payment
        .order("created_at", { ascending: false });

      if (txError) throw txError;
      
      const history = txData || [];
      setTransactions(history);

      // Check if they have a completed payment (Simulating an active subscription)
      const hasPaid = history.some(tx => tx.status === 'completed');
      setIsSubscribed(hasPaid);

    } catch (error: any) {
      console.error("Subscription fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) return;

    setActionLoading(true);
    try {
      // Simulate successful payment gateway response (JazzCash/Easypaisa)
      const { error: txError } = await supabase.from("transactions").insert({
        sender_id: user.id, // Provider pays
        amount: SUBSCRIPTION_PRICE,
        transaction_type: "payment", // Using standard payment type
        status: "completed",
      });

      if (txError) throw txError;

      toast({ title: "Subscription activated successfully!" });
      fetchSubscriptionData();
    } catch (error: any) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-muted rounded-xl border border-border">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Subscription Status Card */}
        <Card className={`glass border-border shadow-xl md:col-span-1 ${isSubscribed ? 'bg-emerald-900/20' : 'bg-rose-900/20'}`}>
          <CardHeader className="pb-2">
            <CardDescription className="text-foreground/70 uppercase text-xs tracking-wider font-bold">
              Current Plan
            </CardDescription>
            <CardTitle className="text-2xl font-headline font-black text-foreground flex items-center gap-2">
              {isSubscribed ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  Active Pro
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-rose-400" />
                  Inactive
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-foreground/70">
              {isSubscribed 
                ? "Your profile is live and visible to all seekers." 
                : "Subscribe to start receiving leads and job requests."}
            </p>
          </CardContent>
        </Card>

        {/* Payment Action Card */}
        <Card className="glass border-border shadow-xl md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-accent text-sm font-bold uppercase tracking-wider">
              Manage Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-bold text-foreground">Rs. {SUBSCRIPTION_PRICE} <span className="text-sm text-foreground/60 font-normal">/ month</span></p>
              <p className="text-xs text-foreground/60 mt-1">Billed securely via JazzCash / EasyPaisa</p>
            </div>
            
            <Button 
              onClick={handleSubscribe} 
              disabled={actionLoading || isSubscribed}
              className={`font-bold w-full sm:w-auto ${isSubscribed ? 'bg-muted/10 text-foreground/70' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {isSubscribed ? "Already Subscribed" : "Pay & Activate"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Billing Ledger */}
      <Card className="glass border-border shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div>
            <CardTitle className="text-foreground text-lg font-headline">Billing History</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchSubscriptionData} className="text-foreground/70 hover:text-foreground">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-4 px-0 sm:px-6">
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-center text-sm text-foreground/50 py-8">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-foreground/50 tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/20 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 text-foreground/60 text-xs">
                        {new Date(tx.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">Monthly Pro Subscription</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        Rs. {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}