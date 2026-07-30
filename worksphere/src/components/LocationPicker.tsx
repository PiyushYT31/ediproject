import React, { useState, useEffect } from 'react';
import { INDIAN_STATES } from '../data/indianGeography';
import { useI18n } from '../lib/i18n';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  onLocationChange: (state: string, city: string) => void;
  initialState?: string;
  initialCity?: string;
}

export default function LocationPicker({ onLocationChange, initialState, initialCity }: LocationPickerProps) {
  const { t } = useI18n();
  const [selectedState, setSelectedState] = useState(initialState || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');

  const availableCities = INDIAN_STATES.find(s => s.name === selectedState)?.cities || [];

  useEffect(() => {
    if (selectedState && selectedCity) {
      onLocationChange(selectedState, selectedCity);
    }
  }, [selectedState, selectedCity, onLocationChange]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity(''); // Reset city when state changes
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-[#141414]/60 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t('selectState')}
        </label>
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
