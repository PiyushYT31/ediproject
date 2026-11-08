import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
}

interface LocationContextType {
  location: UserLocation;
  isLocating: boolean;
  locationError: string | null;
  detectLocation: () => Promise<void>;
  setLocation: (newLoc: Partial<UserLocation>) => void;
}

// Default location: Pune, Maharashtra (Core WorkSphere Regional Hub)
const DEFAULT_LOCATION: UserLocation = {
  latitude: 18.5204,
  longitude: 73.8567,
  city: "Pune",
  state: "Maharashtra",
  address: "FC Road, Shivaji Nagar, Pune, Maharashtra",
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation>(() => {
    const saved = localStorage.getItem("worksphere_user_location");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fall back to default
      }
    }
    return DEFAULT_LOCATION;
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const setLocation = (newLoc: Partial<UserLocation>) => {
    setLocationState((prev) => {
      const updated = { ...prev, ...newLoc };
      localStorage.setItem("worksphere_user_location", JSON.stringify(updated));
      return updated;
    });
  };

  const detectLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocode via OpenStreetMap Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.suburb ||
              "Unknown City";
            const state = data.address?.state || "Unknown State";
            const address = data.display_name || `${city}, ${state}`;

            const newLocation: UserLocation = {
              latitude,
              longitude,
              city,
              state,
              address,
            };

            setLocationState(newLocation);
            localStorage.setItem("worksphere_user_location", JSON.stringify(newLocation));
          } catch (e) {
            // If reverse geocode fails, still save coordinates
            setLocationState((prev) => ({
              ...prev,
              latitude,
              longitude,
            }));
          } finally {
            setIsLocating(false);
            resolve();
          }
        },
        (err) => {
          console.warn("Geolocation detection denied or unavailable:", err.message);
          setLocationError(err.message);
          setIsLocating(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  // Attempt auto-detection once if not saved in local storage
  useEffect(() => {
    const saved = localStorage.getItem("worksphere_user_location");
    if (!saved) {
      detectLocation();
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLocating,
        locationError,
        detectLocation,
        setLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

