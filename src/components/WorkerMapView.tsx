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
  onSelectWorker?: (worker: WorkerProfile) => void;
}

export default function WorkerMapView({ workers, center = [20.5937, 78.9629], onSelectWorker }: Props) {
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
    <div className="w-full h-[calc(100vh-220px)] min-h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
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
              <div className="p-1 space-y-1.5" style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 800, fontSize: 14, margin: 0, color: "#0f172a" }}>
                  {worker.displayName}
                </p>
                <p style={{ fontWeight: 600, fontSize: 12, margin: 0, color: "#4f46e5" }}>
                  {worker.profession || worker.category}
                </p>
                {worker.basePrice ? (
                  <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: "#10b981" }}>
                    From ₹{worker.basePrice}/hr
                  </p>
                ) : null}
                {onSelectWorker && (
                  <button
                    onClick={() => onSelectWorker(worker)}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      padding: "4px 8px",
                      background: "#4f46e5",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    View & Book
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-lg border border-slate-200">
        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {mappableWorkers.length} Active Local Providers
        </p>
      </div>
    </div>
  );
}
