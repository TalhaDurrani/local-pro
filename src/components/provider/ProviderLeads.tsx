"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, XCircle, Phone, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[360px] w-full bg-muted animate-pulse rounded-xl" />,
});

export default function ProviderLeads() {
  const { user } = useAppContext();
  const { items } = useServiceRequests({
    userId: user?.id,
    role: user?.role as "user" | "provider" | "superadmin" | undefined,
  });
  const [actionId, setActionId] = useState<string | null>(null);

  const visible = items.filter((r) => r.status !== "declined" && r.status !== "cancelled");

  const updateStatus = async (id: string, newStatus: "accepted" | "declined" | "completed") => {
    if (!user) return;
    setActionId(id);
    const { error } = await supabase
      .from("service_requests")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("provider_id", user.id);
    setActionId(null);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Request marked as ${newStatus}` });
  };

  if (visible.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold mb-2">No Service Requests</h3>
        <p className="text-muted-foreground text-sm">
          When a user requests your service, it will appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground">Incoming Jobs</h2>

      <div className="grid grid-cols-1 gap-6">
        {visible.map((req) => (
          <Card
            key={req.id}
            className={`shadow-lg transition-all ${req.status === "accepted" ? "border-accent" : ""}`}
          >
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">{req.seeker?.full_name || "Unknown User"}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    req.status === "accepted"
                      ? "bg-accent/20 text-accent"
                      : req.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-amber-500/20 text-amber-600"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {req.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => updateStatus(req.id, "accepted")}
                    disabled={actionId === req.id}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Accept Job
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(req.id, "declined")}
                    disabled={actionId === req.id}
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Decline
                  </Button>
                </div>
              )}

              {(req.status === "accepted" || req.status === "completed") && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Customer Phone</p>
                      {req.seeker?.phone ? (
                        <a
                          href={`tel:${req.seeker.phone}`}
                          className="font-bold text-foreground hover:underline"
                        >
                          {req.seeker.phone}
                        </a>
                      ) : (
                        <span className="text-foreground/60">Hidden</span>
                      )}
                    </div>
                  </div>

                  {req.seeker_lat && req.seeker_lng ? (
                    <MapView
                      destLat={Number(req.seeker_lat)}
                      destLng={Number(req.seeker_lng)}
                      destLabel={req.seeker?.full_name || "Client"}
                    />
                  ) : (
                    <div className="p-6 border border-dashed rounded-xl text-center bg-muted/10">
                      <MapPin className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Coordinates not provided for this job.</p>
                    </div>
                  )}

                  {req.status === "accepted" && (
                    <Button
                      onClick={() => updateStatus(req.id, "completed")}
                      disabled={actionId === req.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Mark Job as Completed
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
