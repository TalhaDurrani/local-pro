"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/context/AppContext";
import useLocation from "@/hooks/useLocation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, Phone, Loader2, Star, UserCircle, Send, Search, FilterX } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PAKISTAN_DATA } from "@/lib/pakistan-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ProviderDetails {
  category: string | null;
  average_rating: number | null;
  services_delivered: number | null;
}

interface Provider {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  district?: string | null;
  provider_details?: ProviderDetails[] | ProviderDetails | null;
  distance_meters?: number | null;
}

const CATEGORIES = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Cleaner",
  "Painter",
  "AC Technician",
  "Mechanic",
  "Gardener",
  "Home Maintenance",
];

export default function SeekerFeed() {
  const { user, location, setLocation } = useAppContext();
  const { fetchLocation } = useLocation();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [activeRequestProviderIds, setActiveRequestProviderIds] = useState<Set<string>>(new Set());
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    if (user?.city) setCityFilter(user.city);
  }, [user?.city]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const allCities = useMemo(() => PAKISTAN_DATA.flatMap((p) => p.cities).sort(), []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const hasCoords = !!(location?.lat && location?.lng);

        if (hasCoords && cityFilter === "all") {
          const { data, error } = await supabase.rpc("nearby_providers", {
            p_lat: location!.lat,
            p_lng: location!.lng,
            p_category: categoryFilter === "all" ? null : categoryFilter,
            p_radius_km: 50,
          });

          if (error) throw error;

          let rows = (data as any[]).map((r) => ({
            id: r.id,
            full_name: r.full_name,
            phone: r.phone,
            city: r.city,
            district: r.district,
            provider_details: [
              {
                category: r.category,
                average_rating: r.average_rating,
                services_delivered: r.services_delivered,
              },
            ],
            distance_meters: r.distance_meters,
          })) as Provider[];

          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            rows = rows.filter((p) => p.full_name.toLowerCase().includes(q));
          }

          if (!cancelled) setProviders(rows);
          return;
        }

        const joinOp = categoryFilter !== "all" ? "!inner" : "";
        const selectString = `
          id, full_name, phone, city, district,
          provider_details${joinOp} ( category, average_rating, services_delivered )
        `;

        let query = supabase
          .from("profiles")
          .select(selectString)
          .eq("role", "provider")
          .eq("is_banned", false);

        if (cityFilter !== "all") query = query.eq("city", cityFilter);
        if (categoryFilter !== "all") query = query.eq("provider_details.category", categoryFilter);
        if (debouncedSearch) query = query.ilike("full_name", `%${debouncedSearch}%`);

        const { data, error } = await query;
        if (error) throw error;

        const filtered = (data as any[]).filter((p) => {
          const details = p.provider_details;
          if (!details) return false;
          return Array.isArray(details) ? details.length > 0 : !!details;
        }) as Provider[];

        if (!cancelled) setProviders(filtered);
      } catch (error) {
        console.error("Error fetching providers:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [categoryFilter, cityFilter, debouncedSearch, location?.lat, location?.lng]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const fetchActive = async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("provider_id")
        .eq("seeker_id", user.id)
        .in("status", ["pending", "accepted"]);
      if (error || cancelled) return;
      const ids = new Set<string>((data as { provider_id: string }[]).map((r) => r.provider_id));
      setActiveRequestProviderIds(ids);
    };
    fetchActive();

    const channel = supabase
      .channel(`seeker-active-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_requests", filter: `seeker_id=eq.${user.id}` },
        () => fetchActive(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [user?.id]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setCityFilter("all");
    setSearchQuery("");
  };

  const handleRequestService = async (providerId: string, providerName: string) => {
    if (!user) return;

    if (activeRequestProviderIds.has(providerId)) {
      toast({ title: "Request already active", description: `You already have a live request with ${providerName}.` });
      return;
    }

    let currentLocation = location;
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      setLocationMessage("Precision location required to request service. Detecting...");
      try {
        const result = await fetchLocation();
        const newLocation = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
          address: result.displayAddress,
        };
        setLocation(newLocation);
        currentLocation = newLocation;
        setLocationMessage(null);
      } catch (error: any) {
        setLocationMessage("Please allow location access to request this service.");
        return;
      }
    }

    setRequestingId(providerId);
    try {
      const { error } = await supabase.from("service_requests").insert({
        seeker_id: user.id,
        provider_id: providerId,
        status: "pending",
        seeker_lat: currentLocation.lat ?? null,
        seeker_lng: currentLocation.lng ?? null,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-headline font-bold text-foreground">Nearby Professionals</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-accent flex items-center gap-2"
          >
            <FilterX className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="md:col-span-2 relative">
    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search by name..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10 bg-muted/50 border-border"
    />
  </div>

  {/* Category Searchable Dropdown */}
  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={categoryOpen}
        className="justify-between bg-muted/50 border-border w-full"
      >
        {categoryFilter === "all" ? "All Categories" : categoryFilter}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
      <Command>
        <CommandInput placeholder="Search category..." />
        <CommandEmpty>No category found.</CommandEmpty>

        <CommandGroup className="max-h-64 overflow-y-auto">
          <CommandItem
            value="all"
            onSelect={() => {
              setCategoryFilter("all");
              setCategoryOpen(false);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                categoryFilter === "all" ? "opacity-100" : "opacity-0"
              )}
            />
            All Categories
          </CommandItem>

          {CATEGORIES.map((cat) => (
            <CommandItem
              key={cat}
              value={cat}
              onSelect={() => {
                setCategoryFilter(cat);
                setCategoryOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  categoryFilter === cat ? "opacity-100" : "opacity-0"
                )}
              />
              {cat}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>

  {/* City Searchable Dropdown */}
  <Popover open={cityOpen} onOpenChange={setCityOpen}>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={cityOpen}
        className="justify-between bg-muted/50 border-border w-full"
      >
        {cityFilter === "all" ? "All Cities" : cityFilter}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>

    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
      <Command>
        <CommandInput placeholder="Search city..." />
        <CommandEmpty>No city found.</CommandEmpty>

        <CommandGroup className="max-h-64 overflow-y-auto">
          <CommandItem
            value="all"
            onSelect={() => {
              setCityFilter("all");
              setCityOpen(false);
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                cityFilter === "all" ? "opacity-100" : "opacity-0"
              )}
            />
            All Cities
          </CommandItem>

          {allCities.map((city) => (
            <CommandItem
              key={city}
              value={city}
              onSelect={() => {
                setCityFilter(city);
                setCityOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  cityFilter === city ? "opacity-100" : "opacity-0"
                )}
              />
              {city}
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</div>
      </div>

      {locationMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {locationMessage}{" "}
          <a href="/onboarding" className="font-semibold text-destructive underline">
            Set location
          </a>
        </div>
      )}

      {loading ? (
        <Card className="shadow-lg flex items-center justify-center p-20 border-muted">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </Card>
      ) : providers.length === 0 ? (
        <Card className="shadow-lg flex flex-col items-center justify-center p-20 text-center border-dashed border-muted-foreground/30">
          <UserCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-headline font-bold mb-2">No Providers Found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            We couldn&apos;t find any active service providers matching your current filters. Try adjusting your
            category or city!
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Reset All Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {providers.map((provider) => {
            const details = Array.isArray(provider.provider_details)
              ? provider.provider_details[0]
              : provider.provider_details;
            const rating = Number(details?.average_rating ?? 0);
            const delivered = Number(details?.services_delivered ?? 0);
            const hasActiveRequest = activeRequestProviderIds.has(provider.id);

            return (
              <Card key={provider.id} className="shadow-lg hover:border-accent/50 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg font-bold truncate">{provider.full_name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 font-medium">
                        <Briefcase className="h-3.5 w-3.5" />
                        {details?.category || "General Service"}
                      </div>
                    </div>
                    {delivered > 0 ? (
                      <div className="flex items-center bg-amber-100 px-2 py-1 rounded-md text-xs font-bold text-amber-700 shrink-0">
                        <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                        {rating.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                        New
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {[provider.city, provider.district].filter(Boolean).join(", ") || "Unknown Location"}
                    </span>
                    {provider.distance_meters != null ? (
                      <span className="text-xs font-medium text-accent">
                        {(provider.distance_meters / 1000).toFixed(1)} km
                      </span>
                    ) : delivered > 0 ? (
                      <span className="text-xs text-muted-foreground">{delivered} jobs</span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button asChild variant="outline" className="w-full font-bold border-accent/30 text-accent hover:bg-accent/10">
                      <a href={`tel:${provider.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call {provider.phone}
                      </a>
                    </Button>

                    <Button
                      onClick={() => handleRequestService(provider.id, provider.full_name)}
                      disabled={requestingId === provider.id || hasActiveRequest}
                      className="w-full font-bold"
                    >
                      {requestingId === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasActiveRequest ? (
                        "Request Active"
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
      )}
    </div>
  );
}
