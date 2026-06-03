"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Phone, Loader2, Star, UserCircle } from "lucide-react";

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
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveProviders = async () => {
      try {
        // 1. Fetch all completed transactions to know who is active
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('sender_id')
          .eq('status', 'completed');

        if (txError) throw txError;

        const activeProviderIds = [...new Set((txData || []).map(tx => tx.sender_id))];

        if (activeProviderIds.length === 0) {
          setProviders([]);
          setLoading(false);
          return;
        }

        // 2. Fetch profiles AND their provider_details for ONLY active providers
        const { data: providerProfiles, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id, full_name, phone, city,
            provider_details ( category, hourly_rate )
          `)
          .in('id', activeProviderIds)
          .eq('role', 'provider');

        if (profileError) throw profileError;

        setProviders(providerProfiles as Provider[]);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProviders();
  }, []);

  if (loading) {
    return (
      <Card className="glass border-white/10 shadow-xl h-full flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-pro-sage" />
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="glass border-white/10 shadow-xl h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-white/20">
        <UserCircle className="h-16 w-16 text-white/20 mb-4" />
        <h3 className="text-xl font-headline font-bold text-white mb-2">No Providers Available</h3>
        <p className="text-white/50 max-w-sm">
          There are currently no active service providers in your area. Please check back later!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold text-pro-sage mb-6">Nearby Professionals</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map((provider) => {
          // Safely extract category and rate
          const details = provider.provider_details?.[0];
          
          return (
            <Card key={provider.id} className="glass border-white/10 shadow-lg hover:border-pro-sage/30 transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-white font-bold">{provider.full_name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-pro-sage mt-1 font-medium">
                      <Briefcase className="h-3.5 w-3.5" />
                      {details?.category || "General Service"}
                    </div>
                  </div>
                  <div className="flex items-center bg-white/5 px-2 py-1 rounded-md text-xs font-bold text-amber-400">
                    <Star className="h-3 w-3 mr-1 fill-amber-400" /> 5.0
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-white/40" />
                    {provider.city || "Unknown Location"}
                  </span>
                  <span className="font-bold text-white">
                    Rs. {details?.hourly_rate || 0} <span className="text-white/40 text-xs font-normal">/ hr</span>
                  </span>
                </div>
                
                <Button className="w-full bg-pro-sage text-pro-slate hover:bg-pro-sage/90 font-bold">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Provider
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}