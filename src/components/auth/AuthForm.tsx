
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Phone, ArrowRight, Loader2, Lock, User, MapPin, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function AuthForm() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"seeker" | "provider">("seeker");
  const [category, setCategory] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { t, setLocation } = useAppContext();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        address: "Auto-detected Location, Lahore"
      });
      toast({ title: "Location captured!" });
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !auth || !db) return;
    setLoading(true);
    
    const email = `${phone}@prolocal.com`;

    try {
      // 1. Check for unique phone in Firestore if registering
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("phone", "==", phone));
      const querySnapshot = await getDocs(q);

      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!" });
        router.push("/dashboard");
      } catch (loginError: any) {
        if (loginError.code === 'auth/user-not-found' || loginError.code === 'auth/invalid-credential') {
          // If phone is unique, create new user
          if (!querySnapshot.empty) {
            throw new Error("Phone number already registered with another account.");
          }

          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            fullName,
            phone,
            role,
            isActive: true,
            walletBalance: 0,
            subscriptionPlan: 'trial',
            subscriptionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            serviceCategory: role === 'provider' ? category : null,
            hourlyRate: role === 'provider' ? Number(rate) : null,
          });
          toast({ title: "Account created successfully!" });
          router.push("/onboarding");
        } else {
          throw loginError;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl glass border-white/20">
      <CardHeader>
        <CardTitle className="text-2xl text-pro-sage font-headline text-center">
          Join ProLocal
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-pro-sage/80">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                <Input
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-pro-sage/80">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                <Input
                  type="tel"
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-pro-sage/80">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                required
              />
            </div>
          </div>

          <div className="space-y-3 py-2">
            <Label className="text-pro-sage/80">I want to...</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(v) => setRole(v as any)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/10 flex-1">
                <RadioGroupItem value="seeker" id="seeker" />
                <Label htmlFor="seeker" className="text-pro-sage">Hire Services</Label>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/10 flex-1">
                <RadioGroupItem value="provider" id="provider" />
                <Label htmlFor="provider" className="text-pro-sage">Offer Services</Label>
              </div>
            </RadioGroup>
          </div>

          {role === 'provider' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-pro-sage/80">Service Category</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                  <Input
                    placeholder="e.g. Plumbing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-pro-sage/80">Hourly Rate (Rs)</Label>
                <Input
                  type="number"
                  placeholder="1500"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="bg-white/5 border-white/20 text-pro-sage"
                  required
                />
              </div>
            </div>
          )}

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-pro-sage/30 text-pro-sage"
            onClick={handleLocate}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Capture Native Geolocation
          </Button>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-pro-sage text-pro-slate hover:bg-pro-sage/90 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Registration"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
