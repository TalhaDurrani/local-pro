"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Briefcase, Star, Loader2, Wifi } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Details {
  category: string | null;
  is_online: boolean | null;
  services_delivered: number | null;
  average_rating: number | null;
}

export default function ProviderStats() {
  const { user } = useAppContext();
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("provider_details")
        .select("category, is_online, services_delivered, average_rating")
        .eq("provider_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("provider_details fetch failed:", error);
      }
      setDetails((data as Details) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggleOnline = async (next: boolean) => {
    if (!user?.id) return;
    setToggling(true);
    setDetails((d) => (d ? { ...d, is_online: next } : d));
    const { error } = await supabase
      .from("provider_details")
      .update({ is_online: next })
      .eq("provider_id", user.id);
    if (error) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
      setDetails((d) => (d ? { ...d, is_online: !next } : d));
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </Card>
    );
  }

  const rating = Number(details?.average_rating ?? 0);
  const delivered = Number(details?.services_delivered ?? 0);

  return (
    <Card className="p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="grid grid-cols-3 gap-4 md:gap-8 flex-1">
          <Stat label="Category" value={details?.category || "Not set"} icon={<Briefcase className="h-4 w-4" />} />
          <Stat
            label="Jobs done"
            value={delivered.toString()}
            icon={<Briefcase className="h-4 w-4" />}
          />
          <Stat
            label="Rating"
            value={delivered > 0 ? rating.toFixed(1) : "—"}
            icon={<Star className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center gap-3 md:border-l md:border-border md:pl-6">
          <Wifi className={`h-4 w-4 ${details?.is_online ? "text-emerald-500" : "text-muted-foreground"}`} />
          <Label htmlFor="online" className="text-sm font-medium">
            {details?.is_online ? "Online" : "Offline"}
          </Label>
          <Switch
            id="online"
            checked={!!details?.is_online}
            onCheckedChange={toggleOnline}
            disabled={toggling}
          />
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground truncate">{value}</div>
    </div>
  );
}
