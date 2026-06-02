
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Phone, ArrowRight, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function AuthForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useAppContext();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !auth || !db) return;
    setLoading(true);
    
    const email = `${phone}@prolocal.com`; // Dummy email for phone-based login structure

    try {
      try {
        // Try to login
        await signInWithEmailAndPassword(auth, email, password);
      } catch (loginError: any) {
        if (loginError.code === 'auth/user-not-found') {
          // If user doesn't exist, create account
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCred.user.uid), {
            phone: phone,
            role: phone === "000" ? "admin" : "seeker",
            isActive: true,
            walletBalance: 0,
            subscriptionPlan: 'trial',
            subscriptionExpiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          });
        } else {
          throw loginError;
        }
      }
      toast({ title: "Welcome to ProLocal" });
      router.push("/onboarding");
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl text-pro-sage font-headline text-center">
          {t.login}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
            <Input
              type="tel"
              placeholder={t.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-pro-sage placeholder:text-pro-sage/40"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-white/5 border-white/20 text-pro-sage placeholder:text-pro-sage/40"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-pro-sage text-pro-slate hover:bg-pro-sage/90 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.continue}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
