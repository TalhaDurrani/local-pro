"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Phone,
  ArrowRight,
  Loader2,
  Lock,
  User,
  Briefcase,
  Mail,
  Eye,
  EyeOff,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);
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
  const [locationAutoFetched, setLocationAutoFetched] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  // Search Filters for Dropdowns
  const [citySearch, setCitySearch] = useState("");

  const { fetchLocation, loading: locating } = useLocation();
  const router = useRouter();

  const handleLocate = async () => {
    try {
      const result = await fetchLocation();
      let nextProvince = "";
      let nextCity = "";

      const matchedProvince = PAKISTAN_DATA.find(p =>
        result.province?.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(result.province?.toLowerCase() || "")
      );

      if (matchedProvince) {
        nextProvince = matchedProvince.name;
        const matchedCity = matchedProvince.cities.find(c =>
          result.city?.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(result.city?.toLowerCase() || "")
        );
        nextCity = matchedCity || result.city || "";
      } else {
        nextProvince = result.province || "";
        nextCity = result.city || "";
      }

      const nextDistrict = result.area || "";
      const nextLandmark = result.displayAddress || "";

      setProvince(nextProvince);
      setCity(nextCity);
      setDistrict(nextDistrict);
      setNearestLandmark(nextLandmark);

      const allFilled =
        nextProvince.trim() &&
        nextCity.trim() &&
        nextDistrict.trim() &&
        nextLandmark.trim();

      if (allFilled) {
        setLocationAutoFetched(true);
        setEditingLocation(false);
        toast({
          title: "Location detected",
          description: `${nextDistrict}, ${nextCity}`,
        });
      } else {
        setLocationAutoFetched(false);
        setEditingLocation(true);
        toast({
          title: "Almost there",
          description: "We got part of your location. Please fill the missing fields.",
        });
      }
    } catch (err: any) {
      setLocationAutoFetched(false);
      setEditingLocation(true);
      toast({
        title: "Location Error",
        description: err.message || "Unable to detect location. Please enter manually.",
        variant: "destructive",
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

  const locationComplete = useMemo(
    () =>
      province.trim().length > 0 &&
      city.trim().length > 0 &&
      district.trim().length > 0 &&
      nearestLandmark.trim().length > 0,
    [province, city, district, nearestLandmark],
  );

  useEffect(() => {
    if (!locationComplete && locationAutoFetched) {
      setLocationAutoFetched(false);
    }
  }, [locationComplete, locationAutoFetched]);

  const missingSignupFields = useMemo(() => {
    if (isLogin) return [] as string[];
    const missing: string[] = [];
    if (!fullName.trim()) missing.push("full name");
    if (!phone.replace(/\D/g, "")) missing.push("phone number");
    if (!email.trim()) missing.push("email");
    if (password.length < 6) missing.push("password (min 6 characters)");
    if (!locationComplete) missing.push("location");
    if (role === "provider" && !category.trim()) missing.push("service category");
    return missing;
  }, [isLogin, fullName, phone, email, password, locationComplete, role, category]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      if (!email.trim() || !password) {
        toast({
          title: "Missing credentials",
          description: "Please enter your email and password.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (missingSignupFields.length > 0) {
        toast({
          title: "Almost there",
          description: `Please fill: ${missingSignupFields.join(", ")}.`,
          variant: "destructive",
        });
        if (!locationComplete) setEditingLocation(true);
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Passwords do not match",
          description: "Please re-enter the same password in both fields.",
          variant: "destructive",
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

        const next = searchParams.get("next") || "/dashboard";
        toast({ title: t.welcomeBackTitle });
        router.refresh();
        router.replace(next);
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
          options: {
            data: {
              full_name: fullName.trim(),
              phone: cleanPhone,
              role: dbRole,
              city: city.trim(),
              province: province.trim(),
              district: district.trim(),
              nearest_landmark: nearestLandmark.trim(),
              category: role === 'provider' ? category.trim() : null,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          if (signUpData.session) {
            toast({ title: t.accountCreatedSuccessfully });
            router.refresh();
            router.replace("/dashboard");
          } else {
            toast({
              title: "Check your email",
              description: "We sent you a confirmation link. Confirm to finish signing up.",
            });
          }
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

              {locationComplete && !editingLocation ? (
                <div className="space-y-3 mt-4 rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          {locationAutoFetched ? "Location detected" : "Location set"}
                        </div>
                        <p className="text-xs text-foreground/70 truncate" title={nearestLandmark}>
                          {nearestLandmark}
                        </p>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {[district, city, province].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLocation(true)}
                        className="h-7 px-2 text-xs text-foreground/70 hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleLocate}
                        disabled={locating}
                        className="h-7 px-2 text-xs text-accent hover:text-accent"
                      >
                        {locating ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        Redetect
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
              <div
                className={cn(
                  "space-y-4 border-t border-border pt-4 rounded-xl p-4 transition-colors animate-in fade-in slide-in-from-top-2",
                  locationComplete
                    ? "bg-emerald-500/5 border border-emerald-500/30"
                    : "bg-destructive/5 border border-destructive/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t.locationSetup}
                    <span className="text-destructive" aria-hidden>
                      *
                    </span>
                  </Label>
                  <div className="flex items-center gap-1">
                    {locationComplete && editingLocation && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingLocation(false)}
                        className="h-8 text-xs text-foreground/70"
                      >
                        Done
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLocate}
                      disabled={locating}
                      className="h-8 text-xs border-accent/50 text-accent hover:bg-accent/10"
                    >
                      {locating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-1" />
                      )}
                      {t.onboardingLocation}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {locationComplete ? (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      All location fields completed.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      All four fields below are required.
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">
                      Province <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={province}
                      onValueChange={(v) => {
                        setProvince(v);
                        setCity("");
                        setCitySearch("");
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "bg-muted h-10",
                          !province && !isLogin ? "border-destructive/60" : "border-border",
                        )}
                      >
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
                    <Label className="text-xs text-foreground/60">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Select value={city} onValueChange={setCity} disabled={!province}>
                      <SelectTrigger
                        className={cn(
                          "bg-muted h-10",
                          !city && !isLogin ? "border-destructive/60" : "border-border",
                        )}
                      >
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
                    <Label className="text-xs text-foreground/60">
                      District / Area <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Gulberg, Sector F-6"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className={cn(
                        "bg-muted h-10",
                        !district.trim() && !isLogin ? "border-destructive/60" : "border-border",
                      )}
                      required={!isLogin}
                      aria-invalid={!isLogin && !district.trim()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-foreground/60">
                      Nearest Landmark <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Near Metro Station"
                      value={nearestLandmark}
                      onChange={(e) => setNearestLandmark(e.target.value)}
                      className={cn(
                        "bg-muted h-10",
                        !nearestLandmark.trim() && !isLogin ? "border-destructive/60" : "border-border",
                      )}
                      required={!isLogin}
                      aria-invalid={!isLogin && !nearestLandmark.trim()}
                    />
                  </div>
                </div>
              </div>
              )}

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
        <CardFooter className="flex flex-col items-stretch gap-2">
          {!isLogin && missingSignupFields.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Still needs: <span className="text-destructive font-medium">{missingSignupFields.join(", ")}</span>
            </p>
          )}
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              isLogin ? t.logIn : t.createAccount
            )}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
