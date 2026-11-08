import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, ChevronLeft, User, Phone, Mail, MapPin, Home, Hash,
  CheckCircle2, Loader2, AlertCircle, Navigation, Save
} from "lucide-react";
import { auth, db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/utils";
import { INDIAN_STATES } from "../data/indianGeography";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import SeedDataButton from "./SeedDataButton";

// Fix Leaflet default icon in React/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  onClose: () => void;
  userProfile: any;
}

interface LocationPin {
  lat: number;
  lng: number;
}

function MapClickHandler({
  onPin,
}: {
  onPin: (latlng: LocationPin) => void;
}) {
  useMapEvents({
    click(e) {
      onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function AccountSettings({ onClose, userProfile }: Props) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [mapPin, setMapPin] = useState<LocationPin | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // India center

  const [form, setForm] = useState({
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    email: "",
  });

  // Pre-fill from userProfile
  useEffect(() => {
    if (userProfile) {
      setForm({
        phone: userProfile.phoneNumber || "",
        address: userProfile.location?.address || userProfile.address || "",
        state: userProfile.location?.state || userProfile.state || "",
        city: userProfile.location?.city || userProfile.city || "",
        pincode: userProfile.pincode || "",
        email: userProfile.email || auth.currentUser?.email || "",
      });
      if (userProfile.location?.latitude && userProfile.location?.longitude) {
        const lat = userProfile.location.latitude;
        const lng = userProfile.location.longitude;
        setMapPin({ lat, lng });
        setMapCenter([lat, lng]);
      }
    }
  }, [userProfile]);

  const availableCities =
    INDIAN_STATES.find((s) => s.name === form.state)?.cities || [];

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((f) => ({ ...f, state: e.target.value, city: "" }));
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (saved) setSaved(false);
    if (error) setError("");
  };

  // Reverse geocode a lat/lng using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        "";
      const state = data.address?.state || "";
      const pincode = data.address?.postcode || "";
      const address = data.display_name || "";
      return { city, state, pincode, address };
    } catch {
      return { city: "", state: "", pincode: "", address: "" };
    }
  };

  // Handle map pin drop
  const handleMapPin = async (latlng: LocationPin) => {
    setMapPin(latlng);
    setMapCenter([latlng.lat, latlng.lng]);
    const geo = await reverseGeocode(latlng.lat, latlng.lng);
    setForm((f) => ({
      ...f,
      address: geo.address || f.address,
      city: geo.city || f.city,
      state: geo.state || f.state,
      pincode: geo.pincode || f.pincode,
    }));
  };

  // Detect via browser GPS
  const handleDetectGPS = () => {
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapPin({ lat: latitude, lng: longitude });
        setMapCenter([latitude, longitude]);
        const geo = await reverseGeocode(latitude, longitude);
        setForm((f) => ({
          ...f,
          address: geo.address || f.address,
          city: geo.city || f.city,
          state: geo.state || f.state,
          pincode: geo.pincode || f.pincode,
        }));
        setGpsLoading(false);
      },
      () => {
        setGpsError("Could not get your location. Please allow location access.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setError("");
    try {
      const updateData: any = {
        phoneNumber: form.phone,
        pincode: form.pincode,
        location: {
          address: form.address,
          state: form.state,
          city: form.city,
          latitude: mapPin?.lat ?? 0,
          longitude: mapPin?.lng ?? 0,
        },
      };
      await updateDoc(doc(db, "users", auth.currentUser.uid), updateData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-[#F5F5F0] overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-[#141414]/10 px-5 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#141414]/5 hover:bg-[#141414]/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold tracking-tight">Account Settings</h1>
          <p className="text-xs text-[#141414]/40 font-medium">Edit your personal details</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#141414] text-white rounded-xl font-bold text-sm hover:bg-[#141414]/90 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save"}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-5 space-y-6 pb-24">

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Banner */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-bold"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              Profile updated successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Personal Info ───────────────────────────── */}
        <section className="space-y-4">
          <SectionLabel icon={<User className="w-4 h-4" />} title="Personal Information" />

          {/* Name — READ ONLY */}
          <FieldGroup label="Full Name" hint="Name cannot be changed">
            <div className="w-full px-4 py-4 bg-[#141414]/5 border border-[#141414]/5 rounded-xl font-bold text-sm text-[#141414]/50 cursor-not-allowed select-none">
              {userProfile?.displayName || auth.currentUser?.displayName || "—"}
            </div>
          </FieldGroup>

          {/* Email — READ ONLY */}
          <FieldGroup label="Email Address" hint="Email cannot be changed">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/25" />
              <div className="w-full pl-11 pr-4 py-4 bg-[#141414]/5 border border-[#141414]/5 rounded-xl font-medium text-sm text-[#141414]/50 cursor-not-allowed">
                {form.email || "—"}
              </div>
            </div>
          </FieldGroup>

          {/* Phone */}
          <FieldGroup label="Phone Number">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/30" />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full pl-11 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
              />
            </div>
          </FieldGroup>
        </section>

        {/* ── Location ────────────────────────────────── */}
        <section className="space-y-4">
          <SectionLabel icon={<MapPin className="w-4 h-4" />} title="Location" />

          {/* OpenStreetMap */}
          <div className="bg-white rounded-2xl border border-[#141414]/10 overflow-hidden shadow-sm">
            {/* Map controls bar */}
            <div className="px-4 py-3 border-b border-[#141414]/5 flex items-center justify-between">
              <p className="text-xs font-bold text-[#141414]/50 uppercase tracking-widest">
                Pick Location on Map
              </p>
              <button
                onClick={handleDetectGPS}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] text-white rounded-lg text-xs font-bold hover:bg-[#141414]/80 transition-all disabled:opacity-50"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                {gpsLoading ? "Detecting…" : "Use GPS"}
              </button>
            </div>

            {/* Map */}
            <div className="h-[260px] w-full relative z-0">
              <MapContainer
                center={mapCenter}
                zoom={mapPin ? 14 : 5}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
                key={mapCenter.join(",")}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onPin={handleMapPin} />
                {mapPin && <Marker position={[mapPin.lat, mapPin.lng]} />}
              </MapContainer>
            </div>

            <div className="px-4 py-2.5 bg-[#141414]/3">
              <p className="text-[10px] font-medium text-[#141414]/40">
                📍 Tap anywhere on the map to set your location, or use GPS to auto-detect.
              </p>
            </div>
          </div>

          {/* GPS Error */}
          <AnimatePresence>
            {gpsError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {gpsError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Address text */}
          <FieldGroup label="Street / Area Address">
            <div className="relative">
              <Home className="absolute left-4 top-4 w-4 h-4 text-[#141414]/30" />
              <textarea
                placeholder="Enter your street address or area"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                rows={2}
                className="w-full pl-11 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm resize-none"
              />
            </div>
          </FieldGroup>

          {/* State + City */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="State">
              <select
                value={form.state}
                onChange={handleStateChange}
                className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="City">
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                disabled={!form.state}
                className="w-full px-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm disabled:opacity-40"
              >
                <option value="">Select City</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldGroup>
          </div>

          {/* Pincode */}
          <FieldGroup label="Pincode">
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#141414]/30" />
              <input
                type="text"
                placeholder="6-digit pincode"
                value={form.pincode}
                onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full pl-11 pr-4 py-4 bg-white border border-[#141414]/10 rounded-xl focus:outline-none focus:border-[#141414] transition-all font-medium text-sm"
              />
            </div>
          </FieldGroup>
        </section>

        {/* Demo Data / Seeding */}
        <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Developer / Demo Tools</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Populate Firestore with sample verified workers, artisans, products, and hardware vendors.
            </p>
          </div>
          <SeedDataButton />
        </section>

        {/* Bottom Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold text-base hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-[#141414]/20 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving changes…" : saved ? "All changes saved!" : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Helper sub-components ──────────────────────────────

function SectionLabel({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="w-6 h-6 rounded-lg bg-[#141414] text-white flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-xs font-black uppercase tracking-widest text-[#141414]/50">
        {title}
      </h2>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-[#141414]/30 font-medium italic">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
