
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function WalletBilling() {
  const [processing, setProcessing] = useState<string | null>(null);
  const { walletBalance, setWalletBalance, t } = useAppContext();

  const handlePayment = (method: string) => {
    setProcessing(method);
    setTimeout(() => {
      setWalletBalance(walletBalance + 500);
      setProcessing(null);
      toast({
        title: "Top-up Successful",
        description: `Successfully added Rs. 500 via ${method}.`,
        className: "bg-green-500/20 border-green-500/50 text-green-400"
      });
    }, 2000);
  };

  return (
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
          <span className="text-4xl font-bold text-pro-sage">Rs. {walletBalance}</span>
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
  );
}
