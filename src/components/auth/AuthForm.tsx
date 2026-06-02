
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Phone, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser, t } = useAppContext();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    
    // Simulate API call to Supabase Auth
    setTimeout(() => {
      setUser({
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        phone: phone,
        role: phone === "000" ? "admin" : "seeker",
        isActive: true
      });
      setLoading(false);
      router.push("/onboarding");
    }, 1500);
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
