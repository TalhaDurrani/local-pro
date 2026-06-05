"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Phone, ArrowRight, Loader2, Lock, User, Briefcase, Mail, Eye, EyeOff, MapPin, Search, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import useLocation from "@/hooks/useLocation";
import { PAKISTAN_DATA } from "@/lib/pakistan-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { t } = useAppContext();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"seeker" | "provider">("seeker");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  // Location State
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [nearestLandmark, setNearestLandmark] = useState("");
  
  // Search Filters for Dropdowns
  const [citySearch, setCitySearch] = useState("");

  const { fetchLocation, loading: locating } = useLocation();
  const router = useRouter();

  const handleLocate = async () => {
    try {
      const result = await fetchLocation();
      // Try to find matching province in our data
      const matchedProvince = PAKISTAN_DATA.find(p => 
        result.province?.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(result.province?.toLowerCase() || "")
      );
      
      if (matchedProvince) {
        setProvince(matchedProvince.name);
        // Try to find matching city
        const matchedCity = matchedProvince.cities.find(c => 
          result.city?.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(result.city?.toLowerCase() || "")
        );
        if (matchedCity) setCity(matchedCity);
      } else {
        // Fallback to raw values if no match found in our list
        setProvince(result.province || "");
        setCity(result.city || "");
      }

      setDistrict(result.area || "");
      setNearestLandmark(result.displayAddress || "");
      toast({ title: t.locationStatus || "Location detected!" });
    } catch (err: any) {
      toast({ 
        title: "Location Error", 
        description: err.message || "Unable to detect location. Please enter manually.",
        variant: "destructive" 
      });
    }
  };

  const filteredCities = useMemo(() => {
    const provinceData = PAKISTAN_DATA.find(p => p.name === province);
    if (!provinceData) return [];
    return provinceData.cities.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [province, citySearch]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        return;
      }
      if (!city || !province || !district || !nearestLandmark) {
        toast({
          title: "Error",
          description: "Please complete all location fields.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    
    const cleanPhone = phone.replace(/\D/g, '');
    const dbRole = role === 'seeker' ? 'user' : 'provider';

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        
        if (error) throw error;
        
        toast({ title: t.welcomeBackTitle });
        router.push("/dashboard");

      } else {
        if (!cleanPhone) throw new Error(t.validPhoneNumber);

        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('phone')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingPhone) {
          throw new Error("This phone number is already registered to another account.");
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: signUpData.user.id,
            full_name: fullName,
            phone: cleanPhone,
            role: dbRole,
            city: city,
            province: province,
            district: district,
            nearest_landmark: nearestLandmark,
          });

          if (profileError) {
            console.error("Profile Error:", profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          if (role === 'provider') {
            const { error: providerError } = await supabase.from('provider_details').insert({
              provider_id: signUpData.user.id,
              category: category,
            });

            if (providerError) {
              console.error("Provider Error:", providerError);
              throw new Error(`Provider details failed: ${providerError.message}`);
            }
          }

          // Force login if a session wasn't automatically created during signUp
          if (!signUpData.session) {
            await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password,
            });
          }

          toast({ title: t.accountCreatedSuccessfully });
          
          // Small delay to allow AppContext to sync the session/profile
          setTimeout(() => {
            router.push("/dashboard");
          }, 500);
        }
      }
    } catch (error: any) {
      console.error("Auth Error Details:", error);
      toast({
        title: t.authenticationFailed,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl glass border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground font-headline text-center">
          {isLogin ? t.welcomeBackTitle : t.joinProLocal}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleAuth}>
        <CardContent className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3">
                <Label className="text-foreground/70">{t.iWantTo}</Label>
                <RadioGroup 
                  value={role} 
                  onValueChange={(v) => setRole(v as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg border border-border flex-1 cursor-pointer">
                    <RadioGroupItem value="seeker" id="seeker" />
                    <Label htmlFor="seeker" className="text-foreground cursor-pointer">{t.hireServices}</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg border border-border flex-1 cursor-pointer">
                    <RadioGroupItem value="provider" id="provider" />
                    <Label htmlFor="provider" className="text-foreground cursor-pointer">{t.offerServices}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t.locationSetup}
                  </Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLocate}
                    disabled={locating}
                    className="h-8 text-xs border-accent/50 text-accent hover:bg-accent/10"
                  >
                    {locating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                    {t.onboardingLocation}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">Province</Label>
                    <Select value={province} onValueChange={(v) => { setProvince(v); setCity(""); setCitySearch(""); }}>
                      <SelectTrigger className="bg-muted border-border h-10">
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAKISTAN_DATA.map((p) => (
                          <SelectItem key={p.name} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">City</Label>
                    <Select value={city} onValueChange={setCity} disabled={!province}>
                      <SelectTrigger className="bg-muted border-border h-10">
                        <SelectValue placeholder={province ? "Select City" : "Select Province First"} />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 pb-2 pt-1">
                           <div className="relative">
                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input
                               placeholder="Search city..."
                               value={citySearch}
                               onChange={(e) => setCitySearch(e.target.value)}
                               className="pl-8 h-9 bg-background"
                             />
                           </div>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 text-center text-sm text-muted-foreground">No city found.</div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">District / Area</Label>
                    <Input 
                      placeholder="e.g. Gulberg, Sector F-6" 
                      value={district} 
                      onChange={(e) => setDistrict(e.target.value)}
                      className="bg-muted border-border h-10"
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">Nearest Landmark</Label>
                    <Input 
                      placeholder="e.g. Near Metro Station" 
                      value={nearestLandmark} 
                      onChange={(e) => setNearestLandmark(e.target.value)}
                      className="bg-muted border-border h-10"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-foreground/70">{t.fullName}</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                  <Input
                    placeholder={t.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-muted text-foreground border-border"
                    required={!isLogin}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${!isLogin ? 'md:grid-cols-2' : ''} gap-4`}>
            <div className="space-y-2">
              <Label className="text-foreground/70">{t.emailAddress}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted text-foreground border-border"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-foreground/70">{t.phoneNumber}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                  <Input
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-muted text-foreground border-border"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={`grid grid-cols-1 ${!isLogin ? 'md:grid-cols-2' : ''} gap-4`}>
            <div className="space-y-2">
              <Label className="text-foreground/70">{t.password}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-muted text-foreground border-border"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-foreground/50 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-foreground/70">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={password ? "••••••••" : t.passwordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-muted text-foreground border-border"
                    required={!isLogin}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-foreground/50 hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isLogin && role === 'provider' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-foreground/70">{t.serviceCategory}</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-foreground/50" />
                <Input
                  placeholder={t.serviceCategory}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="pl-10 bg-muted text-foreground border-border"
                  required={!isLogin && role === 'provider'}
                />
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setLoading(false);
              }}
              className="text-sm text-foreground/70 hover:text-foreground underline underline-offset-4"
            >
              {isLogin ? t.needAccount : t.alreadyHaveAccount}
            </button>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isLogin ? t.logIn : t.createAccount)}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
