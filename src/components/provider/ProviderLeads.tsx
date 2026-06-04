"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, CheckCircle, XCircle, Navigation, Phone, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Dynamically import the map to prevent SSR crashes
const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="h-[250px] w-full bg-muted animate-pulse rounded-xl" /> });

interface ServiceRequest {
  id: string;
  status: string;
  seeker_lat: number;
  seeker_lng: number;
  created_at: string;
  profiles: {
    full_name: string;
    phone: string;
  };
}

export default function ProviderLeads() {
  const { user } = useAppContext();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id, status, seeker_lat, seeker_lng, created_at,
          profiles:seeker_id (full_name, phone)
        `)
        .eq('provider_id', user.id)
        .neq('status', 'declined') // Don't show declined
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as any);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    if (!user) return;

    const channel = supabase
      .channel(`service-requests-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_requests', filter: `provider_id=eq.${user.id}` },
        () => fetchRequests()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `provider_id=eq.${user.id}` },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    setActionId(id);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Request marked as ${newStatus}` });
      fetchRequests();
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <Card className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></Card>;
  }

  if (requests.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold mb-2">No Service Requests</h3>
        <p className="text-muted-foreground text-sm">When a user requests your service, it will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground">Incoming Jobs</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {requests.map((req) => (
          <Card key={req.id} className={`shadow-lg transition-all ${req.status === 'accepted' ? 'border-accent' : ''}`}>
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-bold">{req.profiles?.full_name || "Unknown User"}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  req.status === 'accepted' ? 'bg-accent/20 text-accent' :
                  req.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                  'bg-amber-500/20 text-amber-600'
                }`}>
                  {req.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* PENDING ACTIONS */}
              {req.status === 'pending' && (
                <div className="flex gap-3">
                  <Button 
                    onClick={() => updateStatus(req.id, 'accepted')} 
                    disabled={actionId === req.id}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Accept Job
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => updateStatus(req.id, 'declined')} 
                    disabled={actionId === req.id}
                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Decline
                  </Button>
                </div>
              )}

              {/* ACCEPTED VIEW (Map & Contact) */}
              {(req.status === 'accepted' || req.status === 'completed') && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-5 w-5 text-accent" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Customer Phone</p>
                      <a href={`tel:${req.profiles?.phone}`} className="font-bold text-foreground hover:underline">
                        {req.profiles?.phone}
                      </a>
                    </div>
                  </div>

                  {req.seeker_lat && req.seeker_lng && (
                    <div className="space-y-3">
                      <MapView lat={req.seeker_lat} lng={req.seeker_lng} popupText={req.profiles.full_name} />
                      
                      {/* NATIVE GOOGLE MAPS REDIRECT */}
                      <Button asChild variant="outline" className="w-full font-bold">
                        <a 
                          href={`http://maps.google.com/maps?daddr=${req.seeker_lat},${req.seeker_lng}&amp;ll=`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-4 w-4 mr-2 text-accent" />
                          Navigate via Google Maps
                        </a>
                      </Button>
                    </div>
                  )}

                  {req.status === 'accepted' && (
                    <Button 
                      onClick={() => updateStatus(req.id, 'completed')} 
                      disabled={actionId === req.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
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