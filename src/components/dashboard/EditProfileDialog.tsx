"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Settings, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function EditProfileDialog() {
  const { user } = useAppContext();
  const [open, setOpen] = useState(false);
  
  // Profile State
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  
  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name);
      setPhone(user.phone);
      if (user.role === 'provider') fetchProviderDetails();
    }
  }, [open, user]);

  const fetchProviderDetails = async () => {
    const { data } = await supabase.from('provider_details').select('category').eq('provider_id', user!.id).maybeSingle();
    if (data) setCategory(data.category || "");
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone !== user.phone) {
        const { data: existingPhone } = await supabase.from('profiles').select('phone').eq('phone', cleanPhone).neq('id', user.id).maybeSingle();
        if (existingPhone) throw new Error("Phone number already in use.");
      }

      await supabase.from('profiles').update({ full_name: fullName, phone: cleanPhone }).eq('id', user.id);

      if (user.role === 'provider' && category) {
        await supabase.from('provider_details').update({ category }).eq('provider_id', user.id);
      }

      toast({ title: "Profile updated successfully!" });
      window.location.reload(); 
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      toast({ title: "Password updated securely!" });
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-transparent hover:bg-muted text-foreground">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Account Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              {user?.role === 'provider' && (
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full font-bold mt-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Profile
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="security">
            <form onSubmit={handlePasswordUpdate} className="space-y-4 mt-4">
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
                  />
                </div>
              </div>
              <Button type="submit" disabled={passwordLoading} className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90">
                {passwordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Update Password
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}