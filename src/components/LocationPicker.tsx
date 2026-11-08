import React, { useState, useEffect, useRef } from 'react';
import { INDIAN_STATES } from '../data/indianGeography';
import { useI18n } from '../lib/i18n';
import { MapPin } from 'lucide-react';
import GPSLocationPicker from './GPSLocationPicker';

export interface LocationData {
  state: string;
  city: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface LocationPickerProps {
  onLocationChange: (data: LocationData | string, city?: string) => void;
  initialState?: string;
  initialCity?: string;
}

// Approximate city coordinates for major Indian cities to provide realistic GPS coordinates when entered manually
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Thane: { lat: 19.2183, lng: 72.9781 },
  Nashik: { lat: 19.9975, lng: 73.7898 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Kanpur: { lat: 26.4499, lng: 80.3319 },
  "New Delhi": { lat: 28.6139, lng: 77.2090 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
};

export default function LocationPicker({ onLocationChange, initialState, initialCity }: LocationPickerProps) {
  const { t } = useI18n();
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [useGPS, setUseGPS] = useState(true);

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  const availableCities = INDIAN_STATES.find(s => s.name === selectedState)?.cities || [];

  useEffect(() => {
    if (selectedState && selectedCity && !useGPS) {
      const cityCoords = CITY_COORDINATES[selectedCity] || { lat: 19.0760, lng: 72.8777 };
      const locationData: LocationData = {
        state: selectedState,
        city: selectedCity,
        latitude: cityCoords.lat,
        longitude: cityCoords.lng,
        address: `${selectedCity}, ${selectedState}`,
      };
      
      // Call with object as first param, and support legacy (state, city) signature
      onLocationChangeRef.current(locationData, selectedCity);
    }
  }, [selectedState, selectedCity, useGPS]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const handleGPSLocationFound = (loc: { lat: number, lng: number, address: string, state: string, city: string }) => {
    const locationData: LocationData = {
      state: loc.state,
      city: loc.city,
      latitude: loc.lat,
      longitude: loc.lng,
      address: loc.address,
    };
    onLocationChange(locationData, loc.city);
  };

  if (useGPS) {
    return <GPSLocationPicker onLocationFound={handleGPSLocationFound} onFallback={() => setUseGPS(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-[#141414]/60 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t('selectState')}
        </label>
        <button onClick={() => setUseGPS(true)} className="text-xs font-bold text-[#141414] underline">
          Use GPS instead
        </button>
      </div>
      
      <div className="space-y-2">
        <select
          value={selectedState}
          onChange={handleStateChange}
          className="w-full px-4 py-3 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
        >
          <option value="">-- {t('selectState')} --</option>
          {INDIAN_STATES.map((state) => (
            <option key={state.name} value={state.name}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {selectedState && (
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#141414]/60 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {t('selectCity')}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
          >
            <option value="">-- {t('selectCity')} --</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
