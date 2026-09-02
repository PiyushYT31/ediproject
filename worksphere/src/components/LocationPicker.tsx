import React, { useState, useEffect, useRef } from 'react';
import { INDIAN_STATES } from '../data/indianGeography';
import { useI18n } from '../lib/i18n';
import { MapPin } from 'lucide-react';
import GPSLocationPicker from './GPSLocationPicker';

interface LocationPickerProps {
  onLocationChange: (state: string, city: string) => void;
  initialState?: string;
  initialCity?: string;
}

export default function LocationPicker({ onLocationChange, initialState, initialCity }: LocationPickerProps) {
  const { t } = useI18n();
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [useGPS, setUseGPS] = useState(true);

  // Keep a ref to the latest callback to avoid stale closures / infinite loops
  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  });

  const availableCities = INDIAN_STATES.find(s => s.name === selectedState)?.cities || [];

  useEffect(() => {
    if (selectedState && selectedCity && !useGPS) {
      onLocationChangeRef.current(selectedState, selectedCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCity, useGPS]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity('');
  };

  const handleGPSLocationFound = (loc: { lat: number, lng: number, address: string, state: string, city: string }) => {
    onLocationChange(loc.state, loc.city);
    // You could also pass lat/lng up if the parent wants it, but keeping it simple for now based on props
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
          className="w-full px-4 py-3 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all"
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
            className="w-full px-4 py-3 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all"
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
