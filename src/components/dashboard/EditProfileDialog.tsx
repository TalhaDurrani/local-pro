"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, MapPin, AlertTriangle } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProfileDialog({ open, onOpenChange }: Props) {
  const { user, refreshProfile, logout } = useAppContext();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [nearestLandmark, setNearestLandmark] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const { fetchLocation, loading: locating } = useLocation();

  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [confirmText, setConfirmText] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.full_name);
    setPhone(user.phone);
    setProvince(user.province || "");
    setCity(user.city || "");
    setDistrict(user.district || "");
    setNearestLandmark(user.nearest_landmark || "");
    setConfirmText("");
    setConfirmPwd("");
    if (user.role === "provider") {
      supabase
        .from("provider_details")
        .select("category")
        .eq("provider_id", user.id)
        .maybeSingle()
        .then(({ data }) => setCategory((data?.category as string) || ""));
    }
  }, [open, user]);

  const handleLocate = async () => {
    try {
      const result = await fetchLocation();
      const matched = PAKISTAN_DATA.find(
        (p) =>
          result.province?.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(result.province?.toLowerCase() || ""),
      );
      if (matched) {
        setProvince(matched.name);
        const mc = matched.cities.find(
          (c) =>
            result.city?.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(result.city?.toLowerCase() || ""),
        );
        if (mc) setCity(mc);
      } else {
        setProvince(result.province || "");
        setCity(result.city || "");
      }
      setDistrict(result.area || "");
      setNearestLandmark(result.displayAddress || "");
      toast({ title: "Location detected" });
    } catch (err: any) {
      toast({
        title: "Location error",
        description: err.message || "Unable to detect location.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const update: Record<string, unknown> = {
        full_name: fullName,
        phone: cleanPhone,
        province,
        city,
        district,
        nearest_landmark: nearestLandmark,
      };
      const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
      if (error) throw error;

      if (user.role === "provider" && category) {
        await supabase.from("provider_details").update({ category }).eq("provider_id", user.id);
      }
      await refreshProfile();
      toast({ title: "Profile updated" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Min 6 characters.", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated" });
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (confirmText.trim() !== user.full_name.trim()) {
      toast({
        title: "Confirmation mismatch",
        description: "Type your full name exactly to confirm.",
        variant: "destructive",
      });
      return;
    }
    setDeleting(true);
    try {
      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: confirmPwd,
      });
      if (reAuthErr) throw new Error("Password is incorrect.");

      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unable to delete account.");
      }
      await logout();
      onOpenChange(false);
      router.replace("/?deleted=1");
    } catch (error: any) {
      toast({ title: "Could not delete account", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Account Settings</DialogTitle>
          <DialogDescription>Manage your profile, password, and account.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2 flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 shrink-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">
              Danger Zone
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto pr-1 mt-4 flex-1">
            <TabsContent value="profile">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold">Location</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleLocate}
                      disabled={locating}
                      className="h-8 text-xs"
                    >
                      {locating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MapPin className="h-3 w-3 mr-1" />
                      )}
                      Use Current
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Province</Label>
                      <Select
                        value={province}
                        onValueChange={(v) => {
                          setProvince(v);
                          setCity("");
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Province" />
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
                      <Label className="text-xs">City</Label>
                      <Select value={city} onValueChange={setCity} disabled={!province}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="px-2 pb-2 pt-1">
                            <Input
                              placeholder="Search..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="max-h-[150px] overflow-y-auto">
                            {PAKISTAN_DATA.find((p) => p.name === province)
                              ?.cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
                              .map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">District / Area</Label>
                    <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nearest Landmark</Label>
                    <Input
                      value={nearestLandmark}
                      onChange={(e) => setNearestLandmark(e.target.value)}
                    />
                  </div>
                </div>

                {user?.role === "provider" && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label>Service Category</Label>
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full font-bold mt-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="security">
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update Password
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="danger">
              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-bold text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Delete account
                  </div>
                  <p className="text-foreground/70">
                    This permanently deletes your profile and all related data (requests, reviews,
                    transactions). This cannot be undone.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">
                    Type your full name (<strong>{user?.full_name}</strong>) to confirm
                  </Label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={user?.full_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Confirm with your password</Label>
                  <Input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="destructive" className="w-full font-bold" disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Permanently delete my account
                </Button>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
