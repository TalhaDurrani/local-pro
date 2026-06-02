
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Wallet, Smartphone, ShieldCheck, Loader2, Zap, Dialog as DialogIcon } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function WalletBilling() {
  const [processing, setProcessing] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [currentMethod, setCurrentMethod] = useState("");
  
  const { user, addCredits, updateSubscription, t } = useAppContext();

  const initiatePayment = (method: string) => {
    setCurrentMethod(method);
    setShowPin(true);
  };

  const handlePayment = async () => {
    if (pin.length < 4) return;
    setShowPin(false);
    setProcessing(currentMethod);
    
    try {
      await addCredits(2000, currentMethod);
      toast({
        title: "Transaction Success",
        description: `Rs. 2000 added via ${currentMethod}. Profile activated.`,
      });
      setPin("");
    } catch (error) {
      toast({ title: "Payment Failed", variant: "destructive" });
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
            Provider Billing Hub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 rounded-2xl bg-pro-sage/10 border border-pro-sage/30 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium text-pro-sage/60 uppercase tracking-widest mb-1">Trial Status</span>
            <span className="text-sm font-bold text-pro-sage mb-2">90 Days Remaining</span>
            <span className="text-3xl font-bold text-pro-sage">Rs. {user?.walletBalance || 0}</span>
          </div>

          <div className="grid gap-3">
            <Button 
              variant="outline" 
              className="h-14 border-pro-sage/20 bg-white/5 hover:bg-pro-sage/10 text-pro-sage flex items-center justify-between px-6"
              onClick={() => initiatePayment('JazzCash')}
              disabled={!!processing}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-pro-sage" />
                <span className="font-semibold">JazzCash Wallet</span>
              </div>
              {processing === 'JazzCash' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-5 w-5 opacity-50" />}
            </Button>

            <Button 
              variant="outline" 
              className="h-14 border-pro-sage/20 bg-white/5 hover:bg-pro-sage/10 text-pro-sage flex items-center justify-between px-6"
              onClick={() => initiatePayment('Easypaisa')}
              disabled={!!processing}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-pro-sage" />
                <span className="font-semibold">Easypaisa App</span>
              </div>
              {processing === 'Easypaisa' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-5 w-5 opacity-50" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mock PIN Popup */}
      <Dialog open={showPin} onOpenChange={setShowPin}>
        <DialogContent className="glass border-white/20 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pro-sage flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authorize {currentMethod}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-4">
            <p className="text-sm text-pro-sage/60">Enter your 4-digit mobile wallet PIN to confirm the Rs. 2000 payment.</p>
            <Input 
              type="password" 
              maxLength={4} 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-2xl tracking-[1em] bg-white/10 border-white/20 text-pro-sage"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePayment} className="w-full bg-pro-sage text-pro-slate">
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
