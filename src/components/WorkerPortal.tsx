import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Briefcase, 
  Star, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Save, 
  Phone, 
  ShieldCheck, 
  Power, 
  Loader2,
  Calendar,
  IndianRupee
} from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { WorkerProfile } from "../types";
import { useI18n } from "../lib/i18n";
import { WORKER_CATEGORIES, DAYS_OF_WEEK } from "../constants";

export default function WorkerPortal() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;
    const fetchWorker = async () => {
      try {
        const snap = await getDoc(doc(db, "workers", currentUser.uid));
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as WorkerProfile);
        }
      } catch (e) {
        console.error("Failed to load worker profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorker();
  }, [currentUser]);

  const handleToggleOnline = async () => {
    if (!profile || !currentUser) return;
    const newOnline = !profile.isAvailable;
    setProfile({ ...profile, isAvailable: newOnline });
    try {
      await updateDoc(doc(db, "workers", currentUser.uid), {
        isAvailable: newOnline,
        isOnline: newOnline,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !currentUser) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, "workers", currentUser.uid), {
        category: profile.category,
        profession: profile.profession || profile.category,
        hourlyFee: Number(profile.hourlyFee) || 0,
        basePrice: Number(profile.hourlyFee) || Number(profile.basePrice) || 299,
        dailyCharges: Number(profile.dailyCharges) || 0,
        emergencyCharges: Number(profile.emergencyCharges) || 0,
        bio: profile.bio || profile.serviceDescription || "",
        serviceDescription: profile.serviceDescription || profile.bio || "",
        whatsappNumber: profile.whatsappNumber || "",
        availableTiming: profile.availableTiming || { from: "09:00", to: "18:00" },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `workers/${currentUser.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Loading Worker Portal...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
        <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800">Worker Profile Not Found</h3>
        <p className="text-xs text-slate-500">
          Please complete your worker registration wizard to activate your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Online/Offline Switch */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={profile.photoURL || `https://picsum.photos/seed/${profile.uid}/120`}
            alt={profile.displayName}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 bg-slate-800"
          />
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-white">
              {profile.displayName}
            </h2>
            <p className="text-xs text-indigo-400 font-semibold">
              {profile.category} • {profile.location?.city || "Local Provider"}
            </p>
          </div>
        </div>

        {/* Status Toggle */}
        <button
          onClick={handleToggleOnline}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
            profile.isAvailable !== false
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
        >
          <Power className="w-4 h-4" />
          {profile.isAvailable !== false ? "Available (Online)" : "Offline"}
        </button>
      </div>

      {/* Analytics / Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-lg font-black text-slate-900">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {(profile.rating || 5.0).toFixed(1)}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Rating
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-lg font-black text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {profile.totalJobs || 0}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Jobs
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-lg font-black text-indigo-600">
            ₹{profile.hourlyFee || profile.basePrice || 299}
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Hourly Rate
          </span>
        </div>
      </div>

      {/* Edit Service Details Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-base text-slate-900">Service Settings</h3>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
            </span>
          )}
        </div>

        {/* Primary Profession */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Primary Trade Category
          </label>
          <select
            value={profile.category}
            onChange={(e) => setProfile({ ...profile, category: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:border-indigo-500"
          >
            {WORKER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(cat) || cat}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Hourly Charge (₹)</label>
            <input
              type="number"
              min="0"
              value={profile.hourlyFee || profile.basePrice || 299}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  hourlyFee: Number(e.target.value),
                  basePrice: Number(e.target.value),
                })
              }
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Daily Charge (₹)</label>
            <input
              type="number"
              min="0"
              value={profile.dailyCharges || 0}
              onChange={(e) => setProfile({ ...profile, dailyCharges: Number(e.target.value) })}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Available From</label>
            <input
              type="time"
              value={profile.availableTiming?.from || "09:00"}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  availableTiming: {
                    ...(profile.availableTiming || { to: "18:00" }),
                    from: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Available To</label>
            <input
              type="time"
              value={profile.availableTiming?.to || "18:00"}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  availableTiming: {
                    ...(profile.availableTiming || { from: "09:00" }),
                    to: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* WhatsApp Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">WhatsApp / Call Number</label>
          <input
            type="tel"
            value={profile.whatsappNumber || ""}
            onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
            placeholder="10-digit mobile number"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Bio / Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Profile Bio & Experience</label>
          <textarea
            rows={3}
            value={profile.bio || profile.serviceDescription || ""}
            onChange={(e) =>
              setProfile({
                ...profile,
                bio: e.target.value,
                serviceDescription: e.target.value,
              })
            }
            className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

