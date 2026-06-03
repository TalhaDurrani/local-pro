"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Phone, ArrowRight, Loader2, Lock, User, Briefcase, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"seeker" | "provider">("seeker");
  const [category, setCategory] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    
    // Strip non-numeric characters for database consistency
    const cleanPhone = phone.replace(/\D/g, '');
    const dbRole = role === 'seeker' ? 'user' : 'provider';

    try {
      if (isLogin) {
        // --- LOG IN FLOW (Email & Password Only) ---
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        
        if (error) throw error;
        
        toast({ title: "Welcome back!" });
        router.push("/dashboard");

      } else {
        // --- SIGN UP FLOW ---
        if (!cleanPhone) throw new Error("Please enter a valid phone number.");

        // 1. Explicitly check if the phone number is already registered
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('phone')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          throw new Error("This phone number is already registered to another account.");
        }

        // 2. Create the Auth Account using Email
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // 3. Insert Profile Data
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: fullName,
            phone: cleanPhone,
            role: dbRole,
            city: 'Lahore' 
          });

          if (profileError) {
            console.error("Profile Error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          // 4. Insert Provider Details (if applicable)
          if (role === 'provider') {
            const { error: providerError } = await supabase.from('provider_details').insert({
              provider_id: signUpData.user.id,
              category: category,
              hourly_rate: Number(rate)
            });
            
            if (providerError) {
              console.error("Provider Error:", providerError);
              throw new Error(`Provider details failed: ${providerError.message}`);
            }
          }

          toast({ title: "Account created successfully!" });
          router.push("/onboarding");
        }
      }
    } catch (error: any) {
      console.error("Auth Error Details:", error);
      toast({
        title: "Authentication Failed",
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
          {isLogin ? "Welcome Back" : "Join ProLocal"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-4">
          
          {/* FULL NAME (Signup Only) */}
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-pro-sage/80">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                <Input
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {/* EMAIL & PHONE ROW */}
          <div className={`grid grid-cols-1 ${!isLogin ? 'md:grid-cols-2' : ''} gap-4`}>
            
            {/* EMAIL (Always visible) */}
            <div className="space-y-2">
              <Label className="text-pro-sage/80">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                  required
                />
              </div>
            </div>

            {/* PHONE (Signup Only) */}
            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-pro-sage/80">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-pro-sage/60" />
                  <Input
                    type="tel"
                    placeholder="03001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-pro-sage"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}
          </div>

          {/* PASSWORD (Always visible) */}
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
                minLength={6}
              />
            </div>
          </div>

          {/* ROLE SELECTOR (Signup Only) */}
          {!isLogin && (
            <>
              <div className="space-y-3 py-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-pro-sage/80">I want to...</Label>
                <RadioGroup 
                  value={role} 
                  onValueChange={(v) => setRole(v as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/10 flex-1 cursor-pointer">
                    <RadioGroupItem value="seeker" id="seeker" />
                    <Label htmlFor="seeker" className="text-pro-sage cursor-pointer">Hire Services</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/10 flex-1 cursor-pointer">
                    <RadioGroupItem value="provider" id="provider" />
                    <Label htmlFor="provider" className="text-pro-sage cursor-pointer">Offer Services</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* PROVIDER DETAILS (Signup Only, if role === provider) */}
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
                        required={!isLogin && role === 'provider'}
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
                      required={!isLogin && role === 'provider'}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="pt-2 text-center">
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setLoading(false);
              }}
              className="text-sm text-pro-sage/80 hover:text-pro-sage underline underline-offset-4"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-pro-sage text-pro-slate hover:bg-pro-sage/90 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isLogin ? "Log In" : "Create Account")}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}