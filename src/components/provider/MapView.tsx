"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useAppContext } from "@/context/AppContext";

const accentMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 34" fill="none">
  <path d="M12 0C7.03 0 3.5 3.52 3.5 7.57c0 5.9 7.91 13.4 7.91 13.4s7.91-7.5 7.91-13.4C20.5 3.52 16.97 0 12 0Z" fill="#4C5C2D" stroke="#fff" stroke-width="2"/>
  <circle cx="12" cy="7.57" r="3.2" fill="#fff"/>
</svg>`;

export default function MapView({ lat, lng, popupText }: { lat: number; lng: number; popupText?: string }) {
  const { theme } = useAppContext();

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: accentMarkerSvg,
        iconSize: [24, 34],
        iconAnchor: [12, 34],
        popupAnchor: [0, -34],
      }),
    []
  );

  const tileConfig = useMemo(() => {
    if (theme === "dark") {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors · &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      };
    }

    return {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    };
  }, [theme]);

  return (
    <div className="z-0 relative rounded-xl overflow-hidden border border-border">
      <MapContainer center={[lat, lng]} zoom={15} style={{ height: "250px", width: "100%", zIndex: 0 }}>
        <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} />
        <Marker position={[lat, lng]} icon={markerIcon}>
          {popupText && (
            <Popup className="leaflet-theme-popup">
              <span>{popupText}</span>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}