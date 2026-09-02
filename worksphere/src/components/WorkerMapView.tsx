import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { WorkerProfile } from "../types";

// Fix Leaflet icon in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  workers: WorkerProfile[];
  center?: [number, number];
}

export default function WorkerMapView({ workers, center = [20.5937, 78.9629] }: Props) {
  // Only include workers with real GPS coordinates (not 0,0)
  const mappableWorkers = workers.filter(
    (w) => w.location?.latitude && w.location?.longitude &&
           !(w.location.latitude === 0 && w.location.longitude === 0)
  );

  // Compute best center: average of worker positions if available
  const mapCenter: [number, number] =
    mappableWorkers.length > 0
      ? [
          mappableWorkers.reduce((sum, w) => sum + (w.location?.latitude ?? 0), 0) / mappableWorkers.length,
          mappableWorkers.reduce((sum, w) => sum + (w.location?.longitude ?? 0), 0) / mappableWorkers.length,
        ]
      : center;

  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[400px] rounded-3xl overflow-hidden border border-[#141414]/10 shadow-sm relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={mappableWorkers.length > 0 ? 6 : 5}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappableWorkers.map((worker) => (
          <Marker
            key={worker.uid}
            position={[worker.location!.latitude, worker.location!.longitude]}
          >
            <Popup>
              <div style={{ minWidth: 120 }}>
                <p style={{ fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.3 }}>
                  {worker.displayName}
                </p>
                <p style={{ fontWeight: 600, fontSize: 12, margin: "4px 0 0", color: "#555" }}>
                  {worker.profession || worker.category}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-md border border-[#141414]/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#141414]/50">
          {mappableWorkers.length} workers on map
        </p>
      </div>
    </div>
  );
}
