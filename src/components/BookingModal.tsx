import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, MapPin, IndianRupee, FileText, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { WorkerProfile, JobStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { useI18n } from "../lib/i18n";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerProfile;
  onSuccess: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  worker,
  onSuccess,
}: BookingModalProps) {
  const { user } = useAuth();
  const { location } = useLocation();
  const { t } = useI18n();

  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [time, setTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState(
    location.address || `${location.city}, ${location.state}` || "Current Location"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const estimatedPrice = worker.basePrice || worker.hourlyFee || 350;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const docRef = doc(collection(db, "jobs"));

    const newJobData = {
      id: docRef.id,
      consumerId: user.uid,
      workerId: String(worker.uid || ""),
      status: JobStatus.PENDING,
      category: String(worker.category || "General"),
      description:
        description.trim() ||
        `Scheduled booking with ${worker.displayName} for ${worker.category} service on ${date} at ${time}.`,
      location: {
        latitude: location.latitude || 19.0760,
        longitude: location.longitude || 72.8777,
        address: address.trim() || location.address || "Customer Location",
        city: location.city || "Mumbai",
        state: location.state || "Maharashtra",
      },
      quotedPrice: estimatedPrice,
      scheduledDate: date,
      scheduledTime: time,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await setDoc(docRef, newJobData);
      setIsBooked(true);
      setTimeout(() => {
        setIsBooked(false);
        onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "jobs");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <img
                  src={worker.photoURL || `https://picsum.photos/seed/${worker.uid}/100`}
                  alt={worker.displayName}
                  className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Book {worker.displayName}
                  </h3>
                  <p className="text-xs text-indigo-600 font-semibold">
                    {worker.category} Specialist
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Form */}
            {isBooked ? (
              <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your request has been sent to {worker.displayName}. You can track it in the Jobs tab.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Date & Time Picker */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Service Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Service Address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/flat no, street, locality..."
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 bg-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Describe the Problem / Requirement
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Tap leaking in master bathroom, need new washer and pipe check."
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white resize-none"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Initial Base / Visit Fee
                    </span>
                    <p className="text-[11px] text-slate-400">Payable after service</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-slate-900">
                      ₹{estimatedPrice}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Confirming Booking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Confirm & Send Request
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

