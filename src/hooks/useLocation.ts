import { useCallback, useState } from "react";
import { supabase } from "../lib/supabase";

type Coords = { latitude: number; longitude: number };

type ReverseResult = {
  displayAddress: string;
  city: string | null;
  area: string | null;
  province: string | null;
  coords: Coords;
  raw?: any;
};

export function useLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);
  const [isManual, setIsManual] = useState(false);

  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number): Promise<Omit<ReverseResult, "coords">> => {
      const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 422 && body?.error === "location_not_in_pk") {
          throw new Error("location_not_in_pk");
        }
        throw new Error(body?.error || "Reverse geocode failed");
      }
      const json = await res.json();
      const data = json.data;
      const address = data.address || {};

      const cityPriority = [
        "city",
        "town",
        "village",
        "municipality",
        "county",
        "state_district",
        "state",
      ];
      const areaPriority = [
        "suburb",
        "neighbourhood",
        "city_district",
        "quarter",
        "hamlet",
        "locality",
      ];
      const cityVal = cityPriority.map((k) => address[k]).find(Boolean) || null;
      const areaVal = areaPriority.map((k) => address[k]).find(Boolean) || null;
      const provinceVal = address.state || address.region || null;

      const parts: string[] = [];
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
      if (provinceVal) parts.push(provinceVal);
      if (address.country) parts.push(address.country);

      return {
        displayAddress: parts.join(", ") || data.display_name || "",
        city: cityVal,
        area: areaVal,
        province: provinceVal,
        raw: data,
      };
    },
    [],
  );

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsManual(false);

    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      setLoading(false);
      throw new Error("geolocation_unavailable");
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError("Location detection requires HTTPS or localhost.");
      setLoading(false);
      throw new Error("secure_origin_required");
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        }),
      );

      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;
      setCoords({ latitude, longitude });

      const result = await reverseGeocode(latitude, longitude);
      setDisplayAddress(result.displayAddress);
      setCity(result.city);
      setArea(result.area);
      setProvince(result.province);

      return {
        ...result,
        coords: { latitude, longitude },
      };
    } catch (e: any) {
      const message = e?.message || "Unable to determine location.";
      setError(message);
      setIsManual(true);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [reverseGeocode]);

  const setManualAddress = useCallback((addr: string) => {
    setDisplayAddress(addr || null);
    setIsManual(true);
  }, []);

  const saveToProfile = useCallback(
    async (values?: {
      displayAddress?: string | null;
      city?: string | null;
      area?: string | null;
      province?: string | null;
    }) => {
      const currentUser = await supabase.auth.getUser();
      const user = currentUser?.data?.user;
      if (!user) throw new Error("not_authenticated");
      const address = values?.displayAddress ?? displayAddress;
      if (!address) throw new Error("no_address_to_save");

      const payload: Record<string, unknown> = {
        city: values?.city ?? city ?? undefined,
        province: values?.province ?? province ?? undefined,
        district: values?.area ?? area ?? undefined,
        nearest_landmark: address,
      };

      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;
    },
    [displayAddress, city, area, province],
  );

  return {
    loading,
    error,
    coords,
    displayAddress,
    city,
    area,
    province,
    isManual,
    fetchLocation,
    setManualAddress,
    saveToProfile,
  } as const;
}

export default useLocation;
