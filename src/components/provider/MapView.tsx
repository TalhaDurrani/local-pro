"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { LocateFixed, Crosshair, Loader2 } from "lucide-react";

const accentSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" fill="none">
  <path d="M12 0C7.03 0 3.5 3.52 3.5 7.57c0 5.9 7.91 13.4 7.91 13.4s7.91-7.5 7.91-13.4C20.5 3.52 16.97 0 12 0Z" fill="#4C5C2D" stroke="#fff" stroke-width="2"/>
  <circle cx="12" cy="7.57" r="3.2" fill="#fff"/>
</svg>`;

const blueSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" fill="none">
  <path d="M12 0C7.03 0 3.5 3.52 3.5 7.57c0 5.9 7.91 13.4 7.91 13.4s7.91-7.5 7.91-13.4C20.5 3.52 16.97 0 12 0Z" fill="#2563eb" stroke="#fff" stroke-width="2"/>
  <circle cx="12" cy="7.57" r="3.2" fill="#fff"/>
</svg>`;

function makeIcon(svg: string) {
  return L.divIcon({
    className: "custom-marker-icon",
    html: svg,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

interface FitBoundsProps {
  points: [number, number][];
  trigger: number;
}

function FitBounds({ points, trigger }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    map.invalidateSize();
  }, [points, trigger, map]);
  return null;
}

interface Props {
  destLat: number;
  destLng: number;
  destLabel?: string;
}

export default function MapView({ destLat, destLng, destLabel }: Props) {
  const { theme } = useAppContext();
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; etaMin: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [recenterTick, setRecenterTick] = useState(0);

  const destIcon = useMemo(() => makeIcon(accentSvg), []);
  const meIcon = useMemo(() => makeIcon(blueSvg), []);

  const tileConfig = useMemo(() => {
    if (theme === "dark") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://carto.com/attributions">CARTO</a> &middot; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      };
    }
    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    };
  }, [theme]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setRouteError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    setRouteError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const my = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMe(my);
        setRecenterTick((t) => t + 1);
        await fetchRoute(my.lat, my.lng);
        setLocating(false);
      },
      (err) => {
        setRouteError(err.message || "Unable to read your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    );
  };

  const fetchRoute = async (lat: number, lng: number) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Routing service unavailable");
      const data = await res.json();
      const r = data.routes?.[0];
      if (!r) throw new Error("No route found");
      const coords = (r.geometry.coordinates as [number, number][]).map(
        ([x, y]) => [y, x] as [number, number],
      );
      setRoute(coords);
      setRouteMeta({
        distanceKm: r.distance / 1000,
        etaMin: r.duration / 60,
      });
    } catch (e: any) {
      setRouteError(e.message || "Could not compute route");
    }
  };

  const points: [number, number][] = useMemo(() => {
    const list: [number, number][] = [[destLat, destLng]];
    if (me) list.push([me.lat, me.lng]);
    return list;
  }, [destLat, destLng, me]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={[destLat, destLng]}
          zoom={14}
          style={{ height: "360px", width: "100%", zIndex: 0 }}
          scrollWheelZoom
        >
          <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
          <FitBounds points={points} trigger={recenterTick} />
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>{destLabel || "Client location"}</Popup>
          </Marker>
          {me && (
            <Marker position={[me.lat, me.lng]} icon={meIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {route && route.length > 1 && (
            <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.85 }} />
          )}
        </MapContainer>

        {routeMeta && (
          <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur rounded-lg border border-border px-3 py-2 text-xs font-medium shadow">
            <div>
              <span className="text-muted-foreground">Distance:</span>{" "}
              <span className="font-bold">{routeMeta.distanceKm.toFixed(1)} km</span>
            </div>
            <div>
              <span className="text-muted-foreground">ETA:</span>{" "}
              <span className="font-bold">{Math.round(routeMeta.etaMin)} min</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleLocate} disabled={locating}>
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
          )}
          {me ? "Refresh my location" : "Show my location & route"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRecenterTick((t) => t + 1)}>
          <Crosshair className="h-3.5 w-3.5 mr-1.5" />
          Recenter
        </Button>
      </div>

      {routeError && <p className="text-xs text-destructive">{routeError}</p>}
    </div>
  );
}
