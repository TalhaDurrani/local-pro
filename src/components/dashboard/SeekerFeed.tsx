"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Phone, Loader2, Star, UserCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  provider_details?: {
    category: string;
    hourly_rate: number;
  }[];
}

export default function SeekerFeed() {
  const { user, location } = useAppContext();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveProviders = async () => {
      try {
        const now = new Date().toISOString();

        // Fetch providers who: 1) have an active sub, and 2) are NOT banned
        const { data: providerProfiles, error } = await supabase
          .from('profiles')
          .select(`
            id, full_name, phone, city,
            provider_details ( category, hourly_rate )
          `)
          .eq('role', 'provider')
          .eq('is_banned', false) 
          .gt('subscription_end_date', now);

        if (error) throw error;
        setProviders(providerProfiles as Provider[]);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProviders();
  }, []);

  const handleRequestService = async (providerId: string, providerName: string) => {
    if (!user) return;
    
    // We ideally want their location mapped before they request a service
    if (!location) {
      toast({ 
        title: "Location Required", 
        description: "Please update your location in your profile so the provider can find you.", 
        variant: "destructive" 
      });
      return;
    }

    setRequestingId(providerId);
    try {
      const { error } = await supabase.from('service_requests').insert({
        seeker_id: user.id,
        provider_id: providerId,
        status: 'pending',
        seeker_lat: location.lat,
        seeker_lng: location.lng
      });

      if (error) throw error;

      toast({ title: `Service request sent to ${providerName}!` });
    } catch (error: any) {
      console.error("Request Error:", error);
      toast({ title: "Failed to send request", description: error.message, variant: "destructive" });
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-lg h-full flex items-center justify-center p-12 border-muted">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="shadow-lg h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-muted-foreground/30">
        <UserCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-headline font-bold mb-2">No Providers Available</h3>
        <p className="text-muted-foreground max-w-sm">
          There are currently no active service providers in your area. Please check back later!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-foreground mb-6">Nearby Professionals</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((provider) => {
          const details = provider.provider_details?.[0];
          
          return (
            <Card key={provider.id} className="shadow-lg hover:border-accent/50 transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{provider.full_name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 font-medium">
                      <Briefcase className="h-3.5 w-3.5" />
                      {details?.category || "General Service"}
                    </div>
                  </div>
                  <div className="flex items-center bg-amber-100 px-2 py-1 rounded-md text-xs font-bold text-amber-700">
                    <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> 5.0
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {provider.city || "Unknown Location"}
                  </span>
                  <span className="font-bold text-foreground">
                    Rs. {details?.hourly_rate || 0} <span className="text-xs font-normal text-muted-foreground">/ hr</span>
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  {/* DIRECT CALL BUTTON */}
                  <Button asChild variant="outline" className="w-full font-bold border-accent/30 text-accent hover:bg-accent/10">
                    <a href={`tel:${provider.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call {provider.phone}
                    </a>
                  </Button>
                  
                  {/* REQUEST SERVICE BUTTON */}
                  <Button 
                    onClick={() => handleRequestService(provider.id, provider.full_name)}
                    disabled={requestingId === provider.id}
                    className="w-full font-bold"
                  >
                    {requestingId === provider.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Request Service
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}