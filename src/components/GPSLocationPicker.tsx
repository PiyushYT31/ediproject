import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { cn } from '../lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GPSLocationPickerProps {
  onLocationFound: (location: { lat: number, lng: number, address: string, state: string, city: string }) => void;
  onFallback: () => void;
}

export default function GPSLocationPicker({ onLocationFound, onFallback }: GPSLocationPickerProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [addressInfo, setAddressInfo] = useState<{ address: string, city: string, state: string } | null>(null);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();

      const city = data.address.city || data.address.town || data.address.village || data.address.county || "Unknown City";
      const state = data.address.state || "Unknown State";

      setAddressInfo({
        address: data.display_name,
        city,
        state
      });

      return { address: data.display_name, city, state };
    } catch (err) {
      console.error("Reverse geocoding failed", err);
      return { address: "Unknown Address", city: "Unknown City", state: "Unknown State" };
    }
  };

  const handleDetectLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });

        const addrInfo = await fetchAddress(latitude, longitude);
        setLoading(false);
        onLocationFound({
          lat: latitude,
          lng: longitude,
          address: addrInfo.address,
          state: addrInfo.state,
          city: addrInfo.city
        });
      },
      (err) => {
        setError("Could not get your location. Please ensure location permissions are granted.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        setLoading(true);
        fetchAddress(e.latlng.lat, e.latlng.lng).then(addrInfo => {
          setLoading(false);
          onLocationFound({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            address: addrInfo.address,
            state: addrInfo.state,
            city: addrInfo.city
          });
        });
      },
    });

    return position === null ? null : (
      <Marker position={position} />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleDetectLocation}
          disabled={loading}
          className="flex-1 w-full py-4 bg-[#141414]/5 hover:bg-[#141414]/10 text-[#141414] rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-[#141414] border-t-transparent rounded-full" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          Detect Current Location
        </button>
        <button
          onClick={onFallback}
          className="w-full sm:w-auto px-6 py-4 border border-[#141414]/10 rounded-xl font-bold text-[#141414]/60 hover:text-[#141414] hover:border-[#141414]/30 transition-all text-sm"
        >
          Enter Manually
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {position && (
        <div className="space-y-3">
          <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-[#141414]/10 relative z-0">
            <MapContainer
              center={position}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
          </div>

          {addressInfo && (
            <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-900">{addressInfo.city}, {addressInfo.state}</p>
                <p className="text-xs text-green-700 mt-1 line-clamp-2">{addressInfo.address}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
