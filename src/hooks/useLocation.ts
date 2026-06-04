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
      const email = process.env.NEXT_PUBLIC_NOMINATIM_EMAIL || "";
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=en${
        email ? `&email=${encodeURIComponent(email)}` : ""
      }`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) {
        throw new Error("Nominatim reverse geocode failed");
      }

      const data = await res.json();
      const address = data.address || {};

      if (!address.country_code || address.country_code.toLowerCase() !== "pk") {
        throw new Error("location_not_in_pk");
      }

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
      const cityVal = cityPriority.map((key) => address[key]).find(Boolean) || null;
      const areaVal = areaPriority.map((key) => address[key]).find(Boolean) || null;
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
    []
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

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 20000,
        })
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

  const saveToProfile = useCallback(async () => {
    const currentUser = await supabase.auth.getUser();
    const user = currentUser?.data?.user;
    if (!user) throw new Error("not_authenticated");
    if (!displayAddress) throw new Error("no_address_to_save");

    const payload = {
      id: user.id,
      city: city || undefined,
      province: province || undefined,
      district: area || undefined,
      nearest_landmark: displayAddress || undefined,
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) throw error;
  }, [coords, displayAddress, city, area, isManual]);

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
