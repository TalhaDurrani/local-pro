
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, Smartphone, ShieldCheck, Loader2, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function WalletBilling() {
  const [processing, setProcessing] = useState<string | null>(null);
  const { user, addCredits, updateSubscription, t } = useAppContext();

  const handlePayment = async (method: string) => {
    setProcessing(method);
    try {
      await addCredits(500, method);
      toast({
        title: "Top-up Successful",
        description: `Successfully added Rs. 500 via ${method}.`,
        className: "bg-green-500/20 border-green-500/50 text-green-400"
      });
    } catch (error) {
      toast({ title: "Payment Failed", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'elite') => {
    const cost = plan === 'pro' ? 1000 : 5000;
    if ((user?.walletBalance || 0) < cost) {
      toast({
        title: "Insufficient Balance",
        description: `Please top up at least Rs. ${cost} to subscribe to ${plan}.`,
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(plan);
    try {
      await updateSubscription(plan);
      toast({
        title: "Subscription Updated",
        description: `You are now a ${plan.toUpperCase()} member!`,
      });
    } catch (error) {
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-pro-sage flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t.billingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-2xl bg-pro-sage/10 border border-pro-sage/30 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-pro-sage/60 uppercase tracking-widest mb-2">Available Balance</span>
            <span className="text-4xl font-bold text-pro-sage">Rs. {user?.walletBalance || 0}</span>
          </div>

          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="h-14 border-pro-sage/20 bg-white/5 hover:bg-pro-sage/10 text-pro-sage flex items-center justify-between px-6"
              onClick={() => handlePayment('JazzCash')}
              disabled={!!processing}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-pro-sage" />
                <span className="font-semibold">JazzCash</span>
              </div>
              {processing === 'JazzCash' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-5 w-5 opacity-50" />}
            </Button>

            <Button 
              variant="outline" 
              className="h-14 border-pro-sage/20 bg-white/5 hover:bg-pro-sage/10 text-pro-sage flex items-center justify-between px-6"
              onClick={() => handlePayment('Easypaisa')}
              disabled={!!processing}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-pro-sage" />
                <span className="font-semibold">Easypaisa</span>
              </div>
              {processing === 'Easypaisa' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-5 w-5 opacity-50" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-white/20">
        <CardHeader>
          <CardTitle className="text-lg text-pro-sage flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Subscription Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-xl border ${user?.subscriptionPlan === 'pro' ? 'border-pro-sage bg-pro-sage/10' : 'border-white/10'} flex items-center justify-between`}>
            <div>
              <p className="font-bold text-pro-sage">PRO PLAN</p>
              <p className="text-xs text-pro-sage/60">Rs. 1,000 / Month</p>
            </div>
            <Button 
              size="sm" 
              variant={user?.subscriptionPlan === 'pro' ? 'default' : 'outline'}
              disabled={user?.subscriptionPlan === 'pro' || !!processing}
              onClick={() => handleUpgrade('pro')}
            >
              {user?.subscriptionPlan === 'pro' ? 'Active' : 'Upgrade'}
            </Button>
          </div>

          <div className={`p-4 rounded-xl border ${user?.subscriptionPlan === 'elite' ? 'border-pro-sage bg-pro-sage/10' : 'border-white/10'} flex items-center justify-between`}>
            <div>
              <p className="font-bold text-pro-sage">ELITE PLAN</p>
              <p className="text-xs text-pro-sage/60">Rs. 5,000 / Year</p>
            </div>
            <Button 
              size="sm" 
              variant={user?.subscriptionPlan === 'elite' ? 'default' : 'outline'}
              disabled={user?.subscriptionPlan === 'elite' || !!processing}
              onClick={() => handleUpgrade('elite')}
            >
              {user?.subscriptionPlan === 'elite' ? 'Active' : 'Upgrade'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
