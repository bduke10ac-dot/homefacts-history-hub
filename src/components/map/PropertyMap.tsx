import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix default marker icons (bundler path issue)
// @ts-expect-error - private API
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Props {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  height?: number;
}

export function PropertyMap({ latitude, longitude, address, height = 280 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || latitude == null || longitude == null) return;
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], 16);
      return;
    }
    const map = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true }).setView(
      [latitude, longitude],
      16
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker([latitude, longitude]).addTo(map);
    if (address) marker.bindPopup(address);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, address]);

  if (latitude == null || longitude == null) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border bg-muted/40 text-sm text-muted-foreground"
        style={{ height }}
      >
        Location coordinates not available for this property.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border shadow-card"
      style={{ height }}
      aria-label={`Map of ${address ?? "property location"}`}
    />
  );
}
